/**
 * Side Income pathway — JAZ dynamic questioning (not a fixed questionnaire).
 */

import {
  isSideIncomeQuestioningComplete,
  mapLegacySideIncomeAnswers,
  pickNextSideIncomeQuestion,
} from './sideIncome/sideIncomeEngine'
import type { CareerBrainQuestion, CareerBrainState } from './types'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

export function isSideIncomePath(state: CareerBrainState): boolean {
  return String(answers(state).cb_user_goal ?? '') === 'side_job'
}

export function isSideIncomePathComplete(state: CareerBrainState): boolean {
  if (!isSideIncomePath(state)) return false
  const mapped = mapLegacySideIncomeAnswers(state)
  return isSideIncomeQuestioningComplete(mapped)
}

export function pickSideIncomePathQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!isSideIncomePath(state)) {
    return { question: null, reason: 'Not side income path' }
  }
  const mapped = mapLegacySideIncomeAnswers(state)
  const pick = pickNextSideIncomeQuestion(mapped)
  return { question: pick.question, reason: pick.reason }
}

export function prepareSideIncomeStateForResults(state: CareerBrainState): CareerBrainState {
  if (!isSideIncomePath(state)) return state
  return mapLegacySideIncomeAnswers(state)
}

export function buildSideIncomePathReasoning(state: CareerBrainState): string[] {
  if (!isSideIncomePathComplete(state)) return []
  return ['Side income path complete — JAZ Side Income Intelligence will generate evidence-based options.']
}
