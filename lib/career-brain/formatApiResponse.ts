/**
 * Format Career Brain turn for UK Career Assistant API (single source of truth).
 */

import { isCareerBrainEnabled } from './config'
import {
  normalizeCareerBrainQuestion,
  toLegacyUiQuestion,
} from './normalizeQuestion'
import type { CareerBrainTurnResult } from './types'

export type FormattedCareerBrainPayload = CareerBrainTurnResult['response'] & {
  career_brain_active: true
  question_source: 'career_brain'
  legacy_flow_bypassed: true
  question: ReturnType<typeof toLegacyUiQuestion>
  current_question: ReturnType<typeof toLegacyUiQuestion>
}

export function formatCareerBrainApiResponse(
  turn: CareerBrainTurnResult
): FormattedCareerBrainPayload {
  const normalized = normalizeCareerBrainQuestion(turn.response.question)
  const legacyQuestion = toLegacyUiQuestion(normalized)

  const debug = turn.debug

  if (process.env.NODE_ENV === 'development') {
    console.log('[UK Career Assistant] Career Brain response', {
      CAREER_BRAIN_ENABLED: isCareerBrainEnabled(),
      question_source: 'career_brain',
      legacy_flow_bypassed: true,
      question_id: legacyQuestion?.id ?? null,
      question_text: legacyQuestion?.text ?? null,
      options_count: legacyQuestion?.options?.length ?? 0,
      detected_domain: debug.detectedDomain,
      done: turn.response.done,
      phase: turn.response.phase,
    })
  }

  return {
    ...turn.response,
    question: legacyQuestion,
    current_question: legacyQuestion,
    career_brain_active: true,
    question_source: 'career_brain',
    legacy_flow_bypassed: true,
  }
}
