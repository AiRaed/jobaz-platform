/**
 * Clear Add-to-My-Plan / guest pending selection state for a fresh Career Assistant run.
 * Call on: new result, start over, start again, after successful plan save.
 */

import { clearPendingPlanItems, PENDING_PLAN_ITEMS_KEY } from './pendingPlanItems'
import {
  clearPendingCareerPlan,
  PENDING_CAREER_PLAN_KEY,
  JOBAZ_PLAN_STORAGE_KEY,
} from '@/lib/uk-career-assistant/pendingCareerPlan'

const EXTRA_SESSION_KEYS = [
  PENDING_PLAN_ITEMS_KEY,
  PENDING_CAREER_PLAN_KEY,
  // Do not wipe jobaz_plan_v1 here on every start-over — active plan lives on dashboard.
  // Only clear pending handoff keys so modal never rehydrates old selections.
]

/**
 * Wipe modal/pending selection caches so the next Add to My Plan open
 * cannot reuse courses/roles from a previous assistant run.
 */
export function clearAddToPlanSessionState(opts?: { clearLocalPlanMirror?: boolean }): void {
  if (typeof window === 'undefined') return
  try {
    clearPendingPlanItems()
    clearPendingCareerPlan()
    for (const key of EXTRA_SESSION_KEYS) {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
    if (opts?.clearLocalPlanMirror) {
      try {
        localStorage.removeItem(JOBAZ_PLAN_STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}
