/**
 * Analytics event logging for JobAZ.
 * Writes to Supabase: user_activity_events and user_metrics.
 * Never throws; failures are silent so UI is never blocked.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const COUNTER_BY_EVENT: Partial<Record<string, keyof UserMetricsRow>> = {
  login: 'total_logins',
  cv_created: 'total_cvs',
  cover_letter_generated: 'total_cover_letters',
  job_saved: 'total_saved_jobs',
  job_applied: 'total_applied_jobs',
  career_assistant_completed: 'total_career_assessments',
}

interface UserMetricsRow {
  user_id: string
  total_logins: number
  total_cvs: number
  total_cover_letters: number
  total_saved_jobs: number
  total_applied_jobs: number
  total_career_assessments: number
  last_active_at: string
  created_at: string
  updated_at: string
}

/**
 * Log an analytics event.
 * - Server (API routes): pass the request's Supabase client as third argument.
 * - Client: call with only (event_name, metadata?) — logs via POST /api/analytics/log.
 * Failures are caught and never block the UI.
 */
export async function logEvent(
  event_name: string,
  metadata?: object,
  supabase?: SupabaseClient
): Promise<void> {
  try {
    if (supabase) {
      await logEventServer(supabase, event_name, metadata ?? {})
      return
    }
    // Client: fire-and-forget POST to analytics API
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name, metadata: metadata ?? {} }),
      }).catch(() => {})
    }
  } catch {
    // Never block: swallow any error
  }
}

/**
 * Server-side implementation: get user from Supabase auth, insert event, upsert metrics.
 * Call this from API routes with the request's Supabase client, or use logEvent(..., supabase).
 */
export async function logEventServer(
  supabase: SupabaseClient,
  event_name: string,
  metadata: object
): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return

    const userId = user.id

    await supabase.from('user_activity_events').insert({
      user_id: userId,
      event_name,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    })

    const counterColumn = COUNTER_BY_EVENT[event_name]
    const now = new Date().toISOString()

    // Ensure row exists
    const { data: existing } = await supabase
      .from('user_metrics')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      const initial: Record<string, unknown> = {
        user_id: userId,
        total_logins: 0,
        total_cvs: 0,
        total_cover_letters: 0,
        total_saved_jobs: 0,
        total_applied_jobs: 0,
        total_career_assessments: 0,
        last_active_at: now,
        created_at: now,
        updated_at: now,
      }
      if (counterColumn) (initial[counterColumn] as number) = 1
      await supabase.from('user_metrics').insert(initial)
      return
    }

    // Update: increment counter (if any) and last_active_at
    const update: Record<string, unknown> = {
      last_active_at: now,
      updated_at: now,
    }
    if (counterColumn) {
      const { data: row } = await supabase
        .from('user_metrics')
        .select(counterColumn)
        .eq('user_id', userId)
        .single()
      const current = Number((row as Record<string, unknown>)?.[counterColumn]) || 0
      update[counterColumn] = current + 1
    }
    await supabase.from('user_metrics').update(update).eq('user_id', userId)
  } catch {
    // Never throw
  }
}
