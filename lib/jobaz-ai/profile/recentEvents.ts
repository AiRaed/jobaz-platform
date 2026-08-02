/**
 * Recent AI career events for the dashboard journey timeline.
 */

import { supabase } from '@/lib/supabase'
import { getOrCreateAnonymousId } from '@/lib/jobaz-ai/memory/identity'
import { memoryDevLog } from '@/lib/jobaz-ai/memory/logger'
import { AI_SIGNAL_RULES } from '@/lib/jobaz-ai/engine/signals'
import { dedupeTimelineEvents } from '@/lib/jobaz-ai/engine/shouldEmitSignal'
import type { AiSignalType } from '@/lib/jobaz-ai/engine/types'

export type AiCareerTimelineEvent = {
  id: string
  eventName: string
  label: string
  source: string | null
  createdAt: string
}

const EXTRA_LABELS: Record<string, string> = {
  ai_profile_progressed: 'Career profile updated',
  ai_stage_changed: 'Career stage advanced',
  ai_assessment_started: 'Started AI Career Path',
  ai_assessment_completed: 'AI assessment completed',
  ai_career_path_completed: 'Completed AI Career Path',
  ai_dashboard_viewed: 'Viewed AI dashboard',
}

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {}
  return raw as Record<string, unknown>
}

function friendlyLabel(eventName: string, metadata: Record<string, unknown>): string {
  if (eventName in AI_SIGNAL_RULES) {
    return AI_SIGNAL_RULES[eventName as AiSignalType].journeyLabel
  }
  if (EXTRA_LABELS[eventName]) return EXTRA_LABELS[eventName]

  const signal = typeof metadata.signal === 'string' ? metadata.signal : eventName
  if (signal in AI_SIGNAL_RULES) {
    return AI_SIGNAL_RULES[signal as AiSignalType].journeyLabel
  }

  return eventName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function resolveSource(metadata: Record<string, unknown>): string | null {
  const source = metadata.source
  if (typeof source === 'string' && source.trim()) return source
  return null
}

export async function getRecentAiCareerEvents(limit = 5): Promise<AiCareerTimelineEvent[]> {
  if (typeof window === 'undefined') return []

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id ?? null
    const anonymousId = userId ? null : getOrCreateAnonymousId() || null

    if (!userId && !anonymousId) return []

    let query = supabase
      .from('ai_career_events')
      .select('id, event_name, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 3, 15))

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('anonymous_id', anonymousId).is('user_id', null)
    }

    const { data, error } = await query

    if (error) {
      memoryDevLog('Recent AI events fetch failed', error)
      return []
    }

    const mapped = (data ?? []).map((row) => {
      const metadata = parseMetadata(row.metadata)
      return {
        id: row.id as string,
        eventName: row.event_name as string,
        label: friendlyLabel(row.event_name as string, metadata),
        source: resolveSource(metadata),
        createdAt: row.created_at as string,
      }
    })

    return dedupeTimelineEvents(mapped).slice(0, limit)
  } catch (err) {
    memoryDevLog('Recent AI events error', err)
    return []
  }
}
