/**
 * JAZ Business Discovery Engine — entry point.
 */

import type { CareerBrainState } from '../types'
import type { BusinessDiscoveryQuestionPick } from './businessDiscoveryTypes'
import {
  buildBusinessDiscoveryUnderstanding,
  isBusinessDiscoveryQuestioningComplete,
  isLegacyBusinessComplete,
} from './businessDiscoveryUnderstanding'
import { pickNextDynamicBusinessQuestion } from './businessDiscoveryDynamicQuestions'
import {
  describeBusinessDiscoveryQuestionReason,
  pickBestBusinessDiscoveryQuestion,
} from './businessDiscoveryQuestionBank'

export {
  buildBusinessDiscoveryUnderstanding,
  computeBusinessDiscoveryConfidence,
  getBusinessDiscoveryAnswerIds,
  isBusinessDiscoveryAnswerKey,
  isBusinessDiscoveryQuestioningComplete,
  isLegacyBusinessComplete,
} from './businessDiscoveryUnderstanding'

export {
  buildBusinessDiscoveryIntelligence,
  buildBusinessDiscoveryFinalReport,
  formatBusinessDiscoveryWhyThisPath,
  mergeBusinessDiscoveryIntoOutput,
} from './businessDiscoveryIntelligence'

export function pickNextBusinessDiscoveryQuestion(state: CareerBrainState): BusinessDiscoveryQuestionPick {
  if (isLegacyBusinessComplete(state)) {
    const mapped = mapLegacyBusinessAnswers(state)
    const u = buildBusinessDiscoveryUnderstanding(mapped)
    if (isBusinessDiscoveryQuestioningComplete(mapped)) {
      return {
        question: null,
        reason: 'Legacy business answers mapped — sufficient for results',
        confidence: Math.max(u.confidence, 75),
        understanding: u,
      }
    }
    state = mapped
  }

  const understanding = buildBusinessDiscoveryUnderstanding(state)

  if (isBusinessDiscoveryQuestioningComplete(state)) {
    return {
      question: null,
      reason: `JAZ Business Discovery confidence ${understanding.confidence}% — sufficient evidence (${understanding.questionCount} answers)`,
      confidence: understanding.confidence,
      understanding,
    }
  }

  const dynamic = pickNextDynamicBusinessQuestion(understanding)
  if (dynamic) {
    return {
      question: dynamic.question,
      reason: dynamic.reason,
      confidence: understanding.confidence,
      understanding,
    }
  }

  const pick = pickBestBusinessDiscoveryQuestion(understanding)
  if (!pick) {
    return {
      question: null,
      reason: `JAZ Business Discovery confidence ${understanding.confidence}% — no high-value gaps`,
      confidence: understanding.confidence,
      understanding,
    }
  }

  return {
    question: pick.question,
    reason: describeBusinessDiscoveryQuestionReason(pick.def.id, understanding),
    confidence: understanding.confidence,
    understanding,
  }
}

export function mapLegacyBusinessAnswers(state: CareerBrainState): CareerBrainState {
  if (!isLegacyBusinessComplete(state)) return state
  const a = state.answers ?? {}
  const goal = String(a.cb_user_goal ?? '')

  const intent =
    goal === 'self_employed'
      ? 'already_running'
      : a.cb_business_running === 'idea'
        ? 'has_idea'
        : a.cb_business_running === 'yes'
          ? 'already_running'
          : 'has_idea'

  return {
    ...state,
    answers: {
      ...a,
      biz_intent: a.biz_intent ?? intent,
      biz_idea: a.biz_idea ?? a.cb_business_type ?? a.cb_self_service,
      biz_industry_field: a.biz_industry_field ?? a.cb_business_type,
      biz_experience_level: a.biz_experience_level ?? 'some',
      biz_time: a.biz_time ?? '10_20',
      biz_risk_tolerance: a.biz_risk_tolerance ?? 'medium',
    },
  }
}
