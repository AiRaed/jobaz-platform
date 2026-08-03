/**
 * Deterministic field + specialism resolution with broad-subject ambiguity gates.
 */

import { aliasKey, buildAliasIndex, resolveAlias } from './aliases'
import {
  BROAD_SUBJECT_KEYS,
  QUALITY_GATE_THRESHOLDS,
  type ClarificationReason,
} from './thresholds'
import type {
  FieldSpecialismResolution,
  KnowledgeFieldRow,
  KnowledgeSpecialismRow,
  NormalisedWorkInEducationProfile,
  ResolvedEntityRef,
} from './types'

export const DEFAULT_CONFIDENCE_THRESHOLD = QUALITY_GATE_THRESHOLDS.minSpecialismConfidence

type ScoredSpecialism = {
  specialism: KnowledgeSpecialismRow
  field: KnowledgeFieldRow
  score: number
  reasons: string[]
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const as = new Set(a)
  const bs = new Set(b)
  let inter = 0
  for (const t of as) if (bs.has(t)) inter += 1
  const union = as.size + bs.size - inter
  return union === 0 ? 0 : inter / union
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle || needle.length < 3) return false
  return ` ${haystack} `.includes(` ${needle} `)
}

export function isBroadSubject(profile: NormalisedWorkInEducationProfile): boolean {
  const subject = profile.subject_normalised
  if (!subject) return false
  if (BROAD_SUBJECT_KEYS.has(subject)) return true
  // Single-token broad subjects
  if (profile.subject_tokens.length === 1 && BROAD_SUBJECT_KEYS.has(profile.subject_tokens[0])) {
    return true
  }
  return false
}

export function hasDiscriminatingSpecialisation(profile: NormalisedWorkInEducationProfile): boolean {
  const spec = profile.specialisation_normalised
  if (spec && spec.length >= 3 && spec !== profile.subject_normalised) return true
  // Qualification title carries a branch e.g. "LLB Commercial Law", "BSc Adult Nursing"
  const title = profile.qualification_title_raw.toLowerCase()
  const subject = profile.subject_raw.toLowerCase()
  if (/commercial|human rights|corporate|criminal|family|immigration|property|public international/i.test(title)) {
    return true
  }
  if (/adult nursing|mental health nursing|children'?s nursing|learning disability|midwif/i.test(title)) {
    return true
  }
  if (/civil engineering|mechanical engineering|electrical engineering|chemical engineering/i.test(title + ' ' + subject)) {
    // "Civil Engineering" as subject is discriminating (not bare "Engineering")
    if (/civil|mechanical|electrical|chemical|aerospace|structural/i.test(subject)) return true
  }
  if (/animation|computer animation|3d animation/i.test(title + ' ' + subject)) return true
  if (/computer science|software engineering/i.test(title + ' ' + subject) && subject !== 'computing') {
    // CS is still somewhat broad for IT — treat as broad unless specialisation present
    return Boolean(spec)
  }
  return false
}

export function scoreSpecialismAgainstProfile(
  specialism: KnowledgeSpecialismRow,
  field: KnowledgeFieldRow,
  profile: NormalisedWorkInEducationProfile
): ScoredSpecialism {
  const reasons: string[] = []
  let score = 0

  const specKey = aliasKey(specialism.name)
  const specSlug = aliasKey(specialism.slug.replace(/-/g, ' '))
  const fieldKey = aliasKey(field.name)
  const descKey = aliasKey(`${specialism.description} ${field.description}`)
  const subject = profile.subject_normalised
  const specialisation = profile.specialisation_normalised ?? ''
  const title = aliasKey(profile.qualification_title_raw)
  const titleRaw = profile.qualification_title_raw

  const specTokens = aliasKey(`${specialism.name} ${specialism.slug.replace(/-/g, ' ')}`)
    .split(' ')
    .filter(Boolean)
  const fieldTokens = fieldKey.split(' ').filter(Boolean)

  const broad = isBroadSubject(profile) && !hasDiscriminatingSpecialisation(profile)

  // Exact subject / specialisation
  if (subject && (subject === specKey || subject === specSlug)) {
    // Exact match to a narrow specialism name — strong; but bare "law" won't equal "administrative law"
    score += 0.45
    reasons.push(`Exact subject match to specialism "${specialism.name}"`)
  } else if (subject && !broad && containsPhrase(specKey, subject)) {
    score += 0.32
    reasons.push(`Subject contained in specialism "${specialism.name}"`)
  } else if (subject && !broad && containsPhrase(subject, specKey) && specKey.length >= 5) {
    score += 0.28
    reasons.push(`Specialism name contained in subject`)
  } else if (subject && broad && containsPhrase(specKey, subject)) {
    // Broad subject contained in many specialisms (e.g. "law" in "administrative law") — weak only
    score += 0.12
    reasons.push(`Broad subject token present in specialism "${specialism.name}" (weak)`)
  }

  if (specialisation) {
    if (specialisation === specKey || specialisation === specSlug) {
      score += 0.4
      reasons.push(`Exact specialisation match to "${specialism.name}"`)
    } else if (containsPhrase(specKey, specialisation) || containsPhrase(specialisation, specKey)) {
      score += 0.28
      reasons.push(`Specialisation overlaps specialism "${specialism.name}"`)
    }
  }

  // Title discrimination e.g. "Commercial Law", "Adult Nursing", "Civil Engineering"
  if (titleRaw) {
    if (containsPhrase(title, specKey) || containsPhrase(specKey, title)) {
      score += 0.35
      reasons.push(`Qualification title strongly overlaps specialism "${specialism.name}"`)
    } else {
      // token overlap with title
      const titleTokens = title.split(' ').filter((t) => t.length > 2)
      const tOverlap = jaccard(titleTokens, specTokens)
      if (tOverlap >= 0.4) {
        score += tOverlap * 0.25
        reasons.push(`Qualification title keyword overlap with specialism`)
      }
    }
  }

  // Field relevance (important for broad subjects — keep field even without specialism)
  if (
    subject &&
    (subject === fieldKey ||
      containsPhrase(fieldKey, subject) ||
      containsPhrase(subject, fieldKey) ||
      (subject === 'law' && field.slug === 'law-legal-justice') ||
      (subject === 'engineering' && field.slug === 'engineering') ||
      (subject === 'nursing' && field.slug === 'healthcare-medicine') ||
      ((subject === 'biology' || subject === 'biological sciences') &&
        field.slug === 'natural-sciences-research') ||
      ((subject === 'business' || subject === 'business management') &&
        field.slug === 'business-management') ||
      ((subject === 'computing' || subject === 'computer science') && field.slug === 'it-technology') ||
      (subject === 'animation' && field.slug.includes('arts')) ||
      (subject.includes('tourism') && field.slug.includes('hospitality')))
  ) {
    score += broad ? 0.08 : 0.18
    reasons.push(`Subject aligns with field "${field.name}"`)
  }

  const subjectOverlap = jaccard(profile.subject_tokens, specTokens)
  if (!broad && subjectOverlap >= 0.34) {
    score += subjectOverlap * 0.28
    reasons.push(`Subject keyword overlap ${(subjectOverlap * 100).toFixed(0)}%`)
  } else if (broad && subjectOverlap >= 0.5) {
    score += subjectOverlap * 0.08
  }

  const fieldOverlap = jaccard(profile.subject_tokens, fieldTokens)
  if (fieldOverlap >= 0.34) score += fieldOverlap * (broad ? 0.06 : 0.12)

  const specOverlap = jaccard(profile.specialisation_tokens, specTokens)
  if (specOverlap >= 0.3) {
    score += specOverlap * 0.22
    reasons.push(`Specialisation keyword overlap ${(specOverlap * 100).toFixed(0)}%`)
  }

  if (!broad && subject && containsPhrase(descKey, subject)) {
    score += 0.08
  }

  const skillOverlap = jaccard(profile.skill_tokens, specTokens)
  if (skillOverlap >= 0.25) score += skillOverlap * 0.1

  const jobOverlap = jaccard(profile.current_job_tokens, [...specTokens, ...fieldTokens])
  if (jobOverlap >= 0.25) score += jobOverlap * 0.12

  const index = buildAliasIndex()
  for (const raw of [profile.subject_raw, profile.specialisation_raw ?? '', profile.qualification_title_raw]) {
    if (!raw) continue
    const hit = resolveAlias(raw, index)
    if (hit.target_slug && hit.target_slug === specialism.slug) {
      // Don't let broad-subject alias force a narrow specialism unless discriminating
      if (!broad || hasDiscriminatingSpecialisation(profile)) {
        score += 0.3
        reasons.push(`Alias maps to specialism slug "${specialism.slug}"`)
      }
      break
    }
  }

  if (
    field.slug === 'it-technology' &&
    (/\bcomputer science\b|\bcomputing\b|\bsoftware\b/.test(subject) ||
      profile.subject_tokens.includes('computer') ||
      profile.subject_tokens.includes('computing'))
  ) {
    if (/software|web|fullstack|full stack|programming|developer/.test(specKey + ' ' + specSlug)) {
      score += broad ? 0.1 : 0.22
    } else {
      score += 0.05
    }
  }

  if (profile.career_preferences.wants_academic_route && /research|science|academic/i.test(field.name)) {
    score += 0.04
  }

  return {
    specialism,
    field,
    score: Math.min(1, score),
    reasons: reasons.slice(0, 6),
  }
}

function pickBestFieldFromScores(
  scored: ScoredSpecialism[],
  rankedFields: Array<{ field: KnowledgeFieldRow; score: number; reasons: string[] }>
): { field: KnowledgeFieldRow; score: number; reasons: string[] } | null {
  if (rankedFields[0]) return rankedFields[0]
  if (scored[0]) {
    return { field: scored[0].field, score: scored[0].score, reasons: scored[0].reasons }
  }
  return null
}

export function resolveFieldAndSpecialism(args: {
  profile: NormalisedWorkInEducationProfile
  fields: KnowledgeFieldRow[]
  specialisms: KnowledgeSpecialismRow[]
  confidenceThreshold?: number
  minScoreMargin?: number
}): FieldSpecialismResolution {
  const threshold = args.confidenceThreshold ?? QUALITY_GATE_THRESHOLDS.minSpecialismConfidence
  const minMargin = args.minScoreMargin ?? QUALITY_GATE_THRESHOLDS.minScoreMargin
  const window = QUALITY_GATE_THRESHOLDS.broadSubjectAmbiguityWindow
  const fieldById = new Map(args.fields.map((f) => [f.id, f]))

  const missingSubject =
    !args.profile.subject_normalised && !args.profile.specialisation_normalised
  const broad = isBroadSubject(args.profile) && !hasDiscriminatingSpecialisation(args.profile)

  const scored: ScoredSpecialism[] = []
  for (const spec of args.specialisms) {
    if (!spec.active) continue
    const field = fieldById.get(spec.field_id)
    if (!field || !field.active) continue
    scored.push(scoreSpecialismAgainstProfile(spec, field, args.profile))
  }

  scored.sort((a, b) => b.score - a.score || a.specialism.name.localeCompare(b.specialism.name))

  const top = scored[0] ?? null
  const second = scored[1] ?? null
  const confidence = top?.score ?? 0
  const score_margin = top && second ? top.score - second.score : confidence

  const fieldScores = new Map<string, { field: KnowledgeFieldRow; score: number; reasons: string[] }>()
  for (const row of scored.slice(0, 50)) {
    const prev = fieldScores.get(row.field.id)
    const nextScore = Math.max(prev?.score ?? 0, row.score * 0.85 + (prev?.score ?? 0) * 0.15)
    // Boost field when subject matches field even if specialisms are weak/broad
    let fieldBoost = nextScore
    if (broad || args.profile.subject_normalised) {
      const sk = args.profile.subject_normalised
      if (
        (sk === 'law' && row.field.slug === 'law-legal-justice') ||
        (sk === 'engineering' && row.field.slug === 'engineering') ||
        (sk === 'nursing' && row.field.slug === 'healthcare-medicine')
      ) {
        fieldBoost = Math.max(fieldBoost, 0.55)
      }
    }
    fieldScores.set(row.field.id, {
      field: row.field,
      score: fieldBoost,
      reasons: prev?.reasons?.length ? prev.reasons : row.reasons.slice(0, 3),
    })
  }
  const rankedFields = [...fieldScores.values()].sort((a, b) => b.score - a.score)

  const toRef = (
    id: string,
    name: string,
    slug: string,
    score: number,
    reasons: string[]
  ): ResolvedEntityRef => ({ id, name, slug, score: Number(score.toFixed(4)), reasons })

  // Ambiguity detection
  let clarification_reason: ClarificationReason = null
  let needs_clarification = false
  let primary_specialism: ResolvedEntityRef | null = null

  const closePeers = scored.filter(
    (s) => s.score >= Math.max(QUALITY_GATE_THRESHOLDS.clarificationMinScore, confidence - window)
  )

  if (missingSubject) {
    needs_clarification = true
    clarification_reason = 'missing_subject'
  } else if (broad && closePeers.length >= 2) {
    needs_clarification = true
    clarification_reason = 'broad_subject_multiple_valid_specialisms'
  } else if (confidence < threshold) {
    needs_clarification = true
    clarification_reason = 'low_confidence'
  } else if (second && score_margin < minMargin && closePeers.length >= 2) {
    needs_clarification = true
    clarification_reason = 'close_score_margin'
  }

  // Strong exact specialisation evidence forces resolution (skip broad ambiguity)
  const exactSpecHit = scored.find(
    (s) =>
      args.profile.specialisation_normalised &&
      (aliasKey(s.specialism.name) === args.profile.specialisation_normalised ||
        aliasKey(s.specialism.slug.replace(/-/g, ' ')) === args.profile.specialisation_normalised)
  )
  if (exactSpecHit && exactSpecHit.score >= 0.35) {
    needs_clarification = false
    clarification_reason = null
    primary_specialism = toRef(
      exactSpecHit.specialism.id,
      exactSpecHit.specialism.name,
      exactSpecHit.specialism.slug,
      exactSpecHit.score,
      exactSpecHit.reasons
    )
  } else if (!needs_clarification && top && confidence >= threshold) {
    primary_specialism = toRef(
      top.specialism.id,
      top.specialism.name,
      top.specialism.slug,
      top.score,
      top.reasons
    )
  }

  const bestField = pickBestFieldFromScores(scored, rankedFields)
  const primary_field = bestField
    ? toRef(
        bestField.field.id,
        bestField.field.name,
        bestField.field.slug,
        bestField.score,
        bestField.reasons.length
          ? bestField.reasons
          : primary_specialism
            ? [`Resolved via specialism "${primary_specialism.name}"`]
            : ['Field resolved from subject alignment']
      )
    : null

  // Clarification options: prefer same-field specialisms when field known
  const optionPool = primary_field
    ? scored.filter((s) => s.field.id === primary_field.id)
    : scored
  const clarification_options = (needs_clarification ? optionPool : scored.slice(0, 0))
    .filter((s) => s.score >= QUALITY_GATE_THRESHOLDS.clarificationMinScore)
    .slice(0, 10)
    .map((s) => ({
      type: 'specialism' as const,
      id: s.specialism.id,
      name: s.specialism.name,
      slug: s.specialism.slug,
      score: Number(s.score.toFixed(4)),
      reason: s.reasons[0] ?? 'Candidate specialism in resolved field',
    }))

  const alternative_specialisms = (
    primary_specialism
      ? scored.filter((s) => s.specialism.id !== primary_specialism!.id)
      : scored
  )
    .slice(0, 8)
    .filter((s) => s.score >= Math.max(0.15, confidence * 0.4))
    .map((s) => toRef(s.specialism.id, s.specialism.name, s.specialism.slug, s.score, s.reasons))

  const alternative_fields = rankedFields
    .filter((f) => f.field.id !== primary_field?.id)
    .slice(0, 5)
    .map((f) => toRef(f.field.id, f.field.name, f.field.slug, f.score, f.reasons))

  const match_reasons: string[] = []
  if (missingSubject) match_reasons.push('Subject missing — clarification required')
  if (broad) match_reasons.push('Broad subject detected — narrow specialism not forced')
  if (primary_field) {
    match_reasons.push(`Primary field "${primary_field.name}" (score ${primary_field.score})`)
  }
  if (primary_specialism) {
    match_reasons.push(
      `Primary specialism "${primary_specialism.name}" (confidence ${confidence.toFixed(2)}, margin ${score_margin.toFixed(2)})`
    )
    match_reasons.push(...primary_specialism.reasons.slice(0, 3))
  } else if (needs_clarification) {
    match_reasons.push(`Needs clarification (${clarification_reason})`)
  }

  return {
    primary_field,
    alternative_fields,
    primary_specialism,
    alternative_specialisms,
    confidence: Number(confidence.toFixed(4)),
    score_margin: Number(score_margin.toFixed(4)),
    is_broad_subject: broad,
    match_reasons,
    needs_clarification,
    clarification_reason,
    clarification_options,
  }
}
