/**
 * Signal cooldown / deduplication — prevents spammy AI journey entries.
 */

import { supabase } from '@/lib/supabase'
import { memoryDevLog } from '@/lib/jobaz-ai/memory/logger'
import { AI_SIGNAL_RULES, normalizeSignal } from './signals'
import type { AiSignalType } from './types'

/** Always emit — meaningful career milestones. */
const HIGH_VALUE_SIGNALS = new Set<AiSignalType>([
  'cv_created',
  'jobs_saved',
  'jobs_applied',
  'applied_job_saved',
  'interview_completed',
  'interview_training_completed',
  'voice_training_completed',
  'mock_interview_completed',
  'skill_path_started',
  'lesson_completed',
  'skill_goal_selected',
  'writing_review_completed',
  'ai_assessment_completed',
])

/** Low-value browse/view signals — cooldown in minutes. */
export const SIGNAL_COOLDOWN_MINUTES: Record<string, number> = {
  jobs_viewed: 15,
  job_listings_viewed: 15,
  job_detail_viewed: 10,
  ai_dashboard_viewed: 20,
  dashboard_viewed: 20,
  ai_dashboard_tool_clicked: 15,
  ai_action_plan_viewed: 20,
  writing_review_used: 15,
  skill_path_started: 30,
  skill_path_viewed: 15,
  flow_abandoned: 60,
  interview_started: 20,
  interview_question_answered: 5,
}

const SIGNAL_ALIASES: Record<string, string> = {
  job_listings_viewed: 'jobs_viewed',
  dashboard_viewed: 'ai_dashboard_viewed',
}

/** In-memory fast path — blocks rapid re-renders in the same tab. */
const memoryCooldown = new Map<string, number>()

export function resolveSignalForCooldown(signalType: string): string {
  const aliased = SIGNAL_ALIASES[signalType] ?? signalType
  if (aliased in AI_SIGNAL_RULES) {
    return normalizeSignal(aliased)
  }
  return aliased
}

export function isHighValueSignal(
  signalType: string,
  metadata?: Record<string, unknown>
): boolean {
  const normalized = resolveSignalForCooldown(signalType) as AiSignalType
  if (HIGH_VALUE_SIGNALS.has(normalized)) return true
  if (normalized === 'cv_updated' && metadata?.cvCompleted === true) return true
  if (normalized === 'grammar_improved' && metadata?.fixesApplied === true) return true
  if (normalized === 'professional_writing_improved') return true
  if (normalized === 'confidence_practice_completed') return true
  return false
}

export function getSignalCooldownMinutes(signalType: string): number {
  const resolved = resolveSignalForCooldown(signalType)
  return SIGNAL_COOLDOWN_MINUTES[signalType] ?? SIGNAL_COOLDOWN_MINUTES[resolved] ?? 0
}

function identityKey(userId: string | null, anonymousId: string | null): string | null {
  return userId ?? anonymousId ?? null
}

function memoryCacheKey(identity: string, signal: string): string {
  return `${identity}:${signal}`
}

export function recordSignalEmission(
  userId: string | null,
  anonymousId: string | null,
  signalType: string
): void {
  const identity = identityKey(userId, anonymousId)
  if (!identity) return
  const signal = resolveSignalForCooldown(signalType)
  memoryCooldown.set(memoryCacheKey(identity, signal), Date.now())
}

async function hasRecentCareerEvent(
  userId: string | null,
  anonymousId: string | null,
  eventName: string,
  cooldownMinutes: number
): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (cooldownMinutes <= 0) return false

  const since = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString()

  try {
    let query = supabase
      .from('ai_career_events')
      .select('id')
      .eq('event_name', eventName)
      .gte('created_at', since)
      .limit(1)

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (anonymousId) {
      query = query.eq('anonymous_id', anonymousId).is('user_id', null)
    } else {
      return false
    }

    const { data, error } = await query
    if (error) {
      memoryDevLog('Signal cooldown DB check failed', error)
      return false
    }
    return (data?.length ?? 0) > 0
  } catch (err) {
    memoryDevLog('Signal cooldown DB check error', err)
    return false
  }
}

/**
 * Returns true when the signal should be emitted (not within cooldown).
 */
export async function shouldEmitSignal(
  userId: string | null | undefined,
  signalType: AiSignalType | string,
  cooldownMinutes?: number,
  options?: {
    anonymousId?: string | null
    metadata?: Record<string, unknown>
  }
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const metadata = options?.metadata
  if (isHighValueSignal(signalType, metadata)) return true

  const anonymousId = options?.anonymousId ?? null
  const identity = identityKey(userId ?? null, anonymousId)
  if (!identity) return true

  const signal = resolveSignalForCooldown(signalType)
  const cooldown = cooldownMinutes ?? getSignalCooldownMinutes(signal)
  if (cooldown <= 0) return true

  const cacheKey = memoryCacheKey(identity, signal)
  const lastMemory = memoryCooldown.get(cacheKey)
  if (lastMemory && Date.now() - lastMemory < cooldown * 60 * 1000) {
    memoryDevLog(`Signal cooldown (memory): skipped ${signal}`)
    return false
  }

  const recentInDb = await hasRecentCareerEvent(userId ?? null, anonymousId, signal, cooldown)
  if (recentInDb) {
    memoryDevLog(`Signal cooldown (db): skipped ${signal}`)
    memoryCooldown.set(cacheKey, Date.now())
    return false
  }

  return true
}

/** Event names collapsed in timeline display for legacy duplicate rows. */
export const LOW_VALUE_JOURNEY_EVENTS = new Set<string>([
  'jobs_viewed',
  'job_detail_viewed',
  'ai_dashboard_viewed',
  'ai_dashboard_tool_clicked',
  'ai_action_plan_viewed',
  'writing_review_used',
  'skill_path_viewed',
  'interview_started',
  'interview_question_answered',
])

export function getTimelineCooldownMs(eventName: string): number {
  const minutes = getSignalCooldownMinutes(eventName)
  return minutes > 0 ? minutes * 60 * 1000 : 15 * 60 * 1000
}

export function dedupeTimelineEvents<T extends { eventName: string; createdAt: string }>(
  events: T[]
): T[] {
  const lastSeen = new Map<string, number>()
  const result: T[] = []

  for (const event of events) {
  if (!LOW_VALUE_JOURNEY_EVENTS.has(event.eventName)) {
      result.push(event)
      continue
    }

    const ts = new Date(event.createdAt).getTime()
    const cooldownMs = getTimelineCooldownMs(event.eventName)
    const prev = lastSeen.get(event.eventName)
    if (prev !== undefined && prev - ts < cooldownMs) {
      continue
    }
    lastSeen.set(event.eventName, ts)
    result.push(event)
  }

  return result
}
