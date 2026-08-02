import type { FunnelStatRow } from './types'
import { countEventsByName, getAnalyticsSupabase } from './supabase'

const FUNNEL_EVENTS: { eventName: string; label: string }[] = [
  { eventName: 'ai_path_page_viewed', label: 'Page viewed' },
  { eventName: 'ai_path_started', label: 'Path started' },
  { eventName: 'ai_path_completed', label: 'Path completed' },
  { eventName: 'ai_path_signup_clicked', label: 'Signup clicked' },
]

export async function getFunnelStats(): Promise<FunnelStatRow[]> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) {
    return FUNNEL_EVENTS.map(({ eventName, label }) => ({
      eventName,
      label,
      count: 0,
      conversionFromPreviousPercent: null,
    }))
  }

  const counts = await Promise.all(
    FUNNEL_EVENTS.map(({ eventName }) => countEventsByName(supabase, eventName))
  )

  return FUNNEL_EVENTS.map(({ eventName, label }, index) => {
    const count = counts[index] ?? 0
    const prev = index > 0 ? (counts[index - 1] ?? 0) : 0
    const conversionFromPreviousPercent =
      index === 0 || prev <= 0 ? null : Math.round((count / prev) * 1000) / 10

    return {
      eventName,
      label,
      count,
      conversionFromPreviousPercent,
    }
  })
}
