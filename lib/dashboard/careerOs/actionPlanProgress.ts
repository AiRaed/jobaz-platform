/**
 * Launch-safe First Action Plan task progress.
 * External actions (Apply Now, job apps) never auto-complete without confirmation / real signals.
 */

import { getCurrentUserIdSync, getUserScopedKeySync } from '@/lib/user-storage'

export type ActionPlanTaskStatus = 'not_started' | 'in_progress' | 'applied' | 'done'

export type ActionPlanTaskNote = 'booked' | 'compared' | 'viewed'

export type ActionPlanTaskRecord = {
  status: ActionPlanTaskStatus
  /** User explicitly set done (vs auto from CV save / saved jobs). */
  manualDone?: boolean
  note?: ActionPlanTaskNote
  updatedAt: string
}

type Store = {
  tasks: Record<string, ActionPlanTaskRecord>
}

const STORAGE_KEY = 'jobaz_action_plan_progress_v1'
export const ACTION_PLAN_PROGRESS_EVENT = 'jobaz-action-plan-progress-updated'

/** Known Security extra-income mission ids */
export const ACTION_PLAN_TASK = {
  CV: 'cv-security',
  TRAIN_SIA: 'train-sia',
  APPLY: 'apply-steward',
  SAVE: 'save-security',
  OPTIONAL_FIRST_AID: 'optional-first-aid',
} as const

function readStore(): Store {
  if (typeof window === 'undefined') return { tasks: {} }
  try {
    const raw = localStorage.getItem(getUserScopedKeySync(STORAGE_KEY, getCurrentUserIdSync()))
    if (!raw) return { tasks: {} }
    const parsed = JSON.parse(raw) as Store
    return { tasks: parsed.tasks && typeof parsed.tasks === 'object' ? parsed.tasks : {} }
  } catch {
    return { tasks: {} }
  }
}

function writeStore(store: Store): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    getUserScopedKeySync(STORAGE_KEY, getCurrentUserIdSync()),
    JSON.stringify(store)
  )
  window.dispatchEvent(new CustomEvent(ACTION_PLAN_PROGRESS_EVENT))
}

export function getActionPlanTask(taskId: string): ActionPlanTaskRecord | null {
  return readStore().tasks[taskId] ?? null
}

export function listActionPlanTasks(): Record<string, ActionPlanTaskRecord> {
  return { ...readStore().tasks }
}

const RANK: Record<ActionPlanTaskStatus, number> = {
  not_started: 0,
  in_progress: 1,
  applied: 2,
  done: 3,
}

/** Upgrade status only — never downgrade (except explicit setStatus). */
export function markActionPlanTask(
  taskId: string,
  status: ActionPlanTaskStatus,
  opts?: { note?: ActionPlanTaskNote; manualDone?: boolean; force?: boolean }
): ActionPlanTaskRecord {
  const store = readStore()
  const existing = store.tasks[taskId]
  if (
    !opts?.force &&
    existing &&
    RANK[status] < RANK[existing.status]
  ) {
    return existing
  }

  // No-op when nothing meaningful changes (avoids event loops)
  if (
    !opts?.force &&
    existing &&
    existing.status === status &&
    (opts?.note === undefined || opts.note === existing.note) &&
    (opts?.manualDone === undefined || opts.manualDone === existing.manualDone)
  ) {
    return existing
  }

  const record: ActionPlanTaskRecord = {
    status,
    manualDone: opts?.manualDone ?? existing?.manualDone,
    note: opts?.note ?? existing?.note,
    updatedAt: new Date().toISOString(),
  }
  store.tasks[taskId] = record
  writeStore(store)
  return record
}

export function clearActionPlanTask(taskId: string): void {
  const store = readStore()
  delete store.tasks[taskId]
  writeStore(store)
}

export function clearAllActionPlanTasks(): void {
  writeStore({ tasks: {} })
}

/**
 * Resolve display status: stored + auto signals.
 * Auto can upgrade; never claims course booked/completed without stored note or interest booked/completed.
 */
export function resolveActionPlanTaskStatus(input: {
  taskId: string
  stored?: ActionPlanTaskRecord | null
  auto?: ActionPlanTaskStatus
}): ActionPlanTaskStatus {
  const stored = input.stored?.status ?? 'not_started'
  const auto = input.auto ?? 'not_started'
  return RANK[auto] > RANK[stored] ? auto : stored
}

export function requiredActionPlanProgress(tasks: Array<{ optional?: boolean; status: ActionPlanTaskStatus }>): {
  done: number
  total: number
} {
  const required = tasks.filter((t) => !t.optional)
  return {
    done: required.filter((t) => t.status === 'done').length,
    total: required.length,
  }
}
