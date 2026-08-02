/**
 * AI dashboard interaction tracking (ai_career_events).
 * Best-effort: never throws.
 */

import { supabase } from '@/lib/supabase'
import { getOrCreateAnonymousId, getOrCreateSessionId } from '@/lib/jobaz-ai/memory/identity'
import { memoryDevLog } from '@/lib/jobaz-ai/memory/logger'
import { shouldEmitSignal, recordSignalEmission } from '@/lib/jobaz-ai/engine/shouldEmitSignal'
import { triggerProfileProgression } from './progression'

export const AI_DASHBOARD_PAGE = '/dashboard' as const
export const AI_DASHBOARD_SOURCE = 'ai_dashboard' as const

export type AiDashboardEventName =
  | 'ai_dashboard_viewed'
  | 'ai_dashboard_recommendation_clicked'
  | 'ai_dashboard_continue_path_clicked'
  | 'ai_dashboard_retake_clicked'
  | 'ai_action_plan_viewed'
  | 'ai_action_task_clicked'

export type AiDashboardEventMetadata = {
  source?: string
  recommended_path?: string
  recommendation_type?: string
  tool_name?: string
  tool_id?: string
  destination?: string
  weakest_area?: string
  has_profile?: boolean
  task_label?: string
  route?: string
  priority?: string
  task_count?: number
  [key: string]: unknown
}

export async function trackAiDashboardEvent(
  eventName: AiDashboardEventName,
  metadata: AiDashboardEventMetadata = {}
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const anonymousId = getOrCreateAnonymousId()
    const sessionId = getOrCreateSessionId()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const userId = session?.user?.id ?? null

    const allowed = await shouldEmitSignal(userId, eventName, undefined, {
      anonymousId: anonymousId || null,
      metadata,
    })
    if (!allowed) return

    const { error } = await supabase.from('ai_career_events').insert({
      user_id: userId,
      anonymous_id: anonymousId || null,
      session_id: sessionId || null,
      event_name: eventName,
      page: AI_DASHBOARD_PAGE,
      metadata: {
        source: AI_DASHBOARD_SOURCE,
        ...metadata,
      },
    })

    if (error) memoryDevLog(`Dashboard event failed: ${eventName}`, error)
    else recordSignalEmission(userId, anonymousId || null, eventName)

    if (
      eventName === 'ai_dashboard_recommendation_clicked' ||
      eventName === 'ai_dashboard_continue_path_clicked'
    ) {
      void triggerProfileProgression('ai_dashboard_tool_clicked', {
        dedupeId: metadata.tool_id ?? metadata.destination,
        metadata: { dashboard_event: eventName, ...metadata },
      })
    }
  } catch (err) {
    memoryDevLog(`Dashboard event error: ${eventName}`, err)
  }
}
