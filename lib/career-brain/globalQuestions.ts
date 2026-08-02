/**
 * Reusable global questions — asked only when relevant to the current route.
 */

import type { CareerBrainQuestion, CareerBrainState } from './types'
import { getUserGoal, resolveLegacySituation, isStartNewCareerGoal } from './userGoal'
import { isUnemployedPath } from './unemployedPath'
import {
  FIELD_INCOME_STRATEGY_QUESTION,
  needsFieldIncomeStrategyQuestion,
  isFieldOnlyLock,
} from './careerTrackLock'
import {
  getExperienceTier,
  isGraduatePath,
  isStudentPath,
  ENTRY_QUESTIONS,
} from './entryClassification'
import { isFieldAlignmentBoth, isFieldAlignmentYes } from './fieldAlignment'
import {
  getFirstJobEducationLevel,
  isDegreeOrAbove,
  isPostSecondaryEducation,
} from './firstJobEducationPath'

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

/** User is building a career in their study field — skip generic physical/customer prefs. */
export function isFieldCareerMode(state: CareerBrainState): boolean {
  if (isFieldOnlyLock(state)) return true
  if (isFieldAlignmentYes(state) || isFieldAlignmentBoth(state)) return true
  return false
}

export function needsWorkPreferenceQuestion(state: CareerBrainState): boolean {
  if (isFieldCareerMode(state)) return false
  const goal = getUserGoal(state)
  if (goal === 'self_employed' || goal === 'small_business' || goal === 'start_business') return false
  if (goal === 'grow_career') return false
  return true
}

export function needsPhysicalQuestion(state: CareerBrainState): boolean {
  if (isFieldCareerMode(state)) return false
  const pref = String(answers(state).cb_entry_work_preference ?? '')
  if (pref === 'office_computer' || pref === 'creative_work') return false
  if (pref === 'driving_delivery') return false
  const goal = getUserGoal(state)
  if (goal === 'grow_career' || isStartNewCareerGoal(goal)) {
    const dir = String(answers(state).cb_change_direction ?? '')
    if (/office|it|digital|admin/.test(dir)) return false
  }
  return true
}

export function needsCustomerQuestion(state: CareerBrainState): boolean {
  if (isFieldCareerMode(state)) return false
  const pref = String(answers(state).cb_entry_work_preference ?? '')
  if (pref === 'office_computer' || pref === 'physical_practical' || pref === 'driving_delivery') {
    return false
  }
  if (answers(state).cb_customer_comfort === 'no') return false
  return true
}

export function needsDrivingQuestion(state: CareerBrainState): boolean {
  const pref = String(answers(state).cb_entry_work_preference ?? '')
  const goal = getUserGoal(state)
  if (pref === 'office_computer' || pref === 'creative_work' || pref === 'care_support') {
    return false
  }
  if (isFieldCareerMode(state) && pref !== 'driving_delivery' && pref !== 'quick_income') {
    return false
  }
  if (goal === 'urgent_work' || goal === 'side_job') return true
  if (pref === 'driving_delivery' || pref === 'quick_income' || pref === 'physical_practical') {
    return true
  }
  if (answers(state).cb_physical_ability === 'non_physical') return false
  return goal === 'first_job' || goal === 'exploring'
}

export function needsCarQuestion(state: CareerBrainState): boolean {
  return needsDrivingQuestion(state) && answers(state).cb_uk_driving_licence === 'yes'
}

export function needsShiftQuestion(state: CareerBrainState): boolean {
  const goal = getUserGoal(state)
  return goal === 'urgent_work' || goal === 'side_job' || isStudentPath(state)
}

const GLOBAL_QUESTION_IDS = [
  'cb_english',
  'cb_entry_work_preference',
  'cb_uk_driving_licence',
  'cb_has_car',
  'cb_physical_ability',
  'cb_customer_comfort',
  'cb_shift_flexibility',
] as const

function globalQuestionMap(): Record<string, CareerBrainQuestion> {
  return {
    cb_english: ENTRY_QUESTIONS.english,
    cb_uk_driving_licence: ENTRY_QUESTIONS.ukDrivingLicence,
    cb_has_car: ENTRY_QUESTIONS.hasCar,
    cb_physical_ability: ENTRY_QUESTIONS.physical,
    cb_customer_comfort: ENTRY_QUESTIONS.customer,
    cb_shift_flexibility: ENTRY_QUESTIONS.shifts,
    cb_entry_work_preference: ENTRY_QUESTIONS.workPreference,
  }
}

/** Field lock question first, then conditional employability globals. */
export function nextFieldAwareGlobalQuestion(
  state: CareerBrainState
): { id: string; question: CareerBrainQuestion } | null {
  if (needsFieldIncomeStrategyQuestion(state)) {
    return { id: 'cb_field_income_strategy', question: FIELD_INCOME_STRATEGY_QUESTION }
  }
  return nextGlobalEmployabilityQuestion(state)
}

/** Ordered employability globals for routes that need them. */
export function nextGlobalEmployabilityQuestion(
  state: CareerBrainState
): { id: string; question: CareerBrainQuestion } | null {
  if (isUnemployedPath(state)) return null
  const order = GLOBAL_QUESTION_IDS

  for (const id of order) {
    if (hasAnswer(state, id)) continue
    if (id === 'cb_entry_work_preference' && !needsWorkPreferenceQuestion(state)) continue
    if (id === 'cb_uk_driving_licence' && !needsDrivingQuestion(state)) continue
    if (id === 'cb_has_car' && !needsCarQuestion(state)) continue
    if (id === 'cb_physical_ability' && !needsPhysicalQuestion(state)) continue
    if (id === 'cb_customer_comfort' && !needsCustomerQuestion(state)) continue
    if (id === 'cb_shift_flexibility' && !needsShiftQuestion(state)) continue
    const q = globalQuestionMap()[id]
    if (q) return { id, question: q }
  }
  return null
}

export function isGlobalEmployabilityComplete(state: CareerBrainState): boolean {
  if (needsFieldIncomeStrategyQuestion(state)) return false
  return nextGlobalEmployabilityQuestion(state) === null
}

export function shouldUseGraduateBranch(state: CareerBrainState): boolean {
  const goal = getUserGoal(state)
  if (goal !== 'first_job' && resolveLegacySituation(state) !== 'graduate_little_exp') return false
  const tier = getExperienceTier(state)
  const edu = getFirstJobEducationLevel(state) ?? String(answers(state).cb_graduate_qual_region ?? '')
  if (tier !== 'no_experience') return false
  if (isDegreeOrAbove(getFirstJobEducationLevel(state))) return true
  return isGraduatePath(state)
}

export function isFirstJobRoute(state: CareerBrainState): boolean {
  return getUserGoal(state) === 'first_job' || resolveLegacySituation(state) === 'first_job'
}
