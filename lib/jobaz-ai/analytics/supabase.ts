import { createServerSupabaseClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsDevLog } from './logger'

export function getAnalyticsSupabase(): SupabaseClient | null {
  try {
    return createServerSupabaseClient()
  } catch (err) {
    analyticsDevLog('Server Supabase client unavailable', err)
    return null
  }
}

export async function countTableRows(
  supabase: SupabaseClient,
  table: 'ai_career_assessments' | 'ai_career_events'
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) {
    analyticsDevLog(`Count failed for ${table}`, error)
    return 0
  }
  return count ?? 0
}

export async function countEventsByName(
  supabase: SupabaseClient,
  eventName: string
): Promise<number> {
  const { count, error } = await supabase
    .from('ai_career_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', eventName)

  if (error) {
    analyticsDevLog(`Count failed for event ${eventName}`, error)
    return 0
  }
  return count ?? 0
}
