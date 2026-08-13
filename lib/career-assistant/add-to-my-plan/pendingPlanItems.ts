/**
 * Guest pending selection for Add to My Plan (survives auth).
 */

import type { PendingPlanItemsPayload, PlanPickItem } from './types'

export const PENDING_PLAN_ITEMS_KEY = 'jobaz_pending_plan_items'

export function savePendingPlanItems(payload: Omit<PendingPlanItemsPayload, 'version' | 'savedAt' | 'source'>): void {
  if (typeof window === 'undefined') return
  try {
    const full: PendingPlanItemsPayload = {
      version: 1,
      savedAt: Date.now(),
      source: 'career_assistant',
      ...payload,
    }
    localStorage.setItem(PENDING_PLAN_ITEMS_KEY, JSON.stringify(full))
    sessionStorage.setItem(PENDING_PLAN_ITEMS_KEY, JSON.stringify(full))
  } catch {
    // ignore
  }
}

export function loadPendingPlanItems(): PendingPlanItemsPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw =
      localStorage.getItem(PENDING_PLAN_ITEMS_KEY) || sessionStorage.getItem(PENDING_PLAN_ITEMS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingPlanItemsPayload
    if (!parsed?.selected?.length || parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function hasPendingPlanItems(): boolean {
  return Boolean(loadPendingPlanItems()?.selected?.length)
}

export function clearPendingPlanItems(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PENDING_PLAN_ITEMS_KEY)
    sessionStorage.removeItem(PENDING_PLAN_ITEMS_KEY)
  } catch {
    // ignore
  }
}

export function selectedTitles(items: PlanPickItem[]): string[] {
  return items.map((i) => i.title)
}
