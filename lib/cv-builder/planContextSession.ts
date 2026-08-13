/**
 * Session-only CV Builder plan-context mode.
 * Does NOT touch saved CV, My Plan, or profile data.
 */

export type CvPlanModeChoice = 'tailor' | 'keep' | 'normal'

export type CvPlanModeSession = {
  choice: CvPlanModeChoice
  /** Role / route key this choice applies to */
  contextKey: string
  at: number
}

const STORAGE_KEY = 'jobaz_cv_plan_mode_choice_v1'
const SUPPRESS_KEY = 'jobaz_cv_plan_mode_suppress_v1'

export function buildPlanContextKey(input: {
  role?: string | null
  route?: string | null
  planId?: string | null
}): string {
  const role = (input.role || '').trim().toLowerCase()
  const route = (input.route || '').trim().toLowerCase()
  const planId = (input.planId || '').trim()
  return [planId, route, role].filter(Boolean).join('|') || 'plan'
}

export function readPlanModeChoice(contextKey: string): CvPlanModeChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CvPlanModeSession
    if (!parsed?.choice || !parsed?.contextKey) return null
    if (parsed.contextKey !== contextKey) return null
    if (parsed.choice !== 'tailor' && parsed.choice !== 'keep' && parsed.choice !== 'normal') {
      return null
    }
    return parsed.choice
  } catch {
    return null
  }
}

export function writePlanModeChoice(contextKey: string, choice: CvPlanModeChoice): void {
  if (typeof window === 'undefined') return
  try {
    const payload: CvPlanModeSession = {
      choice,
      contextKey,
      at: Date.now(),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    if (choice === 'normal') {
      sessionStorage.setItem(SUPPRESS_KEY, '1')
    } else {
      sessionStorage.removeItem(SUPPRESS_KEY)
    }
  } catch {
    // ignore
  }
}

export function clearPlanModeSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(SUPPRESS_KEY)
  } catch {
    // ignore
  }
}

/** Session flag: user exited plan mode for this browser tab. */
export function readPlanModeSuppressed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(SUPPRESS_KEY) === '1'
  } catch {
    return false
  }
}

export function writePlanModeSuppressed(suppressed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (suppressed) sessionStorage.setItem(SUPPRESS_KEY, '1')
    else sessionStorage.removeItem(SUPPRESS_KEY)
  } catch {
    // ignore
  }
}

/** Query keys that activate CV Builder plan/route context from My Plan. */
export const PLAN_CONTEXT_QUERY_KEYS = [
  'targetRole',
  'role',
  'route',
  'focus',
  'planTask',
  'mode',
] as const

export function stripPlanContextQueryString(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  for (const key of PLAN_CONTEXT_QUERY_KEYS) {
    // Keep mode only when it is not the improve/plan flow
    if (key === 'mode') {
      const mode = params.get('mode')
      if (mode === 'improve' || mode === 'tailorCv') {
        params.delete('mode')
      }
      continue
    }
    params.delete(key)
  }
  const next = params.toString()
  return next ? `?${next}` : ''
}
