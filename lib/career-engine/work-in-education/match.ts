/**
 * Orchestrator: Work in My Education match pipeline (Batch 2 quality gates).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { evaluateRoleEligibility } from './evaluate-eligibility'
import {
  loadActiveFieldsAndSpecialisms,
  loadRolesForSpecialisms,
  loadStagesByIds,
} from './load-knowledge'
import { normaliseWorkInEducationProfile } from './normalise'
import { resolveFieldAndSpecialism } from './resolve-field'
import { rankAndBucketRoles } from './rank-roles'
import { QUALITY_GATE_THRESHOLDS } from './thresholds'
import type {
  EligibilityGap,
  MatchOptions,
  MatchQaSummary,
  QaSummaryFlag,
  RetrievalSource,
  WorkInEducationMatchResult,
  WorkInEducationProfile,
} from './types'
import { DEFAULT_MATCH_LIMITS } from './types'
import { validateWorkInEducationProfile } from './validate'

export type MatchRunResult =
  | { ok: true; result: WorkInEducationMatchResult }
  | { ok: false; errors: string[]; status: number }

/** Branch-regulated fields: related specialisms must not flood results. */
const STRICT_RELATED_FIELDS = new Set([
  'healthcare-medicine',
  'law-legal-justice',
  'engineering',
])

const GENERAL_ENTRY_TITLE =
  /\b(graduate|assistant|trainee|technician|apprentice|junior|support|entry)\b/i

function buildQaSummary(result: Omit<WorkInEducationMatchResult, 'qa_summary'>): MatchQaSummary {
  const flag = (ok: boolean, warn = false): QaSummaryFlag =>
    ok ? (warn ? 'WARNING' : 'PASS') : 'FAIL'

  const res = result.resolution
  const all = [
    ...result.recommendations.immediate,
    ...result.recommendations.realistic_next,
    ...result.recommendations.future_progression,
    ...result.recommendations.academic_or_research,
    ...result.recommendations.blocked_or_needs_review,
  ]

  const fieldOk = Boolean(res.primary_field)
  const specialismOk = !res.needs_clarification || res.clarification_options.length > 0
  const specialismPass = Boolean(res.primary_specialism) && !res.needs_clarification

  const badImmediateReg = result.recommendations.immediate.some(
    (r) =>
      r.effective_fit === 'immediate' &&
      (!r.eligibility.registration_match ||
        r.eligibility.qualification_scope_match === 'mismatched' ||
        r.eligibility.registration_scope_match === 'mismatched')
  )
  const badScope = result.recommendations.immediate.some(
    (r) =>
      r.eligibility.qualification_scope_match === 'mismatched' ||
      r.scope_gate.includes('mismatch')
  )
  const badSenior = result.recommendations.immediate.some((r) =>
    /\b(senior|director|head of|principal|chief)\b/i.test(r.role_title)
  )
  const badStage = result.recommendations.immediate.some(
    (r) =>
      r.professional_stage_gate === 'chartership_required' ||
      (r.stage.key === 'chartered_professional_engineer' &&
        r.demotion_reasons.length === 0 &&
        result.normalised_profile.years_relevant_experience < 2 &&
        !GENERAL_ENTRY_TITLE.test(r.role_title))
  )

  return {
    field_resolution: flag(fieldOk, res.needs_clarification),
    specialism_resolution: specialismPass
      ? 'PASS'
      : res.needs_clarification
        ? 'WARNING'
        : flag(specialismOk, true),
    regulated_role_safety: badImmediateReg ? 'FAIL' : 'PASS',
    scope_safety: badScope ? 'FAIL' : 'PASS',
    seniority_safety: badSenior ? 'FAIL' : 'PASS',
    professional_stage_safety: badStage ? 'FAIL' : all.some((r) => r.professional_stage_gate !== 'not_applicable') ? 'PASS' : 'PASS',
  }
}

export async function matchWorkInEducation(
  supabase: SupabaseClient,
  rawProfile: unknown,
  options: MatchOptions = {}
): Promise<MatchRunResult> {
  const started = Date.now()
  const validated = validateWorkInEducationProfile(rawProfile)
  if (!validated.ok) return { ok: false, errors: validated.errors, status: 400 }

  const includeDrafts = options.includeDrafts ?? true
  const limits = { ...DEFAULT_MATCH_LIMITS, ...options.limits }
  const confidenceThreshold =
    options.confidenceThreshold ?? QUALITY_GATE_THRESHOLDS.minSpecialismConfidence
  const maxRelated = options.maxRelatedSpecialisms ?? 3
  const maxRolesPerSpecialism = options.maxRolesPerSpecialism ?? 60

  const profile = normaliseWorkInEducationProfile(validated.profile)
  let queryCount = 0

  const base = await loadActiveFieldsAndSpecialisms(supabase)
  queryCount += base.queryCount

  let resolution = resolveFieldAndSpecialism({
    profile,
    fields: base.fields,
    specialisms: base.specialisms,
    confidenceThreshold,
  })

  const forcedId = options.forceSpecialismId?.trim() || null
  if (forcedId) {
    const forced = base.specialisms.find((s) => s.id === forcedId)
    if (!forced) {
      return {
        ok: false,
        errors: ['forceSpecialismId is not a known active specialism'],
        status: 400,
      }
    }
    const field = base.fields.find((f) => f.id === forced.field_id) ?? null
    const allowed =
      resolution.clarification_options.some((o) => o.id === forcedId) ||
      resolution.primary_specialism?.id === forcedId ||
      resolution.alternative_specialisms.some((s) => s.id === forcedId)
    if (!allowed) {
      return {
        ok: false,
        errors: ['forceSpecialismId must be one of the returned clarification options'],
        status: 400,
      }
    }
    resolution = {
      ...resolution,
      primary_field: field
        ? {
            id: field.id,
            name: field.name,
            slug: field.slug,
            score: 1,
            reasons: ['Forced via clarification selection'],
          }
        : resolution.primary_field,
      primary_specialism: {
        id: forced.id,
        name: forced.name,
        slug: forced.slug,
        score: 1,
        reasons: ['User-selected clarification specialism'],
      },
      needs_clarification: false,
      clarification_reason: null,
      clarification_options: [],
      confidence: Math.max(resolution.confidence, 0.9),
      match_reasons: [
        ...resolution.match_reasons,
        `Forced specialism from clarification: ${forced.name}`,
      ],
    }
  }

  type SpecLoad = { id: string; source: RetrievalSource; relation_reason: string }
  const toLoad: SpecLoad[] = []

  if (resolution.primary_specialism) {
    toLoad.push({
      id: resolution.primary_specialism.id,
      source: 'primary_specialism',
      relation_reason: 'Exact resolved primary specialism',
    })

    const fieldSlug = resolution.primary_field?.slug ?? ''
    const strict = STRICT_RELATED_FIELDS.has(fieldSlug)
    const relatedLimit = strict ? 0 : Math.min(maxRelated, 2)

    for (const alt of resolution.alternative_specialisms.slice(0, relatedLimit)) {
      if (alt.score >= confidenceThreshold && alt.score >= resolution.confidence - 0.08) {
        toLoad.push({
          id: alt.id,
          source: 'related_specialism',
          relation_reason: `High-confidence related specialism (score ${alt.score})`,
        })
      }
    }
  } else if (resolution.needs_clarification) {
    // Do NOT retrieve from arbitrary narrow specialism.
    // Optional: tiny general-entry preview from primary field only when clearly general roles.
    // Skip role flood — return clarification without role pools from random specialisms.
  }

  const specialismIds = toLoad.map((t) => t.id)
  const sourceBySpec = new Map(toLoad.map((t) => [t.id, t]))

  const roleLoad = await loadRolesForSpecialisms(supabase, specialismIds, {
    includeDrafts,
    maxPerSpecialism: maxRolesPerSpecialism,
  })
  queryCount += roleLoad.queryCount

  const stageIds = roleLoad.roles.map((r) => r.stage_id).filter((id): id is string => Boolean(id))
  const stages = await loadStagesByIds(supabase, stageIds)
  queryCount += stages.queryCount

  const fieldById = new Map(base.fields.map((f) => [f.id, f]))
  const specById = new Map(base.specialisms.map((s) => [s.id, s]))
  const specialismRank = new Map(specialismIds.map((id, i) => [id, i]))

  const evaluatedItems = []
  for (const role of roleLoad.roles) {
    const specialism = specById.get(role.specialism_id)
    if (!specialism) continue
    const field = fieldById.get(specialism.field_id)
    if (!field) continue
    const stage = role.stage_id ? stages.stagesById.get(role.stage_id) ?? null : null
    const src = sourceBySpec.get(role.specialism_id)
    const evaluated = evaluateRoleEligibility({
      role,
      specialism,
      field,
      stage,
      profile,
      retrieval_source: src?.source ?? 'primary_specialism',
      relation_reason: src?.relation_reason ?? '',
    })
    evaluatedItems.push({
      evaluated,
      role,
      specialismRank: specialismRank.get(role.specialism_id) ?? 9,
      field,
      specialism,
      stage,
    })
  }

  const recommendations = rankAndBucketRoles({
    items: evaluatedItems,
    profile,
    resolution,
    limits,
  })

  const allRecs = [
    ...recommendations.immediate,
    ...recommendations.realistic_next,
    ...recommendations.future_progression,
    ...recommendations.academic_or_research,
    ...recommendations.blocked_or_needs_review,
  ]

  const overall_gaps: EligibilityGap[] = []
  const gapCodes = new Set<string>()
  if (resolution.needs_clarification) {
    overall_gaps.push({
      type: 'clarification',
      severity: 'warning',
      code: resolution.clarification_reason ?? 'needs_clarification',
      message_key: `career.clarification.${resolution.clarification_reason ?? 'needed'}`,
      message: 'Specialism clarification required before precise role recommendations',
      details: { options: resolution.clarification_options.length },
    })
    gapCodes.add(resolution.clarification_reason ?? 'needs_clarification')
  }
  for (const r of allRecs) {
    for (const g of r.gaps) {
      if (gapCodes.has(g.code)) continue
      gapCodes.add(g.code)
      overall_gaps.push(g)
    }
  }

  const warnings: string[] = []
  if (resolution.needs_clarification) {
    warnings.push('Field/specialism resolution needs clarification before strong recommendations')
  }
  if (!profile.is_uk_qualification && profile.qualification_country) {
    warnings.push('Non-UK qualification — recognition may be required for regulated pathways')
  }
  if (includeDrafts) {
    warnings.push('Draft library roles included for integration testing — not for public publish')
  }

  const qualification_recognition = {
    review_needed: !profile.is_uk_qualification && Boolean(profile.qualification_country),
    reason: !profile.is_uk_qualification
      ? 'Qualification country is not UK — verify recognition for regulated practice'
      : '',
    country: profile.qualification_country ?? profile.institution_country ?? '',
  }

  const partial = {
    pathway: 'work_in_my_education' as const,
    profile_summary: {
      education_level: profile.education_level,
      qualification_title: profile.qualification_title_raw,
      subject: profile.subject_raw,
      specialisation: profile.specialisation_raw,
      years_relevant_experience: profile.years_relevant_experience,
      qualification_country: profile.qualification_country,
    },
    normalised_profile: profile,
    resolution,
    recommendations,
    qualification_recognition,
    overall_gaps,
    warnings,
    data_provenance: {
      source: 'career_knowledge_library' as const,
      role_ids: allRecs.map((r) => r.role_id),
      field_ids: [
        ...new Set(
          [resolution.primary_field?.id, ...resolution.alternative_fields.map((f) => f.id)].filter(
            Boolean
          ) as string[]
        ),
      ],
      specialism_ids: specialismIds,
    },
    meta: {
      query_count: queryCount,
      elapsed_ms: Date.now() - started,
      candidate_roles_considered: roleLoad.roles.length,
      include_drafts: includeDrafts,
      confidence_threshold: confidenceThreshold,
      score_margin_threshold: QUALITY_GATE_THRESHOLDS.minScoreMargin,
    },
  }

  const result: WorkInEducationMatchResult = {
    ...partial,
    qa_summary: buildQaSummary(partial),
  }

  return { ok: true, result }
}

export type { WorkInEducationProfile }
