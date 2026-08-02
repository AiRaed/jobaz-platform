/**
 * JAZ Side Income Intelligence Engine — dynamic questioning entry point.
 */

import type { CareerBrainState } from '../types'
import type { SideIncomeQuestionPick } from './sideIncomeTypes'
import {
  buildSideIncomeUnderstanding,
  isLegacySideIncomeComplete,
  isSideIncomeQuestioningComplete,
} from './sideIncomeUnderstanding'
import {
  describeSideIncomeQuestionReason,
  pickBestSideIncomeQuestion,
} from './sideIncomeQuestionBank'

export {
  buildSideIncomeUnderstanding,
  computeSideIncomeConfidence,
  getSideIncomeAnswerIds,
  isLegacySideIncomeComplete,
  isSideIncomeAnswerKey,
  isSideIncomeQuestioningComplete,
} from './sideIncomeUnderstanding'

export { buildSideIncomeIntelligence, buildSideIncomeFinalReport, formatSideIncomeWhyThisPath } from './sideIncomeIntelligence'

export function pickNextSideIncomeQuestion(state: CareerBrainState): SideIncomeQuestionPick {
  if (isLegacySideIncomeComplete(state)) {
    const u = buildSideIncomeUnderstanding(state)
    return {
      question: null,
      reason: 'Legacy side income answers mapped — sufficient for results',
      confidence: Math.max(u.confidence, 75),
      understanding: u,
    }
  }

  const understanding = buildSideIncomeUnderstanding(state)

  if (isSideIncomeQuestioningComplete(state)) {
    return {
      question: null,
      reason: `JAZ Side Income confidence ${understanding.confidence}% — sufficient evidence (${understanding.questionCount} answers)`,
      confidence: understanding.confidence,
      understanding,
    }
  }

  const pick = pickBestSideIncomeQuestion(understanding)
  if (!pick) {
    return {
      question: null,
      reason: `JAZ Side Income confidence ${understanding.confidence}% — no high-value gaps remaining`,
      confidence: understanding.confidence,
      understanding,
    }
  }

  return {
    question: pick.question,
    reason: describeSideIncomeQuestionReason(pick.def.id, understanding),
    confidence: understanding.confidence,
    understanding,
  }
}

/** Map legacy cb_side_* answers into si_* for backward compatibility. */
export function mapLegacySideIncomeAnswers(state: CareerBrainState): CareerBrainState {
  if (!isLegacySideIncomeComplete(state)) return state
  const a = state.answers ?? {}
  const profile = String(a.cb_side_job_profile ?? '')
  const employmentMap: Record<string, string> = {
    employed_full: 'employed_full',
    employed_part: 'employed_part',
    student: 'student',
    unemployed: 'unemployed',
  }

  return {
    ...state,
    answers: {
      ...a,
      si_employment: a.si_employment ?? employmentMap[profile] ?? profile,
      si_hours_week: a.si_hours_week ?? a.cb_side_hours_week,
      si_schedule: a.si_schedule ?? a.cb_side_schedule,
      si_income_timeline: a.si_income_timeline ?? (a.cb_side_income_intent === 'income_only' ? '2_4_weeks' : '1_3_months'),
    },
  }
}
