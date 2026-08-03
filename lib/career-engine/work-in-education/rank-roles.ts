/**
 * Transparent role ranking + diversity controls.
 */

import { aliasKey } from './aliases'
import type {
  EffectiveFit,
  FieldSpecialismResolution,
  KnowledgeRoleRow,
  NormalisedWorkInEducationProfile,
  RoleEligibilityResult,
} from './types'

function titleStem(name: string): string {
  return aliasKey(name)
    .replace(/\b(senior|junior|lead|principal|graduate|trainee|assistant|head|director|manager)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function scoreRoleMatch(args: {
  evaluated: RoleEligibilityResult
  role: KnowledgeRoleRow
  profile: NormalisedWorkInEducationProfile
  resolution: FieldSpecialismResolution
  specialismRank: number // 0 = primary
}): number {
  const { evaluated, role, profile, resolution, specialismRank } = args
  let score = 0

  // Specialism / field match
  score += specialismRank === 0 ? 22 : Math.max(6, 18 - specialismRank * 4)
  if (resolution.primary_field && evaluated.field.id === resolution.primary_field.id) score += 10

  // Qualification / education
  if (evaluated.eligibility.education_match) score += 12
  else score -= 8

  // Experience suitability
  const min = role.minimum_experience_years ?? 0
  const years = profile.years_relevant_experience
  if (years >= min) score += 14
  else if (years + 2 >= min) score += 6
  else score -= 10

  // Registration / licence
  if (evaluated.eligibility.registration_match) score += 10
  else if (evaluated.effective_fit === 'blocked_until_requirement' || evaluated.effective_fit === 'needs_review')
    score -= 5

  if (evaluated.eligibility.licence_match) score += 3

  // Skills overlap (light)
  const roleTokens = new Set(aliasKey(`${role.name} ${role.description}`).split(' ').filter(Boolean))
  let skillHits = 0
  for (const t of profile.skill_tokens) if (roleTokens.has(t)) skillHits += 1
  score += Math.min(8, skillHits * 2)

  // Preferences
  if (profile.career_preferences.wants_academic_route && evaluated.effective_fit === 'academic_or_research') {
    score += 8
  }
  if (profile.career_preferences.wants_related_field_only && specialismRank > 2) {
    score -= 6
  }

  // Progression realism
  if (evaluated.effective_fit === 'immediate') score += 8
  else if (evaluated.effective_fit === 'realistic_next') score += 5
  else if (evaluated.effective_fit === 'future_progression') score += 2

  // Priority hint from library
  const priority = role.priority ?? 500
  score += Math.max(0, 6 - Math.floor(priority / 100))

  // UK recognition confidence
  if (evaluated.eligibility.country_recognition_review_needed) score -= 4
  if (profile.is_uk_qualification) score += 3

  // Blockers: ranking must not rehabilitate blocked fits
  if (
    evaluated.effective_fit === 'blocked_until_requirement' ||
    evaluated.effective_fit === 'needs_review'
  ) {
    score = Math.min(score, 35)
  }
  if (
    evaluated.eligibility.qualification_scope_match === 'mismatched' ||
    evaluated.eligibility.registration_scope_match === 'mismatched'
  ) {
    score -= 25
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function rankAndBucketRoles(args: {
  items: Array<{ evaluated: RoleEligibilityResult; role: KnowledgeRoleRow; specialismRank: number }>
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
    const match_score = scoreRoleMatch({
      evaluated: item.evaluated,
      role: item.role,
      profile: args.profile,
      resolution: args.resolution,
      specialismRank: item.specialismRank,
    })
    return {
      ...item.evaluated,
      match_score,
    }
  })

  scored.sort(
    (a, b) =>
      b.match_score - a.match_score || a.role_title.localeCompare(b.role_title)
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
    // Allow at most 1 near-identical title stem per bucket (diversity)
    const stemKey = `${item.effective_fit}:${stem}`
    if (stem && usedStems.has(stemKey)) return
    list.push(item)
    usedIds.add(item.role_id)
    if (stem) usedStems.add(stemKey)
  }

  for (const item of scored) {
    const fit = item.effective_fit as EffectiveFit
    if (fit === 'blocked_until_requirement' || fit === 'needs_review') {
      pushDiverse(buckets.blocked_or_needs_review, item, args.limits.blocked_or_needs_review)
      continue
    }
    if (fit === 'immediate') pushDiverse(buckets.immediate, item, args.limits.immediate)
    else if (fit === 'realistic_next')
      pushDiverse(buckets.realistic_next, item, args.limits.realistic_next)
    else if (fit === 'academic_or_research')
      pushDiverse(buckets.academic_or_research, item, args.limits.academic_or_research)
    else if (fit === 'future_progression')
      pushDiverse(buckets.future_progression, item, args.limits.future_progression)
  }

  return buckets
}
