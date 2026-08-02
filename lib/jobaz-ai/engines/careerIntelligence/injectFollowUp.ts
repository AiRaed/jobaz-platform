/**
 * Inject AI follow-up questions into UK Career Assistant API responses.
 */

import { maybeGenerateFollowUp } from './orchestrator'
import type { UkCareerAssistantState } from './types'

type UkQuestion = {
  id: string
  text: string
  type: 'single' | 'multi'
  options: Array<{ value: string; label: string }>
  max_select?: number
  allow_free_text?: boolean
}

type UkApiResponse = {
  phase?: string
  done?: boolean
  question?: UkQuestion | null
  assistant_message?: string
  state_updates?: Record<string, unknown>
  [key: string]: unknown
}

function mergeState(
  base: UkCareerAssistantState,
  updates?: Record<string, unknown>
): UkCareerAssistantState {
  return {
    ...base,
    ...(updates ?? {}),
    answers: {
      ...(base.answers ?? {}),
      ...((updates?.answers as Record<string, unknown>) ?? {}),
    },
    ai_follow_up_ids: [
      ...(base.ai_follow_up_ids ?? []),
      ...(((updates?.ai_follow_up_ids as string[]) ?? [])),
    ],
  }
}

/**
 * When PATH phase has a next question, optionally replace it with an AI follow-up (max 2/session).
 */
export async function maybeInjectAiFollowUp(
  state: UkCareerAssistantState,
  response: UkApiResponse
): Promise<UkApiResponse> {
  if (response.done) return response
  if (response.phase !== 'PATH' && response.phase !== 'assessment') return response
  if (!response.question) return response
  if (response.question.id.startsWith('ai_follow_up_')) return response
  if (response.career_brain_active || response.question_source === 'career_brain') return response
  if (response.question.id.startsWith('cb_')) return response

  const merged = mergeState(state, response.state_updates)
  const followUp = await maybeGenerateFollowUp(merged)
  if (!followUp) return response

  return {
    ...response,
    question: followUp.question,
    assistant_message: 'One quick follow-up based on what you shared:',
    state_updates: {
      ...response.state_updates,
      ...followUp.stateUpdates,
    },
  }
}
