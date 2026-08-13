/**
 * Public-safe result contract for Career Assistant (filtered from internal matcher).
 */

import type { RoleEligibilityResult, WorkInEducationMatchResult } from './types'
import type { WorkInEducationAssessmentResult } from './assessment/types'
import { confidenceLabel, fitLabel, eligibilityBadge } from './wizard/labels'
import { buildRoleWhyItems, buildFitLeadIn } from './wizard/explain-why'
import { limitClarificationOptions } from './clarification-limit'
import type { WieTrainingRecommendations } from './course-alignment/completed-courses'
import { polishWieRoleTitle } from './match-safety/role-title-polish'
import {
  polishPublicRoleCopy,
  FUTURE_ROUTE_SOFT_LINE,
  demoteImmediateMatchType,
} from './match-safety/public-card-polish'
import { matchTypeLabel } from './match-safety/friendly-copy'
import type { WieStageContext } from './stage-semantics'
import { towardTargetNote } from './stage-semantics'

export type PublicConfidenceLabel = 'high' | 'medium' | 'needs_clarification'

export type PublicRoleCard = {
  /** Knowledge Library role id — used only to load pathway enrichment */
  pathway_id: string
  title: string
  field_name: string
  specialism_name: string
  /** Qualitative match label (Strong / Good / Developing / Long-term) — single badge with status */
  category: string
  /** Canonical eligibility status label (Eligible now, Developing match, …) */
  eligibility_label: string
  stage_label: string | null
  /** Match strength 0–100 from Scoring v2 */
  match_score: number
  why: string[]
  lead_in: string
  experience_note: string | null
  registration_note: string | null
  requirements: string[]
  next_step: string | null
  /** Scoring v2 status key when available */
  eligibility_status?: string
  result_group?: string
  /** Global match-safety classification */
  match_type?:
    | 'best_immediate_route'
    | 'developing_match'
    | 'future_career_option'
    | 'needs_review_regulated'
    | 'not_recommended_now'
  /** Admin/dev only — blocker codes */
  blockers?: string[]
  /** When target stage is set — explains immediate vs progression */
  toward_target_note?: string | null
  typical_experience_note?: string | null
  progression_hint?: string | null
}

export type PublicNextAction = {
  type: string
  label: string
  text: string
}

export type PublicWieAssessmentResult = {
  status: 'complete' | 'needs_clarification' | 'invalid'
  pathway: 'work_in_my_education'
  headline: {
    text: string
    key: string
  }
  matched_direction: {
    field: string
    specialism: string
    confidence_label: PublicConfidenceLabel
  }
  /** Clear target vs readiness (not a single ambiguous "Stage") */
  stage_context?: WieStageContext | null
  summary_lines: string[]
  recommendations: {
    /** Matcher bucket: immediate */
    available_now: PublicRoleCard[]
    /** Matcher bucket: realistic_next */
    realistic_next: PublicRoleCard[]
    /** Matcher bucket: future_progression */
    future_options: PublicRoleCard[]
    /** Matcher bucket: academic_or_research */
    academic_research: PublicRoleCard[]
    /** Matcher bucket: blocked_or_needs_review */
    requirements_needed: PublicRoleCard[]
  }
  /** Counts from the same grouped matcher response (no re-match). */
  role_counts: {
    immediate: number
    realistic_next: number
    future_progression: number
    academic_or_research: number
    blocked_or_needs_review: number
    candidate_roles_considered: number
    include_drafts: boolean
  }
  clarification: {
    required: boolean
    question: string
    options: Array<{
      id: string
      label: string
      help?: string
    }>
    include_not_sure: boolean
  }
  next_actions: PublicNextAction[]
  warnings: string[]
  result_token: string
  /** Course Library comparison — completed vs recommended (optional). */
  training_recommendations?: WieTrainingRecommendations | null
}

function mapConfidence(label: string): PublicConfidenceLabel {
  if (label === 'High') return 'high'
  if (label === 'Medium') return 'medium'
  return 'needs_clarification'
}

function experienceNote(role: RoleEligibilityResult): string | null {
  if (role.evaluation) {
    const gap = role.evaluation.unmetRequirements?.find((u) => /experience/i.test(u))
    if (gap) return gap
    const ok = role.evaluation.matchedReasons?.find((m) => /experience/i.test(m))
    return ok ?? null
  }
  if (role.eligibility.experience_match) return 'Experience looks sufficient for this role'
  const gap = role.gaps.find((g) => g.type === 'experience')
  return gap?.message ?? 'More relevant experience is typically needed'
}

function registrationNote(role: RoleEligibilityResult): string | null {
  if (role.evaluation) {
    const gap = role.evaluation.unmetRequirements?.find((u) =>
      /registration|charter|licence|qts|nmc|hcpc|sra/i.test(u)
    )
    if (gap) {
      // Soften generic professional-registration defaults for non-regulated wording
      if (/chartered or professional registration status is unconfirmed|commonly expected|professional registration required or commonly expected/i.test(gap)) {
        return 'Some employers may ask for qualification evidence.'
      }
      return gap
    }
    if (
      role.evaluation.matchedReasons?.some((m) =>
        /registration requirements appear met|hold registration that is desirable/i.test(m)
      )
    ) {
      return null
    }
    const warn = role.evaluation.warnings?.find((w) =>
      /registration|charter|qts|nmc|hcpc/i.test(w)
    )
    if (warn && /desirable but not mandatory|unclear in the library/i.test(warn)) {
      return 'Some employers may ask for qualification evidence.'
    }
    return warn ?? null
  }
  if (role.eligibility.registration_match) return null
  const gap = role.gaps.find(
    (g) =>
      g.type === 'registration' || g.type === 'registration_scope' || g.type === 'professional_status'
  )
  if (!gap) return null
  if (
    /commonly expected|missing_or_unknown|Professional registration required/i.test(gap.message) &&
    !/nurse|solicitor|teacher|chartered|psychologist|barrister|midwife/i.test(role.role_title)
  ) {
    return 'Some employers may ask for qualification evidence.'
  }
  return gap.message
}

function nextStepFor(role: RoleEligibilityResult): string | null {
  if (role.evaluation?.nextBestAction) return role.evaluation.nextBestAction
  if (role.effective_fit === 'immediate') return 'Explore this as an available option now'
  if (role.effective_fit === 'realistic_next') return 'Build experience or credentials toward this role'
  if (role.effective_fit === 'future_progression')
    return 'Plan a longer pathway (e.g. chartership or senior stage)'
  if (role.effective_fit === 'academic_or_research') return 'Consider academic or research routes'
  const first = role.gaps[0]?.message
  return first ?? 'Review requirements before applying'
}

export function toPublicRoleCard(
  role: RoleEligibilityResult,
  stageContext?: WieStageContext | null
): PublicRoleCard {
  let safetyType = role.demotion_reasons
    .find((d) => d.startsWith('safety:') && !d.startsWith('safety_reason:'))
    ?.replace(/^safety:/, '') as PublicRoleCard['match_type'] | undefined

  const polishedTitle = polishWieRoleTitle(
    role.role_title,
    role.field.name,
    role.specialism.name,
    role.field.slug
  )

  let why = buildRoleWhyItems(role)
    .map((w) => w.text)
    .map((t) => {
      if (/ambiguous|cannot automatically satisfy/i.test(t)) {
        return 'Some UK employers may ask for qualification recognition, portfolio evidence, or manual review depending on the role.'
      }
      if (/does not require prior experience/i.test(t)) {
        if (
          safetyType === 'future_career_option' ||
          safetyType === 'needs_review_regulated' ||
          safetyType === 'not_recommended_now'
        ) {
          return FUTURE_ROUTE_SOFT_LINE
        }
        if (safetyType === 'best_immediate_route') {
          return 'This role is suitable as an early-career starting point.'
        }
        return 'This may be possible after relevant UK experience.'
      }
      return t
    })

  let requirements = (
    role.evaluation?.unmetRequirements.slice(0, 6) ??
    role.gaps.slice(0, 4).map((g) => g.message)
  ).map((t) =>
    /ambiguous|cannot automatically satisfy/i.test(t)
      ? 'Some UK employers may ask for qualification recognition, portfolio evidence, or manual review depending on the role.'
      : t
  )

  // Final immediate demotion using public-facing copy
  if (safetyType === 'best_immediate_route') {
    const demoted = demoteImmediateMatchType({
      matchType: 'best_immediate_route',
      title: polishedTitle,
      whyLines: why,
      requirementLines: requirements,
      fieldName: role.field.name,
      specialismName: role.specialism.name,
      fieldSlug: role.field.slug,
      yearsExperience: stageContext?.years_relevant_experience,
    })
    if (demoted !== 'best_immediate_route') {
      safetyType = demoted
    }
  }

  const polished = polishPublicRoleCopy({
    matchType: safetyType,
    why,
    requirements,
  })
  why = polished.why
  requirements = polished.requirements

  const toward = towardTargetNote(stageContext)
  if (safetyType === 'best_immediate_route' && toward && !why.some((w) => /toward your/i.test(w))) {
    why = [...why, toward].slice(0, 6)
  }

  const years = stageContext?.years_relevant_experience ?? 0
  const typicalFromTitle = /\b(director|head\b|senior|lead|manager)\b/i.test(polishedTitle)
    ? '10+ years typically required for this level'
    : /\b(officer|coordinator|specialist)\b/i.test(polishedTitle) &&
        safetyType === 'future_career_option'
      ? 'Several years of relevant experience typically required'
      : null

  if (safetyType === 'future_career_option') {
    const gapLine = `Your current relevant experience: ${years} years`
    if (!why.some((w) => /current relevant experience/i.test(w))) {
      why = [...why.filter((w) => !/more relevant experience/i.test(w)), gapLine].slice(0, 6)
    }
  }

  const statusLabel =
    (safetyType ? matchTypeLabel(safetyType) : null) ??
    role.evaluation?.statusLabel ??
    eligibilityBadge(role.eligibility.status)
  const qualitative =
    safetyType === 'best_immediate_route'
      ? 'Good match'
      : safetyType === 'developing_match'
        ? 'Practical adjacent match'
        : safetyType === 'needs_review_regulated'
          ? 'Needs review'
          : safetyType === 'future_career_option'
            ? stageContext?.stage_meaning === 'target'
              ? 'Target-level progression role'
              : 'Progression route'
            : role.evaluation?.qualitativeLabel ?? fitLabel(role.effective_fit)

  const blockers = role.evaluation?.scoreBreakdown?.caps_applied
    ?.filter((c) => c.startsWith('blocker.'))
    ?.slice(0, 8)

  return {
    pathway_id: role.role_id,
    title: polishedTitle,
    field_name: role.field.name,
    specialism_name: role.specialism.name,
    category: qualitative,
    eligibility_label: statusLabel,
    stage_label: role.stage.label,
    match_score: role.match_score,
    why,
    lead_in:
      safetyType === 'future_career_option'
        ? stageContext?.stage_meaning === 'target'
          ? 'Progression toward your target because'
          : 'Future route because'
        : safetyType === 'developing_match'
          ? 'Practical adjacent route because'
          : buildFitLeadIn(role),
    experience_note:
      safetyType === 'future_career_option' ? FUTURE_ROUTE_SOFT_LINE : experienceNote(role),
    registration_note:
      safetyType === 'future_career_option' ? null : registrationNote(role),
    requirements,
    next_step:
      safetyType === 'future_career_option' ? FUTURE_ROUTE_SOFT_LINE : nextStepFor(role),
    eligibility_status: role.evaluation?.eligibilityStatus,
    result_group:
      safetyType === 'best_immediate_route'
        ? 'immediate'
        : safetyType === 'developing_match'
          ? 'developing'
          : safetyType === 'needs_review_regulated' || safetyType === 'not_recommended_now'
            ? 'blocked_or_review'
            : 'future',
    match_type: safetyType,
    blockers,
    toward_target_note: safetyType === 'best_immediate_route' ? toward : null,
    typical_experience_note:
      safetyType === 'future_career_option' ? typicalFromTitle : null,
    progression_hint:
      safetyType === 'future_career_option' && stageContext?.stage_meaning === 'target'
        ? `Work toward ${stageContext.target_stage_label} via practical entry roles first, then specialist/officer experience.`
        : null,
  }
}

type MatcherGroupedRecommendations = WorkInEducationMatchResult['recommendations']

/**
 * Pass through matcher buckets, then re-bucket by final public match_type
 * (after title/copy demotion) so Best Immediate stays honest.
 */
export function mapMatcherRecommendationsToPublic(
  grouped: MatcherGroupedRecommendations | null | undefined,
  stageContext?: WieStageContext | null
) {
  const empty = {
    available_now: [] as PublicRoleCard[],
    realistic_next: [] as PublicRoleCard[],
    future_options: [] as PublicRoleCard[],
    academic_research: [] as PublicRoleCard[],
    requirements_needed: [] as PublicRoleCard[],
  }
  if (!grouped) return empty

  const raw = [
    ...(grouped.immediate ?? []),
    ...(grouped.realistic_next ?? []),
    ...(grouped.future_progression ?? []),
    ...(grouped.academic_or_research ?? []),
    ...(grouped.blocked_or_needs_review ?? []),
  ]
  const seen = new Set<string>()
  const out = { ...empty }

  for (const role of raw) {
    if (seen.has(role.role_id)) continue
    seen.add(role.role_id)
    const card = toPublicRoleCard(role, stageContext)
    switch (card.match_type) {
      case 'best_immediate_route':
        out.available_now.push(card)
        break
      case 'developing_match':
        out.realistic_next.push(card)
        break
      case 'needs_review_regulated':
      case 'not_recommended_now':
        out.requirements_needed.push(card)
        break
      case 'future_career_option':
      default:
        out.future_options.push(card)
        break
    }
  }

  return out
}

function roleCountsFromMatch(match: WorkInEducationMatchResult | null) {
  const g = match?.recommendations
  return {
    immediate: g?.immediate?.length ?? 0,
    realistic_next: g?.realistic_next?.length ?? 0,
    future_progression: g?.future_progression?.length ?? 0,
    academic_or_research: g?.academic_or_research?.length ?? 0,
    blocked_or_needs_review: g?.blocked_or_needs_review?.length ?? 0,
    candidate_roles_considered: match?.meta?.candidate_roles_considered ?? 0,
    include_drafts: match?.meta?.include_drafts ?? false,
  }
}

const USER_WARNING_BLOCK =
  /draft library|stripped unknown|Field\/specialism resolution|not for public/i

export function buildPublicWieAssessmentResult(
  assessment: WorkInEducationAssessmentResult,
  resultToken: string,
  stageContext?: WieStageContext | null
): PublicWieAssessmentResult {
  const conf = confidenceLabel({
    needs_clarification: assessment.clarification.required,
    confidence: assessment.resolution?.confidence ?? 0,
  })

  const limited = limitClarificationOptions(assessment.clarification.options, 8)

  // Prefer match.recommendations; fall back to assessment.recommendations (same grouped object).
  const grouped =
    assessment.match?.recommendations ?? assessment.recommendations ?? null
  const recommendations = mapMatcherRecommendationsToPublic(grouped, stageContext)

  return {
    status: assessment.assessment_status,
    pathway: 'work_in_my_education',
    headline: {
      text: assessment.presentation.headline,
      key: assessment.presentation.headline_key,
    },
    matched_direction: {
      field: assessment.resolution?.primary_field?.name ?? '',
      specialism: assessment.resolution?.primary_specialism?.name ?? '',
      confidence_label: mapConfidence(conf),
    },
    stage_context: stageContext ?? null,
    summary_lines: assessment.presentation.summary_items.map((s) => s.text),
    recommendations,
    role_counts: roleCountsFromMatch(assessment.match),
    clarification: {
      required: assessment.clarification.required,
      question: assessment.clarification.required
        ? 'Which area best matches your qualification?'
        : '',
      options: limited.map((o) => ({
        id: o.specialism_id,
        label: o.name,
        help: o.reason,
      })),
      include_not_sure: assessment.clarification.required,
    },
    next_actions: assessment.next_actions.map((a) => ({
      type: a.type,
      label: a.type.replace(/_/g, ' '),
      text: a.text,
    })),
    warnings: (assessment.warnings ?? []).filter((w) => !USER_WARNING_BLOCK.test(w)),
    result_token: resultToken,
  }
}
