/**
 * JAZ UK Transition Engine — entry point.
 */

import type { CareerBrainState } from '../types'
import type { UkTransitionQuestionPick } from './ukTransitionTypes'
import {
  buildUkTransitionUnderstanding,
  isUkTransitionQuestioningComplete,
  mapLegacyNewToUkAnswers,
} from './ukTransitionUnderstanding'
import { pickNextUkTransitionQuestion } from './ukTransitionDynamicQuestions'

export {
  buildUkTransitionUnderstanding,
  computeUkTransitionConfidence,
  getUkTransitionAnswerIds,
  isUkTransitionAnswerKey,
  isUkTransitionQuestioningComplete,
  mapLegacyNewToUkAnswers,
} from './ukTransitionUnderstanding'

export {
  buildUkTransitionIntelligence,
  buildUkTransitionFinalReport,
  formatUkTransitionWhyThisPath,
  mergeUkTransitionIntoOutput,
} from './ukTransitionIntelligence'

export function pickNextUkTransitionEngineQuestion(state: CareerBrainState): UkTransitionQuestionPick {
  const mapped = mapLegacyNewToUkAnswers(state)
  const understanding = buildUkTransitionUnderstanding(mapped)

  if (isUkTransitionQuestioningComplete(mapped)) {
    return {
      question: null,
      reason: `JAZ UK Transition confidence ${understanding.confidence}% — sufficient evidence (${understanding.questionCount} answers)`,
      confidence: understanding.confidence,
      understanding,
    }
  }

  const dynamic = pickNextUkTransitionQuestion(understanding)
  if (dynamic) {
    return {
      question: dynamic.question,
      reason: dynamic.reason,
      confidence: understanding.confidence,
      understanding,
    }
  }

  return {
    question: null,
    reason: `JAZ UK Transition confidence ${understanding.confidence}% — no high-value gaps`,
    confidence: understanding.confidence,
    understanding,
  }
}
