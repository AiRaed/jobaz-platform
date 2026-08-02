/**
 * Clear shared career caches — call on logout or account switch.
 * Guest assessment snapshot is preserved until transfer succeeds (except full logout).
 */

import { CA_RESULT_STORAGE_KEY } from '@/lib/uk-career-assistant/guestSession'
import { CAREER_JOURNEY_STORAGE_KEY } from '@/lib/career-journey/storage'
import { TRAINING_ROUTES_STORAGE_KEY } from '@/lib/career-hub/trainingPlan'

const JOBAZ_PLAN_KEY = 'jobaz_plan_v1'
const PENDING_PLAN_KEY = 'jobaz_pending_career_plan'

export function clearJourneyAndTrainingLocalCache(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CAREER_JOURNEY_STORAGE_KEY)
    localStorage.removeItem(TRAINING_ROUTES_STORAGE_KEY)
  } catch {
    // best-effort
  }
}

/** Remove guest assessment snapshot after successful Supabase sync. */
export function clearGuestAssessmentSnapshot(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CA_RESULT_STORAGE_KEY)
  } catch {
    // best-effort
  }
}

function clearPlanDisplayKeys(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(JOBAZ_PLAN_KEY)
    localStorage.removeItem(PENDING_PLAN_KEY)
  } catch {
    // best-effort
  }
}

/** Clear journey/training caches only — keeps guest assessment for post-login transfer. */
export function clearSharedCareerLocalCache(): void {
  clearJourneyAndTrainingLocalCache()
}

/**
 * Logout / account-switch wipe — drop previous user's plan display keys and guest snapshot
 * so the next session cannot show the wrong plan from localStorage.
 */
export function clearCachesOnLogout(): void {
  clearJourneyAndTrainingLocalCache()
  clearGuestAssessmentSnapshot()
  clearPlanDisplayKeys()
}

/** Full wipe including guest assessment — use on explicit logout after sync. */
export function clearAllCareerLocalCache(): void {
  clearCachesOnLogout()
}
