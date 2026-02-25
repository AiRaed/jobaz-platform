/**
 * Single analytics tracker: writes to public.user_activity_events only.
 * Never throws; fails silently with a single console.warn.
 * Server-safe: pass Supabase client when calling from server; omit on client to use browser client.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function trackEvent(
  event_name: string,
  metadata?: unknown,
  supabase?: SupabaseClient
): Promise<void> {
  const client = supabase ?? (typeof window !== 'undefined' ? await getClientSupabase() : undefined)
  if (!client) return

  try {
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError || !user) return

    const { error } = await client
      .from('user_activity_events')
      .insert({
        user_id: user.id,
        event_name,
        metadata: metadata != null && typeof metadata === 'object' ? metadata : {},
      })

    if (error) {
      console.warn('[trackEvent]', event_name, error.message)
    }
  } catch (err) {
    console.warn('[trackEvent]', event_name, err)
  }
}

async function getClientSupabase(): Promise<SupabaseClient | undefined> {
  try {
    const { supabase } = await import('@/lib/supabase')
    return supabase
  } catch {
    return undefined
  }
}
