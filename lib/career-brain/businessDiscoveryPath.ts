/**
 * Business discovery pathway — JAZ dynamic questioning.
 */

import {
  isBusinessDiscoveryQuestioningComplete,
  mapLegacyBusinessAnswers,
  pickNextBusinessDiscoveryQuestion,
} from './businessDiscovery/businessDiscoveryEngine'
import { getRoutingGoal } from './userGoal'
import type { CareerBrainQuestion, CareerBrainState } from './types'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

const BUSINESS_GOALS = new Set(['start_business', 'self_employed', 'small_business'])

export function isBusinessDiscoveryPath(state: CareerBrainState): boolean {
  const goal = String(answers(state).cb_user_goal ?? '')
  const routing = getRoutingGoal(state)
  return BUSINESS_GOALS.has(goal) || routing === 'self_employed' || routing === 'small_business'
}

export function isBusinessDiscoveryPathComplete(state: CareerBrainState): boolean {
  if (!isBusinessDiscoveryPath(state)) return false
  const mapped = mapLegacyBusinessAnswers(state)
  return isBusinessDiscoveryQuestioningComplete(mapped)
}

export function pickBusinessDiscoveryPathQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!isBusinessDiscoveryPath(state)) {
    return { question: null, reason: 'Not business discovery path' }
  }
  const mapped = mapLegacyBusinessAnswers(state)
  const pick = pickNextBusinessDiscoveryQuestion(mapped)
  return { question: pick.question, reason: pick.reason }
}

export function prepareBusinessDiscoveryStateForResults(state: CareerBrainState): CareerBrainState {
  if (!isBusinessDiscoveryPath(state)) return state
  return mapLegacyBusinessAnswers(state)
}

export function buildBusinessDiscoveryPathReasoning(state: CareerBrainState): string[] {
  if (!isBusinessDiscoveryPathComplete(state)) return []
  return ['Business discovery complete — JAZ will recommend evidence-based models, not generic ideas.']
}
