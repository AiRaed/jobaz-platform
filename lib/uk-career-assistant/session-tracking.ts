/**
 * Career Assistant session tracking (Supabase).
 * Best-effort only: all calls are try/catch and never throw.
 */

import { supabase } from '@/lib/supabase'

export type RecommendedRole = { id: string; title: string }

/**
 * Create a new session. Returns session id or null.
 */
export async function createCaSession(path: string | null): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('career_assistant_sessions')
      .insert({
        user_id: user.id,
        path: path ?? null,
        answers: {},
        recommended_roles: [],
      })
      .select('id')
      .single()
    if (error || !data?.id) return null
    return data.id
  } catch {
    return null
  }
}

/**
 * Update session answers (merge) and path. No-op if sessionId is null.
 */
export async function updateCaSessionAnswers(
  sessionId: string | null,
  answers: Record<string, unknown>,
  path: string | null
): Promise<void> {
  if (!sessionId) return
  try {
    await supabase
      .from('career_assistant_sessions')
      .update({
        answers: answers && typeof answers === 'object' ? answers : {},
        path: path ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  } catch {
    // no-op
  }
}

/**
 * Mark session completed and set recommended_roles. Optional selected_role.
 */
export async function completeCaSession(
  sessionId: string | null,
  recommendedRoles: RecommendedRole[],
  selectedRole?: string | null
): Promise<void> {
  if (!sessionId) return
  try {
    const payload: Record<string, unknown> = {
      completed: true,
      recommended_roles: recommendedRoles,
      updated_at: new Date().toISOString(),
    }
    if (selectedRole != null) payload.selected_role = selectedRole
    await supabase
      .from('career_assistant_sessions')
      .update(payload)
      .eq('id', sessionId)
  } catch {
    // no-op
  }
}

/**
 * Set selected_role when user clicks a specific option/direction card (optional).
 */
export async function updateCaSessionSelectedRole(
  sessionId: string | null,
  selectedRole: string
): Promise<void> {
  if (!sessionId || !selectedRole) return
  try {
    await supabase
      .from('career_assistant_sessions')
      .update({ selected_role: selectedRole, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
  } catch {
    // no-op
  }
}
