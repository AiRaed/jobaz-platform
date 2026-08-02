/**
 * Final validation — recommendations must reflect the user's answers.
 */

import {
  buildNextConflictsWithTrack,
  inferCareerTrackFamily,
} from './careerTrackAlignment'
import { roleRequiresStrongerEnglishThanSelected, getEnglishConfidenceRules, normalizeEnglishConfidenceLevel } from './englishConfidenceRules'
import { rolePreferenceScore, applyGlobalRecommendationRules } from './globalPreferenceEngine'
import { resolveWorkStyle } from './workStylePreferences'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

export type RecommendationValidationResult = {
  valid: boolean
  issues: string[]
  recs: CareerBrainRecommendation[]
  repaired: boolean
}

function workNowTitles(recs: CareerBrainRecommendation[]): string[] {
  return recs.filter((r) => r.track === 'work_now').map((r) => r.title.toLowerCase())
}

function buildNextTitles(recs: CareerBrainRecommendation[]): string[] {
  return recs.filter((r) => r.track === 'build_next').map((r) => r.title.toLowerCase())
}

function countPattern(titles: string[], pattern: RegExp): number {
  return titles.filter((t) => pattern.test(t)).length
}

export function validateRecommendationsReflectProfile(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): RecommendationValidationResult {
  const issues: string[] = []
  const work = workNowTitles(recs)
  const build = buildNextTitles(recs)
  const style = resolveWorkStyle(profile, state)
  const workNowRecs = recs.filter((r) => r.track === 'work_now')
  const family = workNowRecs.length ? inferCareerTrackFamily(workNowRecs, profile, state) : null

  if (profile.constraints.includes('non-physical')) {
    const physical = countPattern(
      work,
      /warehouse operative|forklift|picker|packer|kitchen porter|construction labour|site labour/i
    )
    const office = countPattern(
      work,
      /admin|reception|data entry|dispatch|scheduling|transport admin|office/i
    )
    if (physical >= 2 && office === 0) {
      issues.push('Non-physical preference not reflected — too many heavy physical Work Now roles')
    }
    if (family === 'office_admin' && /forklift|hgv|cpc|cscs construction/i.test(build.join(' '))) {
      issues.push('Build Next must continue from office Work Now — not logistics licences')
    }
  }

  if (profile.constraints.includes('no-customer-facing')) {
    const customer = countPattern(work, /retail assistant|barista|waiter|receptionist|customer service|hospitality/i)
    if (customer >= 2) {
      issues.push('Not customer-facing preference not reflected in Work Now')
    }
  }

  const engLevel = normalizeEnglishConfidenceLevel(profile.englishLevel)
  const engRules = getEnglishConfidenceRules(profile.englishLevel)

  if (engLevel === 'basic') {
    const commHeavy = countPattern(work, /receptionist|customer service|sales|call centre|legal assistant|office assistant|office admin/i)
    if (commHeavy >= 1) {
      issues.push('Basic English — Work Now should not include customer-facing or office-based roles')
    }
  }

  for (const r of recs.filter((item) => item.track === 'work_now')) {
    if (roleRequiresStrongerEnglishThanSelected(r.title, 'work_now', profile)) {
      issues.push(`Work Now "${r.title}" requires stronger English than selected level`)
    }
  }

  if (recs.filter((r) => r.track === 'work_now').length === 0) {
    issues.push('Output must include Work Now roles for immediate income')
  }
  if (recs.filter((r) => r.track === 'build_next').length === 0) {
    issues.push('Output must include Build Next progression (3–12 months)')
  }
  if (recs.filter((r) => r.track === 'long_term').length === 0) {
    issues.push('Output must include Long-Term Path destinations (3–5 years)')
  }
  if (
    recs.filter((r) => r.track === 'long_term').length > 0 &&
    recs.filter((r) => r.track === 'build_next').length === 0
  ) {
    issues.push('Long-Term Path must not appear without Build Next intermediate steps')
  }

  if (engLevel === 'intermediate' && engRules && !engRules.allowOffice) {
    const officeHeavy = countPattern(work, /receptionist|office administrator|office manager|recruitment assistant|sales executive/i)
    if (officeHeavy >= 1) {
      issues.push('Intermediate English — office-heavy Work Now roles should wait until communication confidence improves')
    }
  }

  if (engLevel === 'good' || engLevel === 'fluent') {
    const officeOrCustomer = countPattern(work, /customer service|receptionist|office assistant|admin assistant|sales assistant|administrator/i)
    const physicalOnly = countPattern(work, /kitchen porter|site labour|factory operative/i)
    if (officeOrCustomer === 0 && physicalOnly >= 2 && profile.constraints.includes('non-physical')) {
      issues.push('Good/Fluent English with non-physical preference — Work Now should include customer-facing or admin options')
    }
  }

  if (
    (profile.yearsOfExperience ?? 0) === 0 &&
    countPattern(work, /senior|manager|director|lead engineer|specialist consultant/i) >= 2
  ) {
    issues.push('No experience — Work Now should not lead with senior professional roles')
  }

  if (family && work.length >= 1 && build.length >= 1) {
    const conflictingBuild = recs
      .filter((r) => r.track === 'build_next')
      .filter((r) => buildNextConflictsWithTrack(r.title, family))
    if (conflictingBuild.length >= 2) {
      issues.push(`Build Next conflicts with ${family} Work Now path`)
    }
  }

  const avgScore =
    recs
      .filter((r) => r.track === 'work_now')
      .reduce((sum, r) => sum + rolePreferenceScore(r.title, 'work_now', profile, state), 0) /
    Math.max(1, recs.filter((r) => r.track === 'work_now').length)

  if (avgScore < 25 && work.length >= 2) {
    issues.push('Work Now average fit score too low — recommendations may not reflect user answers')
  }

  return { valid: issues.length === 0, issues, recs, repaired: false }
}

export function validateAndRepairRecommendations(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): RecommendationValidationResult {
  let result = validateRecommendationsReflectProfile(recs, profile, state)
  if (result.valid) return result

  const repaired = applyGlobalRecommendationRules(recs, profile, state)
  result = validateRecommendationsReflectProfile(repaired, profile, state)
  return { ...result, recs: repaired, repaired: true }
}
