/**
 * Clear stale My Plan caches after Career Assistant replace-save.
 */

import { invalidateAssessmentBundleCache } from '@/lib/dashboard/careerOs/assessmentLoader'

const JAZ_ACTION_PLAN_KEY = 'jobaz_jaz_action_plan_v1'

export function clearStaleMyPlanCaches(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(JAZ_ACTION_PLAN_KEY)
  } catch {
    // ignore
  }
  invalidateAssessmentBundleCache()
}

export function writeLocalJazActionPlanCache(plan: unknown, goalPath: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      JAZ_ACTION_PLAN_KEY,
      JSON.stringify({ ...(plan as object), _goal: goalPath, _from_ca: true })
    )
  } catch {
    // ignore
  }
}
