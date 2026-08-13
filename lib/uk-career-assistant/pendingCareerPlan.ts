/**
 * Pending career plan handoff for guest → auth → My Plan.
 * Survives top-level navigation out of the Career Assistant iframe.
 */

import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { isJobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { CAREER_PLAN_REFRESH_EVENT } from '@/lib/dashboard/careerOs/types'
import {
  CA_RESULT_STORAGE_KEY,
  loadCaResultSnapshot,
  saveCaResultSnapshot,
} from '@/lib/uk-career-assistant/guestSession'

export const PENDING_CAREER_PLAN_KEY = 'jobaz_pending_career_plan'
export const JOBAZ_PLAN_STORAGE_KEY = 'jobaz_plan_v1'

export type PendingCareerPlanPayload = {
  version: 1
  savedAt: number
  plan: JobAZPlan
  marketingOptIn?: boolean
  /** Snapshot of key plan fields for debugging / acceptance checks */
  summary: {
    route_title: string
    goal?: string
    current_focus: string
    next_upgrade: string
    readiness: number
    work_now_roles: string[]
    recommended_courses: string[]
    weekly_plan: string[]
  }
}

function buildSummary(plan: JobAZPlan, goal?: string): PendingCareerPlanPayload['summary'] {
  return {
    route_title: plan.route_summary.route_title,
    goal,
    current_focus: plan.route_summary.current_target_role,
    next_upgrade: plan.route_summary.next_upgrade_role,
    readiness: plan.route_summary.readiness_score,
    work_now_roles: (plan.work_now || []).map((r) => r.title),
    recommended_courses: [
      ...(plan.training_next?.title ? [plan.training_next.title] : []),
      ...(plan.optional_training || []).map((t) => t.title),
      ...(plan.structured_cards || []).map((c) => c.title).filter(Boolean),
    ].filter(Boolean),
    weekly_plan: plan.this_week_plan || [],
  }
}

/**
 * Persist plan before leaving for signup/login. Also mirrors to jobaz_plan_v1.
 */
export function savePendingCareerPlan(
  plan: JobAZPlan,
  options?: { marketingOptIn?: boolean; goal?: string }
): void {
  if (typeof window === 'undefined') return
  try {
    const payload: PendingCareerPlanPayload = {
      version: 1,
      savedAt: Date.now(),
      plan,
      marketingOptIn: options?.marketingOptIn,
      summary: buildSummary(plan, options?.goal),
    }
    localStorage.setItem(PENDING_CAREER_PLAN_KEY, JSON.stringify(payload))
    writeJobazPlan(plan, payload)
  } catch (err) {
    console.error('[pendingCareerPlan] save failed', err)
  }
}

/** Save plan for an already-authenticated user (no pending auth marker). */
export function saveCareerPlanLocally(plan: JobAZPlan): void {
  if (typeof window === 'undefined') return
  try {
    writeJobazPlan(plan)
  } catch (err) {
    console.error('[pendingCareerPlan] local save failed', err)
  }
}

function writeJobazPlan(plan: JobAZPlan, pendingPayload?: PendingCareerPlanPayload): void {
  localStorage.setItem(JOBAZ_PLAN_STORAGE_KEY, JSON.stringify(plan))

  const snapshot = loadCaResultSnapshot()
  if (snapshot) {
    saveCaResultSnapshot({
      ...snapshot,
      timestamp: Date.now(),
      aiState: {
        ...snapshot.aiState,
        jobaz_plan: plan,
        ...(pendingPayload ? { pending_career_plan: pendingPayload } : {}),
      },
    })
  }

  window.dispatchEvent(new Event(CAREER_PLAN_REFRESH_EVENT))
  window.dispatchEvent(new StorageEvent('storage', { key: JOBAZ_PLAN_STORAGE_KEY }))
  window.dispatchEvent(new StorageEvent('storage', { key: CA_RESULT_STORAGE_KEY }))
  if (pendingPayload) {
    window.dispatchEvent(new StorageEvent('storage', { key: PENDING_CAREER_PLAN_KEY }))
  }
}

export function loadPendingCareerPlan(): PendingCareerPlanPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PENDING_CAREER_PLAN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingCareerPlanPayload
    if (!parsed?.plan || !isJobAZPlan(parsed.plan)) return null
    return parsed
  } catch {
    return null
  }
}

export function hasPendingCareerPlan(): boolean {
  return Boolean(loadPendingCareerPlan()?.plan)
}

export function clearPendingCareerPlan(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PENDING_CAREER_PLAN_KEY)
  } catch {
    // ignore
  }
}

/**
 * After auth: ensure My Plan has the pending plan, then clear the pending marker.
 * Returns true when a plan was applied.
 */
export function promotePendingCareerPlan(): boolean {
  if (typeof window === 'undefined') return false
  const pending = loadPendingCareerPlan()
  if (!pending?.plan) {
    // Fallback: jobaz_plan_v1 may already hold the guest plan
    try {
      const raw = localStorage.getItem(JOBAZ_PLAN_STORAGE_KEY)
      if (raw && isJobAZPlan(JSON.parse(raw))) return true
    } catch {
      // ignore
    }
    return false
  }

  try {
    localStorage.setItem(JOBAZ_PLAN_STORAGE_KEY, JSON.stringify(pending.plan))
    clearPendingCareerPlan()
    window.dispatchEvent(new Event(CAREER_PLAN_REFRESH_EVENT))
    window.dispatchEvent(new StorageEvent('storage', { key: JOBAZ_PLAN_STORAGE_KEY }))
    return true
  } catch (err) {
    console.error('[pendingCareerPlan] promote failed', err)
    return false
  }
}

/**
 * Navigate to auth at the top browsing context so the form never renders
 * inside the Career Assistant iframe / float panel.
 */
export function openAppLevelAuth(authUrl: string): void {
  if (typeof window === 'undefined') return
  try {
    const target = window.top ?? window
    target.location.assign(authUrl)
  } catch {
    window.location.assign(authUrl)
  }
}
