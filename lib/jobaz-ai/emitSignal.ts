/**
 * Universal AI signal helper — connects JobAZ tools to the existing AI engine.
 *
 * Inserts ai_career_events, then delegates profile updates to updateUserProfile().
 * Rule-based only; never throws to callers.
 */

import { supabase } from '@/lib/supabase'
import { getOrCreateAnonymousId, getOrCreateSessionId } from '@/lib/jobaz-ai/memory/identity'
import { memoryDevLog } from '@/lib/jobaz-ai/memory/logger'
import { updateUserProfile } from '@/lib/jobaz-ai/engine/updateUserProfile'
import { normalizeSignal } from '@/lib/jobaz-ai/engine/signals'
import {
  recordSignalEmission,
  shouldEmitSignal,
} from '@/lib/jobaz-ai/engine/shouldEmitSignal'
import type { AiSignalType } from '@/lib/jobaz-ai/engine/types'

export type EmitSignalMetadata = {
  dedupeId?: string
  page?: string
  source?: string
  cvCompleted?: boolean
  [key: string]: unknown
}

export type EmitSignalImpact = {
  readiness?: number
  engagement?: number
  englishConfidence?: number
  jobSearchActivity?: number
}

export type EmitAiSignalInput = {
  userId?: string | null
  anonymousId?: string | null
  sessionId?: string | null
  /** Preferred name for tool integrations */
  type?: AiSignalType | string
  /** Alias for `type` */
  signalType?: AiSignalType | string
  /** Tool identifier, e.g. `cv-builder` */
  source?: string
  /** Optional score deltas; falls back to engine rules when omitted */
  impact?: EmitSignalImpact
  metadata?: EmitSignalMetadata
}

function normalizeEmitInput(input: EmitAiSignalInput): {
  signalType: AiSignalType | string
  source: string | undefined
  impact: EmitSignalImpact | undefined
  metadata: EmitSignalMetadata
} {
  const signalType = input.type ?? input.signalType ?? 'ai_dashboard_tool_clicked'
  const { source: metaSource, ...restMeta } = input.metadata ?? {}
  return {
    signalType,
    source: input.source ?? metaSource,
    impact: input.impact,
    metadata: {
      ...restMeta,
      ...(input.source ? { source: input.source } : metaSource ? { source: metaSource } : {}),
    },
  }
}

async function resolveIdentity(input: EmitAiSignalInput): Promise<{
  userId: string | null
  anonymousId: string | null
  sessionId: string | null
}> {
  let userId = input.userId ?? null
  if (!userId) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    userId = session?.user?.id ?? null
  }

  const anonymousId = userId
    ? null
    : input.anonymousId?.trim() || getOrCreateAnonymousId() || null
  const sessionId = input.sessionId?.trim() || getOrCreateSessionId() || null

  return { userId, anonymousId, sessionId }
}

/**
 * Emit an AI career signal from any JobAZ tool.
 */
export async function emitAiSignal(input: EmitAiSignalInput): Promise<void> {
  if (typeof window === 'undefined') return

  const { signalType, source, impact, metadata } = normalizeEmitInput(input)
  const normalized = normalizeSignal(signalType)
  const { dedupeId, page, ...restMeta } = metadata

  try {
    const { userId, anonymousId, sessionId } = await resolveIdentity(input)

    const allowed = await shouldEmitSignal(userId, normalized, undefined, {
      anonymousId,
      metadata: metadata,
    })
    if (!allowed) return

    await supabase.from('ai_career_events').insert({
      user_id: userId,
      anonymous_id: anonymousId,
      session_id: sessionId,
      event_name: normalized,
      page: page ?? window.location.pathname,
      metadata: {
        source: source ?? 'jobaz_ai_signal',
        signal: normalized,
        ...(impact ? { impact } : {}),
        ...restMeta,
      },
    })

    await updateUserProfile({
      signal: normalized,
      userId,
      anonymousId,
      dedupeId: typeof dedupeId === 'string' ? dedupeId : undefined,
      impact,
      metadata,
    })

    recordSignalEmission(userId, anonymousId, normalized)
  } catch (err) {
    memoryDevLog(`emitAiSignal failed: ${signalType}`, err)
  }
}

export { notifyProfileUpdated } from '@/lib/jobaz-ai/engine/updateUserProfile'
export {
  shouldEmitSignal,
  recordSignalEmission,
  isHighValueSignal,
  getSignalCooldownMinutes,
} from '@/lib/jobaz-ai/engine/shouldEmitSignal'
export type { AiSignalType, ScoreDelta } from '@/lib/jobaz-ai/engine/types'
