/**
 * Drop stale career-plan caches when auth.users.id changes.
 */

import { readCareerPlanDebugTrace } from '@/lib/dashboard/careerOs/debugTrace'
import { syncCachedUserIdFromAuth } from '@/lib/user-storage'

const CAREER_DEBUG_KEY = 'jobaz_career_plan_debug_v1'

/** Legacy keys that may hold stale auth/profile ids — safe to clear on account switch. */
const STALE_AUTH_CACHE_KEYS = [
  CAREER_DEBUG_KEY,
  'jobaz_ai_anonymous_id',
] as const

/**
 * Sync memory caches to the verified auth user.
 * Does NOT invalidate the assessment bundle on every call (avoids re-fetch loops).
 * Assessment cache invalidation lives in assessmentLoader / explicit resets.
 */
export function clearStaleCareerAuthCaches(authUserId: string | null): void {
  if (typeof window === 'undefined') return

  syncCachedUserIdFromAuth(authUserId)

  const trace = readCareerPlanDebugTrace()
  if (trace?.userId && authUserId && trace.userId !== authUserId) {
    try {
      localStorage.removeItem(CAREER_DEBUG_KEY)
    } catch {
      // best-effort
    }
  }
}

export function clearLegacyAuthCacheKeys(): void {
  if (typeof window === 'undefined') return
  for (const key of STALE_AUTH_CACHE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // best-effort
    }
  }
}

export async function reconcileAuthUserCaches(): Promise<string | null> {
  const { resolveAuthenticatedUserId } = await import('./resolveUserId')
  const authUserId = await resolveAuthenticatedUserId()
  clearStaleCareerAuthCaches(authUserId)
  return authUserId
}
