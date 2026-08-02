/**
 * Track AI Career Path Finder events (Supabase ai_career_events).
 * Best-effort: never throws; failures are logged in development only.
 */

import { supabase } from '@/lib/supabase'
import { getOrCreateAnonymousId, getOrCreateSessionId } from './identity'
import { memoryDevLog } from './logger'
import {
  AI_CAREER_PAGE,
  AI_CAREER_SOURCE,
  type AiCareerEventMetadata,
  type AiCareerEventName,
} from './types'

export async function trackAiCareerEvent(
  eventName: AiCareerEventName,
  metadata: AiCareerEventMetadata = {}
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const anonymousId = getOrCreateAnonymousId()
    const sessionId = getOrCreateSessionId()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const payload = {
      user_id: user?.id ?? null,
      anonymous_id: anonymousId || null,
      session_id: sessionId || null,
      event_name: eventName,
      page: AI_CAREER_PAGE,
      metadata: {
        source: AI_CAREER_SOURCE,
        ...metadata,
      },
    }

    const { error } = await supabase.from('ai_career_events').insert(payload)
    if (error) {
      memoryDevLog(`Event insert failed: ${eventName}`, error)
    }
  } catch (err) {
    memoryDevLog(`Event tracking error: ${eventName}`, err)
  }
}
