/**
 * English Development Plan for Basic / Intermediate / Good users.
 */

import { buildEnglishDevelopmentPlanContent } from './englishConfidenceRules'
import type { CareerBrainState, CareerPathRole, CareerProfile, EnglishDevelopmentPlan } from './types'

export function buildEnglishDevelopmentPlan(
  profile: CareerProfile,
  workNow: CareerPathRole[],
  state?: CareerBrainState
): EnglishDevelopmentPlan | null {
  void state
  const content = buildEnglishDevelopmentPlanContent(
    profile,
    workNow.map((r) => r.title)
  )
  if (!content) return null
  return content
}
