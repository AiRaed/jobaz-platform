/**
 * AI Profile Progression — delegates to the universal emitSignal helper.
 */

import { emitAiSignal } from '@/lib/jobaz-ai/emitSignal'
import type { AiSignalType } from '@/lib/jobaz-ai/emitSignal'

export type { ProgressionMeta } from './types'

export type ProgressionTriggerEvent =
  | 'cv_created'
  | 'cv_updated'
  | 'writing_review_used'
  | 'interview_training_completed'
  | 'applied_job_saved'
  | 'ai_dashboard_tool_clicked'
  | 'flow_abandoned'

export type UpdateProfileProgressionInput = {
  event: ProgressionTriggerEvent
  userId?: string | null
  anonymousId?: string | null
  dedupeId?: string
  metadata?: Record<string, unknown>
}

/** @deprecated Use emitAiSignal from @/lib/jobaz-ai/emitSignal */
export async function updateProfileProgression(
  input: UpdateProfileProgressionInput
): Promise<void> {
  await emitAiSignal({
    signalType: input.event,
    metadata: {
      dedupeId: input.dedupeId,
      ...input.metadata,
    },
  })
}

/** Log trigger and evolve profile via AI Intelligence Engine (client-only). */
export async function triggerProfileProgression(
  event: ProgressionTriggerEvent,
  options?: { dedupeId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await emitAiSignal({
    signalType: event as AiSignalType,
    metadata: {
      dedupeId: options?.dedupeId,
      ...options?.metadata,
    },
  })
}

export { emitAiSignal } from '@/lib/jobaz-ai/emitSignal'
