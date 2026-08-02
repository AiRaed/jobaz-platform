import { supabase } from '@/lib/supabase'

/**
 * Single source of truth for authenticated user id — always from supabase.auth.getUser().
 *
 * Mapping:
 * - auth.users.id          → returned here; stored as ai_career_assessments.user_id
 * - profiles.id (if any)   → NOT used for assessment ownership
 * - ai_career_assessments.id → assessment row id only; never passed as userId
 */
export async function resolveAuthenticatedUserId(
  explicitUserId?: string | null
): Promise<string | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const authUserId = user?.id ?? null

  if (authUserId) {
    if (explicitUserId && explicitUserId !== authUserId) {
      console.error('[auth] rejected stale explicit userId — using auth.users.id', {
        explicitUserId,
        authUserId,
      })
    }
    return authUserId
  }

  if (userError) {
    console.warn('[auth] getUser() failed', userError.message)
  }

  if (explicitUserId) {
    console.error('[auth] explicit userId ignored — no valid Supabase auth user', {
      explicitUserId,
    })
  }

  return null
}

/**
 * Optional mismatch check — silent in production; one console.error on mismatch only.
 * Do not pass assessment row ids into these fields.
 */
export async function logAuthUserIdMatch(context: {
  label: string
  dashboardUserId?: string | null
  saveUserId?: string | null
  loadUserId?: string | null
}): Promise<string | null> {
  const authUserId = await resolveAuthenticatedUserId()
  const dashboardUserId = context.dashboardUserId ?? authUserId
  const saveUserId = context.saveUserId ?? authUserId
  const loadUserId = context.loadUserId ?? authUserId

  const match =
    (!authUserId && !dashboardUserId && !saveUserId && !loadUserId) ||
    (authUserId === dashboardUserId &&
      authUserId === saveUserId &&
      authUserId === loadUserId)

  if (authUserId && !match) {
    console.error(`[auth] ${context.label} USER ID MISMATCH`, {
      authUid: authUserId,
      dashboardUserId,
      saveUserId,
      loadUserId,
    })
  }

  return authUserId
}
