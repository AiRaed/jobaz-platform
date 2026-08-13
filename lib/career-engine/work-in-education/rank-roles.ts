/**
 * Transparent role ranking + diversity controls.
 * Scoring delegated to Eligibility & Match Scoring v2.
 */

import { aliasKey } from './aliases'
import {
  evaluateRoleMatch,
  resultGroupToEffectiveFit,
  eligibilityStatusToLegacy,
} from '../evaluate-role-match'
import type {
  EffectiveFit,
  FieldSpecialismResolution,
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
  NormalisedWorkInEducationProfile,
  RoleEligibilityResult,
} from './types'

function titleStem(name: string): string {
  return aliasKey(name)
    .replace(/\b(senior|junior|lead|principal|graduate|trainee|assistant|head|director|manager)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * @deprecated Prefer evaluateRoleMatch (v2). Kept for external imports; delegates to v2.
 */
export function scoreRoleMatch(args: {
  evaluated: RoleEligibilityResult
  role: KnowledgeRoleRow
  profile: NormalisedWorkInEducationProfile
  resolution: FieldSpecialismResolution
  specialismRank: number
  field?: KnowledgeFieldRow
  specialism?: KnowledgeSpecialismRow
  stage?: KnowledgeStageRow | null
}): number {
  const field = args.field ?? {
    id: args.evaluated.field.id,
    name: args.evaluated.field.name,
    slug: args.evaluated.field.slug,
    description: '',
    active: true,
    status: 'approved',
  }
  const specialism = args.specialism ?? {
    id: args.evaluated.specialism.id,
    name: args.evaluated.specialism.name,
    slug: args.evaluated.specialism.slug,
    field_id: field.id,
    description: '',
    regulated_profession: false,
    professional_body: null,
    active: true,
    status: 'approved',
    stage_model_id: null,
  }
  const evaluation = evaluateRoleMatch({
    role: args.role,
    specialism,
    field,
    stage: args.stage ?? null,
    profile: args.profile,
    resolution: args.resolution,
    specialismRank: args.specialismRank,
    prior: args.evaluated,
  })
  return evaluation.matchScore
}

export function rankAndBucketRoles(args: {
  items: Array<{
    evaluated: RoleEligibilityResult
    role: KnowledgeRoleRow
    specialismRank: number
    field?: KnowledgeFieldRow
    specialism?: KnowledgeSpecialismRow
    stage?: KnowledgeStageRow | null
  }>
  profile: NormalisedWorkInEducationProfile
  resolution: FieldSpecialismResolution
  limits: {
    immediate: number
    realistic_next: number
    future_progression: number
    academic_or_research: number
    blocked_or_needs_review: number
  }
}): {
  immediate: RoleEligibilityResult[]
  realistic_next: RoleEligibilityResult[]
  future_progression: RoleEligibilityResult[]
  academic_or_research: RoleEligibilityResult[]
  blocked_or_needs_review: RoleEligibilityResult[]
} {
  const scored = args.items.map((item) => {
    const field = item.field ?? {
      id: item.evaluated.field.id,
      name: item.evaluated.field.name,
      slug: item.evaluated.field.slug,
      description: '',
      active: true,
      status: 'approved',
    }
    const specialism = item.specialism ?? {
      id: item.evaluated.specialism.id,
      name: item.evaluated.specialism.name,
      slug: item.evaluated.specialism.slug,
      field_id: field.id,
      description: '',
      regulated_profession: false,
      professional_body: null,
      active: true,
      status: 'approved',
      stage_model_id: null,
    }

    const evaluation = evaluateRoleMatch({
      role: item.role,
      specialism,
      field,
      stage: item.stage ?? null,
      profile: args.profile,
      resolution: args.resolution,
      specialismRank: item.specialismRank,
      prior: item.evaluated,
    })

    const academic = Boolean(item.role.is_academic_role || item.role.is_research_role)
    const effective_fit = resultGroupToEffectiveFit(evaluation.resultGroup, { academic })
    const legacyStatus = eligibilityStatusToLegacy(evaluation.eligibilityStatus)

    const experience_match = !evaluation.unmetRequirements.some((u) => /experience/i.test(u))
    const education_match = !evaluation.unmetRequirements.some((u) => /qualification/i.test(u))
    const registration_match = evaluation.matchedReasons.some((m) =>
      /registration requirements appear met|hold registration that is desirable/i.test(m)
    )

    const next: RoleEligibilityResult = {
      ...item.evaluated,
      match_score: evaluation.matchScore,
      effective_fit,
      evaluation,
      eligibility: {
        ...item.evaluated.eligibility,
        status: legacyStatus,
        experience_match,
        registration_match,
        education_match,
      },
      match_reasons: evaluation.matchedReasons,
      warnings: [
        ...new Set([
          ...item.evaluated.warnings.filter((w) => !/chartered stage|mis-stag/i.test(w)),
          ...evaluation.warnings,
        ]),
      ],
      demotion_reasons: item.evaluated.demotion_reasons.filter(
        (d) =>
          !(
            /site engineer/i.test(item.role.name) &&
            /charter|professional_stage/i.test(d) &&
            !/\bchartered\b|\bceng\b/i.test(item.role.name)
          )
      ),
    }
    return next
  })

  scored.sort(
    (a, b) => b.match_score - a.match_score || a.role_title.localeCompare(b.role_title)
  )

  const buckets: Record<
    | 'immediate'
    | 'realistic_next'
    | 'future_progression'
    | 'academic_or_research'
    | 'blocked_or_needs_review',
    RoleEligibilityResult[]
  > = {
    immediate: [],
    realistic_next: [],
    future_progression: [],
    academic_or_research: [],
    blocked_or_needs_review: [],
  }

  const usedStems = new Set<string>()
  const usedIds = new Set<string>()

  const pushDiverse = (list: RoleEligibilityResult[], item: RoleEligibilityResult, limit: number) => {
    if (list.length >= limit) return
    if (usedIds.has(item.role_id)) return
    const stem = titleStem(item.role_title)
    const stemKey = `${item.effective_fit}:${stem}`
    if (stem && usedStems.has(stemKey)) return
    list.push(item)
    usedIds.add(item.role_id)
    if (stem) usedStems.add(stemKey)
  }

  for (const item of scored) {
    const fit = item.effective_fit as EffectiveFit
    const group = item.evaluation?.resultGroup

    if (group === 'blocked_or_review' || fit === 'blocked_until_requirement' || fit === 'needs_review') {
      pushDiverse(buckets.blocked_or_needs_review, item, args.limits.blocked_or_needs_review)
      continue
    }
    if (group === 'immediate' || fit === 'immediate') {
      pushDiverse(buckets.immediate, item, args.limits.immediate)
    } else if (group === 'developing' || fit === 'realistic_next') {
      pushDiverse(buckets.realistic_next, item, args.limits.realistic_next)
    } else if (fit === 'academic_or_research') {
      pushDiverse(buckets.academic_or_research, item, args.limits.academic_or_research)
    } else {
      pushDiverse(buckets.future_progression, item, args.limits.future_progression)
    }
  }

  return buckets
}
