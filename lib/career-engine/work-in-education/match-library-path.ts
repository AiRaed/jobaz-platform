/**
 * Library-path matcher: Field → Specialism → Stage → Roles.
 * Resolution is fixed from library IDs (no NLP). Reuses eligibility + Scoring v2.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveNormalizedQualification } from '@/lib/career-engine/qualification-taxonomy'
import { QUALITY_GATE_THRESHOLDS } from './thresholds'
import { evaluateRoleEligibility } from './evaluate-eligibility'
import {
  loadLibraryFieldById,
  loadLibraryRolesForSpecialismStage,
  loadLibrarySpecialismsForField,
  loadLibraryStageById,
  loadLibraryStagesForSpecialism,
} from './library-browse'
import { loadStagesByIds } from './load-knowledge'
import { normaliseWorkInEducationProfile } from './normalise'
import { rankAndBucketRoles } from './rank-roles'
import { applyMatchSafety } from './match-safety'
import {
  buildWieStageContext,
  matchingStageForImmediateRoutes,
  WIE_LIBRARY_PATH_STAGE_MEANING,
} from './stage-semantics'
import type {
  EligibilityGap,
  FieldSpecialismResolution,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
  MatchQaSummary,
  QaSummaryFlag,
  WorkInEducationMatchResult,
  WorkInEducationProfile,
} from './types'

export type LibraryPathSelection = {
  field_id: string
  specialism_id: string
  stage_id: string
}

export type LibraryPathMatchOptions = {
  includeDrafts?: boolean
  yearsRelevantExperience?: number
  completedTrainingCount?: number
}

export type LibraryPathMatchRun =
  | {
      ok: true
      result: WorkInEducationMatchResult
      selection: {
        field: { id: string; name: string; slug: string }
        specialism: { id: string; name: string; slug: string }
        stage: { id: string; label: string; stage_key: string }
      }
      stage_context: import('./stage-semantics').WieStageContext
    }
  | { ok: false; errors: string[]; status: number; code?: string }

function buildBrowseProfile(
  specialism: KnowledgeSpecialismRow,
  stage: KnowledgeStageRow,
  yearsRelevantExperience = 0
): WorkInEducationProfile {
  const title = `${specialism.name} · ${stage.label}`
  const qualification = resolveNormalizedQualification({
    education_level: 'other',
    qualification_title: title,
    qualification_country: 'United Kingdom',
  })
  return {
    education_level: 'other',
    qualification_title: title,
    subject: specialism.name,
    specialisation: specialism.name,
    qualification_country: 'United Kingdom',
    institution_country: 'United Kingdom',
    graduation_status: 'completed',
    years_relevant_experience: yearsRelevantExperience,
    professional_registration: [],
    licences: [],
    skills: [],
    career_preferences: {
      wants_related_field_only: true,
      open_to_retraining: null,
      wants_academic_route: null,
    },
    qualification_group: qualification.group,
    qualification_type: qualification.type,
    equivalence_status: qualification.equivalence_status,
    qualification,
  }
}

function fixedResolution(
  field: { id: string; name: string; slug: string },
  specialism: { id: string; name: string; slug: string }
): FieldSpecialismResolution {
  return {
    primary_field: {
      id: field.id,
      name: field.name,
      slug: field.slug,
      score: 1,
      reasons: ['Selected from Career Knowledge Library'],
    },
    primary_specialism: {
      id: specialism.id,
      name: specialism.name,
      slug: specialism.slug,
      score: 1,
      reasons: ['Selected from Career Knowledge Library'],
    },
    alternative_fields: [],
    alternative_specialisms: [],
    needs_clarification: false,
    confidence: 1,
    score_margin: 1,
    is_broad_subject: false,
    clarification_reason: null,
    clarification_options: [],
    match_reasons: ['Library path: field → specialism → stage'],
  }
}

function buildQaSummary(result: Omit<WorkInEducationMatchResult, 'qa_summary'>): MatchQaSummary {
  const flag = (ok: boolean, warn = false): QaSummaryFlag =>
    ok ? (warn ? 'WARNING' : 'PASS') : 'FAIL'
  const res = result.resolution
  return {
    field_resolution: flag(Boolean(res.primary_field)),
    specialism_resolution: flag(Boolean(res.primary_specialism)),
    regulated_role_safety: 'PASS',
    scope_safety: 'PASS',
    seniority_safety: 'PASS',
    professional_stage_safety: 'PASS',
  }
}

export async function matchLibraryPath(
  supabase: SupabaseClient,
  selection: LibraryPathSelection,
  options: LibraryPathMatchOptions = {}
): Promise<LibraryPathMatchRun> {
  const started = Date.now()
  const includeDrafts = options.includeDrafts ?? true
  let queryCount = 0

  const fieldId = selection.field_id?.trim()
  const specialismId = selection.specialism_id?.trim()
  const stageId = selection.stage_id?.trim()
  if (!fieldId || !specialismId || !stageId) {
    return {
      ok: false,
      status: 400,
      code: 'missing_selection',
      errors: ['field_id, specialism_id, and stage_id are required'],
    }
  }

  const field = await loadLibraryFieldById(supabase, fieldId)
  queryCount += 1
  if (!field || !field.active || (field.status || '').toLowerCase() === 'disabled') {
    return {
      ok: false,
      status: 404,
      code: 'field_unavailable',
      errors: ['Selected career field is not available'],
    }
  }

  const specs = await loadLibrarySpecialismsForField(supabase, fieldId, { includeDrafts })
  queryCount += specs.queryCount
  const specialism = specs.specialisms.find((s) => s.id === specialismId) ?? null
  if (!specialism) {
    return {
      ok: false,
      status: 404,
      code: 'specialism_unavailable',
      errors: ['Selected specialism is not available for this field'],
    }
  }

  const stagePack = await loadLibraryStagesForSpecialism(supabase, specialismId)
  queryCount += stagePack.queryCount
  const stage = stagePack.stages.find((s) => s.id === stageId) ?? null
  if (!stage) {
    const rawStage = await loadLibraryStageById(supabase, stageId)
    queryCount += 1
    if (!rawStage) {
      return {
        ok: false,
        status: 404,
        code: 'stage_unavailable',
        errors: ['Selected stage is not available'],
      }
    }
    return {
      ok: false,
      status: 404,
      code: 'stage_unavailable',
      errors: ['Selected stage is not available for this specialism'],
    }
  }

  const roleLoad = await loadLibraryRolesForSpecialismStage(supabase, {
    specialismId,
    stageId,
    includeDrafts,
    includeOtherStages: true,
  })
  queryCount += roleLoad.queryCount

  const allRoles: KnowledgeRoleRow[] = [
    ...roleLoad.selectedStageRoles,
    ...roleLoad.otherStageRoles,
  ]
  const stageIds = allRoles.map((r) => r.stage_id).filter((id): id is string => Boolean(id))
  const stagesLoad = await loadStagesByIds(supabase, [...stageIds, stageId])
  queryCount += stagesLoad.queryCount
  stagesLoad.stagesById.set(stage.id, stage)

  const yearsRelevantExperience = Math.max(0, options.yearsRelevantExperience ?? 0)
  const completedTrainingCount = Math.max(0, options.completedTrainingCount ?? 0)
  const stage_context = buildWieStageContext({
    selectedStageLabel: stage.label,
    selectedStageKey: stage.stage_key,
    yearsRelevantExperience,
    completedTrainingCount,
    stageMeaning: WIE_LIBRARY_PATH_STAGE_MEANING,
  })
  const readinessMatch = matchingStageForImmediateRoutes(stage_context)

  const profile = normaliseWorkInEducationProfile(
    buildBrowseProfile(specialism, stage, yearsRelevantExperience)
  )
  const resolution = fixedResolution(field, specialism)

  const items = allRoles.map((role) => {
    const roleStage = role.stage_id ? stagesLoad.stagesById.get(role.stage_id) ?? null : null
    const evaluated = evaluateRoleEligibility({
      role,
      specialism: specialism as KnowledgeSpecialismRow,
      field,
      stage: roleStage,
      profile,
      retrieval_source: 'primary_specialism',
      relation_reason:
        role.stage_id === stageId
          ? 'Selected library stage'
          : 'Same specialism, different library stage',
    })

    // Do NOT soft-promote advanced same-specialism roles to immediate/realistic.
    // Global match-safety reclassifies after scoring.
    if (role.stage_id !== stageId) {
      if (
        evaluated.effective_fit === 'immediate' ||
        evaluated.effective_fit === 'realistic_next'
      ) {
        evaluated.effective_fit =
          role.is_research_role || role.is_academic_role
            ? 'academic_or_research'
            : 'future_progression'
        evaluated.demotion_reasons.push('Different career stage than the one you selected')
      }
    }

    return {
      evaluated,
      role,
      specialismRank: 0,
      field,
      specialism: specialism as KnowledgeSpecialismRow,
      stage: roleStage,
    }
  })

  const rawRecommendations = rankAndBucketRoles({
    items,
    profile,
    resolution,
    // High limits so global safety sees the full specialism candidate set
    // (safety rebuckets + applies its own display caps).
    limits: {
      immediate: 80,
      realistic_next: 80,
      future_progression: 80,
      academic_or_research: 40,
      blocked_or_needs_review: 40,
    },
  })

  const roleById = new Map(
    items.map((item) => [item.role.id, { role: item.role, stage: item.stage }])
  )

  const academicRouteSelected = /academic|research/i.test(
    `${stage.stage_key} ${stage.label}`
  )

  const recommendations = applyMatchSafety(
    {
      pathway: 'work_in_my_education',
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
      recommendations: rawRecommendations,
      qualification_recognition: {
        review_needed: false,
        reason: '',
        country: profile.qualification_country ?? '',
      },
      overall_gaps: [],
      warnings: [],
      qa_summary: {
        field_resolution: 'PASS',
        specialism_resolution: 'PASS',
        regulated_role_safety: 'PASS',
        scope_safety: 'PASS',
        seniority_safety: 'PASS',
        professional_stage_safety: 'PASS',
      },
      data_provenance: {
        source: 'career_knowledge_library',
        role_ids: [],
        field_ids: [field.id],
        specialism_ids: [specialism.id],
      },
      meta: {
        query_count: queryCount,
        elapsed_ms: 0,
        candidate_roles_considered: allRoles.length,
        include_drafts: includeDrafts,
        confidence_threshold: QUALITY_GATE_THRESHOLDS.minSpecialismConfidence,
        score_margin_threshold: QUALITY_GATE_THRESHOLDS.minScoreMargin,
      },
    },
    roleById,
    {
      // Immediate classification uses estimated readiness — not the target ladder stage
      userStageKey: readinessMatch.stageKey,
      userStageLabel: readinessMatch.stageLabel,
      userStageId: null,
      academicRouteSelected,
      yearsExperience: profile.years_relevant_experience,
      hasActiveRegistration: profile.professional_registration.some((r) => r.status === 'registered'),
      isUkQualification: profile.is_uk_qualification,
      fieldName: field.name,
      fieldSlug: field.slug,
      specialismName: specialism.name,
      stageMeaning: stage_context.stage_meaning,
      targetStageKey: stage.stage_key,
      targetStageLabel: stage.label,
      readinessStageKey: readinessMatch.stageKey,
      readinessStageLabel: readinessMatch.stageLabel,
    }
  ).recommendations

  const allRecs = [
    ...recommendations.immediate,
    ...recommendations.realistic_next,
    ...recommendations.future_progression,
    ...recommendations.academic_or_research,
    ...recommendations.blocked_or_needs_review,
  ]

  const overall_gaps: EligibilityGap[] = []
  const gapCodes = new Set<string>()
  for (const r of allRecs) {
    for (const g of r.gaps) {
      if (gapCodes.has(g.code)) continue
      gapCodes.add(g.code)
      overall_gaps.push(g)
    }
  }

  const warnings: string[] = [
    stage_context.stage_meaning === 'target'
      ? `Target stage: ${stage_context.target_stage_label}. Immediate routes reflect estimated current readiness (${stage_context.estimated_current_readiness}).`
      : 'Results respect your selected career stage and common UK entry requirements.',
  ]
  if (roleLoad.selectedStageRoles.length === 0) {
    warnings.push('No active roles are linked to this stage yet in the Career Knowledge Library.')
  }
  // Never surface draft/integration test notices on the public result payload.

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
    qualification_recognition: {
      review_needed: false,
      reason: '',
      country: profile.qualification_country ?? '',
    },
    overall_gaps,
    warnings,
    data_provenance: {
      source: 'career_knowledge_library' as const,
      role_ids: allRecs.map((r) => r.role_id),
      field_ids: [field.id],
      specialism_ids: [specialism.id],
    },
    meta: {
      query_count: queryCount,
      elapsed_ms: Date.now() - started,
      candidate_roles_considered: allRoles.length,
      include_drafts: includeDrafts,
      confidence_threshold: QUALITY_GATE_THRESHOLDS.minSpecialismConfidence,
      score_margin_threshold: QUALITY_GATE_THRESHOLDS.minScoreMargin,
    },
  }

  const result: WorkInEducationMatchResult = {
    ...partial,
    qa_summary: buildQaSummary(partial),
  }

  return {
    ok: true,
    result,
    selection: {
      field: { id: field.id, name: field.name, slug: field.slug },
      specialism: { id: specialism.id, name: specialism.name, slug: specialism.slug },
      stage: { id: stage.id, label: stage.label, stage_key: stage.stage_key },
    },
    stage_context,
  }
}
