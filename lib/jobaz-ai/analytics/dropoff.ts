import type { DropoffStepStat } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

const STEPS = [1, 2, 3, 4, 5] as const

export async function getDropoffStats(): Promise<DropoffStepStat[]> {
  const empty = STEPS.map((step) => ({
    step,
    label: `Step ${step}`,
    count: 0,
  }))

  const supabase = getAnalyticsSupabase()
  if (!supabase) return empty

  const { data, error } = await supabase
    .from('ai_career_events')
    .select('anonymous_id, session_id, metadata')
    .eq('event_name', 'ai_path_question_answered')

  if (error) {
    analyticsDevLog('Drop-off stats query failed', error)
    return empty
  }

  const visitorsByStep = new Map<number, Set<string>>()
  for (const step of STEPS) {
    visitorsByStep.set(step, new Set())
  }

  for (const row of data ?? []) {
    const meta = row.metadata as { current_step?: number } | null
    const step = Number(meta?.current_step)
    if (!STEPS.includes(step as (typeof STEPS)[number])) continue

    const visitorKey =
      (row.session_id as string | null) ||
      (row.anonymous_id as string | null) ||
      null
    if (!visitorKey) continue

    visitorsByStep.get(step)?.add(visitorKey)
  }

  return STEPS.map((step) => ({
    step,
    label: `Step ${step}`,
    count: visitorsByStep.get(step)?.size ?? 0,
  }))
}
