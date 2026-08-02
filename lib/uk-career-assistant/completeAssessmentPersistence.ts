/**
 * Trace + persist UK Career Assistant assessment completion.
 * Called as soon as the API returns done — not deferred to a UI useEffect.
 */

import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import type { AiPersonalizedUkResult } from '@/lib/jobaz-ai/engines/careerIntelligence'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { isUkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import type { CareerBrainOutput } from '@/lib/career-brain/types'
import {
  normalizeStoredRuleResult,
  saveCaResultSnapshot,
  type CaResultSnapshot,
} from './guestSession'
import { persistCareerAssistantResult } from './persistAssessmentResult'

const LOG = '[CA persist]'

export type CompletionConversationMessage = {
  role: 'assistant' | 'user'
  content: string
}

export type ResolveCompletionInput = {
  done: boolean
  result: unknown
  aiState: Record<string, unknown>
  stateUpdates?: Record<string, unknown>
}

export type ResolvedCompletion = {
  ok: boolean
  result: (UkCareerRuleResult & { career_brain?: CareerBrainOutput }) | null
  validationError?: string
}

export function resolveAssessmentCompletion(input: ResolveCompletionInput): ResolvedCompletion {
  if (!input.done) {
    return { ok: false, result: null, validationError: 'Assessment not marked done' }
  }

  const mergedState = {
    ...input.aiState,
    ...(input.stateUpdates ?? {}),
    career_brain_result:
      input.stateUpdates?.career_brain_result ??
      input.aiState.career_brain_result,
  }

  if (input.result) {
    if (isUkCareerRuleResult(input.result)) {
      const brain =
        (input.result as { career_brain?: CareerBrainOutput }).career_brain ??
        (mergedState.career_brain_result as CareerBrainOutput | undefined)
      return {
        ok: true,
        result: brain
          ? { ...(input.result as UkCareerRuleResult), career_brain: brain }
          : (input.result as UkCareerRuleResult),
      }
    }

    const normalized = normalizeStoredRuleResult(input.result, mergedState)
    if (normalized) {
      return { ok: true, result: normalized }
    }
    return {
      ok: false,
      result: null,
      validationError: 'API result could not be normalized to UkCareerRuleResult',
    }
  }

  const brain = mergedState.career_brain_result
  if (brain && typeof brain === 'object') {
    const synthesized = normalizeStoredRuleResult(
      {
        career_brain: brain,
        summary: '',
        work_now: { directions: [] },
        avoid: [],
      },
      mergedState
    )
    if (synthesized) {
      return { ok: true, result: synthesized }
    }
  }

  return {
    ok: false,
    result: null,
    validationError: 'done=true but API returned no result and career_brain_result is missing',
  }
}

function createSessionId(existing: string | null): string {
  return existing ?? `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function buildPersistKey(sessionId: string, result: UkCareerRuleResult): string {
  return `${sessionId}:${result.summary ?? 'result'}`
}

export type RunCompletionPersistenceParams = {
  path: string | null
  aiState: Record<string, unknown>
  conversation: CompletionConversationMessage[]
  aiEnrichment?: AiPersonalizedUkResult | null
  sessionId: string | null
  persistedResultKeyRef: { current: string | null }
  source: string
  resolved: ResolvedCompletion
  skipSupabase?: boolean
}

export type RunCompletionPersistenceResult = {
  ok: boolean
  sessionId: string
  persistKey: string
  localSaved: boolean
  supabaseOk?: boolean
  assessmentId?: string
  error?: string
}

export async function runAssessmentCompletionPersistence(
  params: RunCompletionPersistenceParams
): Promise<RunCompletionPersistenceResult> {
  const sessionId = createSessionId(params.sessionId)
  const result = params.resolved.result

  if (!result) {
    console.error(`${LOG} abort — no normalized result`, params.resolved.validationError)
    return {
      ok: false,
      sessionId,
      persistKey: '',
      localSaved: false,
      error: params.resolved.validationError ?? 'Missing result',
    }
  }

  const persistKey = buildPersistKey(sessionId, result)

  if (params.persistedResultKeyRef.current === persistKey) {
    console.log(`${LOG} skipped — already persisted for key`, persistKey)
    return {
      ok: true,
      sessionId,
      persistKey,
      localSaved: true,
    }
  }

  const snapshot: CaResultSnapshot = {
    timestamp: Date.now(),
    sessionId,
    result: { path: params.path, result },
    aiState: params.aiState,
    conversation: params.conversation,
    aiEnrichment: params.aiEnrichment ?? undefined,
  }

  try {
    saveCaResultSnapshot(snapshot)
    console.log(`${LOG} localStorage write`, {
      key: 'jobaz_ca_last_result_v1',
      sessionId,
      summary: result.summary?.slice(0, 80),
    })
  } catch (err) {
    console.error(`${LOG} localStorage write failed`, err)
  }

  if (params.skipSupabase) {
    params.persistedResultKeyRef.current = persistKey
    return { ok: true, sessionId, persistKey, localSaved: true }
  }

  const userId = await resolveAuthenticatedUserId()

  console.log(`${LOG} userId`, userId ?? '(guest — local snapshot only)')

  const saveResult = await persistCareerAssistantResult({
    result,
    aiState: params.aiState,
    aiPersonalized: params.aiEnrichment ?? null,
    userId,
    source: params.source,
  })

  console.log(`${LOG} Supabase response`, {
    ok: saveResult.ok,
    assessmentId: saveResult.assessmentId,
    error: saveResult.error,
    table: saveResult.table,
  })

  if (saveResult.ok || !userId) {
    params.persistedResultKeyRef.current = persistKey
  }

  return {
    ok: saveResult.ok || !userId,
    sessionId,
    persistKey,
    localSaved: true,
    supabaseOk: userId ? saveResult.ok : undefined,
    assessmentId: saveResult.assessmentId,
    error: saveResult.error,
  }
}

export async function handleAssessmentApiCompletion(params: {
  done: boolean
  result: unknown
  path: string | null
  aiState: Record<string, unknown>
  stateUpdates?: Record<string, unknown>
  conversation: CompletionConversationMessage[]
  aiEnrichment?: AiPersonalizedUkResult | null
  sessionId: string | null
  persistedResultKeyRef: { current: string | null }
  source: string
  skipSupabase?: boolean
}): Promise<RunCompletionPersistenceResult | null> {
  console.log(`${LOG} Assessment completed`, {
    done: params.done,
    hasApiResult: Boolean(params.result),
    source: params.source,
  })

  if (!params.done) {
    console.log(`${LOG} not done — persistence skipped`)
    return null
  }

  console.log(`${LOG} Result generated`, {
    hasApiResult: Boolean(params.result),
    hasCareerBrain: Boolean(
      params.stateUpdates?.career_brain_result ?? params.aiState.career_brain_result
    ),
  })

  const resolved = resolveAssessmentCompletion({
    done: params.done,
    result: params.result,
    aiState: params.aiState,
    stateUpdates: params.stateUpdates,
  })

  if (!resolved.ok || !resolved.result) {
    console.error(`${LOG} validation rejected`, resolved.validationError)
    return {
      ok: false,
      sessionId: createSessionId(params.sessionId),
      persistKey: '',
      localSaved: false,
      error: resolved.validationError,
    }
  }

  console.log(`${LOG} Result normalized`, {
    summary: resolved.result.summary?.slice(0, 120),
    hasWorkNow: Boolean(resolved.result.work_now?.directions?.length),
    hasBrain: Boolean(resolved.result.career_brain),
  })

  return runAssessmentCompletionPersistence({
    path: params.path,
    aiState: params.aiState,
    conversation: params.conversation,
    aiEnrichment: params.aiEnrichment,
    sessionId: params.sessionId,
    persistedResultKeyRef: params.persistedResultKeyRef,
    source: params.source,
    resolved,
    skipSupabase: params.skipSupabase,
  })
}
