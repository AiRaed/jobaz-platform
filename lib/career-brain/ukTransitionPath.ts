/**
 * New to the UK pathway — JAZ UK Transition Advisor (dynamic questioning).
 */

import {
  isUkTransitionQuestioningComplete,
  mapLegacyNewToUkAnswers,
  pickNextUkTransitionEngineQuestion,
} from './ukTransition/ukTransitionEngine'
import { isNewToUkGoalSelected } from './userGoal'
import type { CareerBrainQuestion, CareerBrainState } from './types'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

export function isUkTransitionPath(state: CareerBrainState): boolean {
  return isNewToUkGoalSelected(state)
}

export function isUkTransitionPathComplete(state: CareerBrainState): boolean {
  if (!isUkTransitionPath(state)) return false
  const mapped = mapLegacyNewToUkAnswers(state)
  return isUkTransitionQuestioningComplete(mapped)
}

export function pickUkTransitionPathQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!isUkTransitionPath(state)) {
    return { question: null, reason: 'Not UK transition path' }
  }
  const pick = pickNextUkTransitionEngineQuestion(state)
  return { question: pick.question, reason: pick.reason }
}

export function prepareUkTransitionStateForResults(state: CareerBrainState): CareerBrainState {
  if (!isUkTransitionPath(state)) return state
  return mapLegacyNewToUkAnswers(state)
}

export function buildUkTransitionPathReasoning(state: CareerBrainState): string[] {
  if (!isUkTransitionPathComplete(state)) return []
  return ['New to the UK path complete — practical career options, courses, and next steps tailored to your answers.']
}

export function syncUkTransitionProfileAnswers(state: CareerBrainState): CareerBrainState {
  if (!isUkTransitionPath(state)) return state
  const mapped = mapLegacyNewToUkAnswers(state)
  const a = mapped.answers ?? {}
  const profileType = a.ntuk_profile_type ? String(a.ntuk_profile_type) : null
  const field = a.ntuk_qualification_field ?? a.ntuk_experience_area
  const prof = field ? String(field) : null
  return {
    ...mapped,
    answers: {
      ...a,
      cb_new_to_uk: 'yes',
      cb_entry_situation: 'new_to_uk',
      ...(prof ? { cb_professional_field: a.cb_professional_field ?? prof } : {}),
      ...(profileType === 'work_experience' || profileType === 'degree'
        ? { cb_international_experience: 'yes' }
        : {}),
    },
  }
}
