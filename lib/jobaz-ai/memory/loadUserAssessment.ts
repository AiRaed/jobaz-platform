/**
 * Load the latest career assessment for the authenticated user from Supabase.
 *
 * ai_career_assessments.id       = assessment row id (never a user id)
 * ai_career_assessments.user_id  = auth.users.id ownership
 */

import { supabase } from '@/lib/supabase'

export type UserAssessmentRecord = {
  id: string
  user_id: string | null
  anonymous_id: string | null
  session_id: string | null
  answers: Record<string, unknown>
  result: unknown
  recommended_path: string | null
  source: string | null
  created_at: string
}

/**
 * Latest assessment owned by this auth user.
 * Filters by user_id = authUserId, orders by created_at desc, limit 1.
 */
export async function fetchLatestAssessmentForUser(
  authUserId: string
): Promise<UserAssessmentRecord | null> {
  if (!authUserId) return null

  const { data, error } = await supabase
    .from('ai_career_assessments')
    .select('id, user_id, anonymous_id, session_id, answers, result, recommended_path, source, created_at')
    .eq('user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[fetchLatestAssessmentForUser] Supabase error', {
      table: 'ai_career_assessments',
      authUserId,
      code: error.code,
      message: error.message,
    })
    return null
  }

  return (data as UserAssessmentRecord | null) ?? null
}
