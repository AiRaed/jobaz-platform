/**
 * Client helpers for active My Plan sync (Supabase source of truth for logged-in users).
 */

import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { normalizeJobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazActionPlanResult } from '@/lib/jaz-plan-engine'
import { JOBAZ_PLAN_STORAGE_KEY } from '@/lib/uk-career-assistant/pendingCareerPlan'
import { clearStaleMyPlanCaches } from './clearStaleCaches'

export type ActivePlanClientPayload = {
  ok: boolean
  action_plan_id: string | null
  updated_at: string | null
  created_at: string | null
  source: string | null
  user_id_suffix: string | null
  user_plan_count: number
  active_plan_count: number
  multiple_active_warning: boolean
  plan: JazActionPlanResult | null
  jobaz_plan: JobAZPlan | null
  table_ready?: boolean
  note?: string | null
  error?: string
}

/**
 * Fetch active plan from Supabase for the current session.
 */
export async function fetchActivePlanFromServer(): Promise<ActivePlanClientPayload | null> {
  try {
    const res = await fetch('/api/jaz-plan/active', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
    if (res.status === 401) return null
    const json = (await res.json().catch(() => null)) as ActivePlanClientPayload | null
    if (!res.ok || !json?.ok) return null
    return {
      ...json,
      jobaz_plan: normalizeJobAZPlan(json.jobaz_plan),
    }
  } catch {
    return null
  }
}

/**
 * After a successful server save: clear stale local caches so other tabs/browsers
 * don't keep an old local overlay. Optionally mirror the saved plan locally for
 * instant paint (server remains source of truth on next load).
 */
export function syncLocalMirrorAfterServerSave(jobazPlan: JobAZPlan | null | undefined): void {
  if (typeof window === 'undefined') return
  clearStaleMyPlanCaches()
  try {
    if (jobazPlan) {
      const normalized = normalizeJobAZPlan(jobazPlan)
      if (normalized) {
        localStorage.setItem(JOBAZ_PLAN_STORAGE_KEY, JSON.stringify(normalized))
      } else {
        localStorage.removeItem(JOBAZ_PLAN_STORAGE_KEY)
      }
    } else {
      localStorage.removeItem(JOBAZ_PLAN_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

/** Remove guest/local plan keys after promote to Supabase. */
export function clearGuestPlanLocalKeys(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('jobaz_pending_career_plan')
    localStorage.removeItem('jobaz_pending_plan_items')
    // Keep jobaz_plan_v1 only as mirror of server — cleared/overwritten by syncLocalMirrorAfterServerSave
  } catch {
    // ignore
  }
}
