import { summarizeEventMetadata } from './metadata'
import type { RecentAiEventRow } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

const DEFAULT_LIMIT = 25

export async function getRecentAiEvents(
  limit = DEFAULT_LIMIT
): Promise<RecentAiEventRow[]> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ai_career_events')
    .select('id, event_name, created_at, anonymous_id, metadata')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    analyticsDevLog('Recent events query failed', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    eventName: row.event_name as string,
    createdAt: row.created_at as string,
    anonymousId: (row.anonymous_id as string | null) ?? null,
    metadataSummary: summarizeEventMetadata(
      (row.metadata as Record<string, unknown> | null) ?? null
    ),
  }))
}
