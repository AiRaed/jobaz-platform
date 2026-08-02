/**
 * New to the UK — context layer only (not a separate career tree).
 * Collects migration context, sets flags, routes into existing goals.
 */

import type { CareerBrainQuestion, CareerBrainState } from './types'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const NEW_TO_UK_QUESTIONS = {
  priorExperience: q(
    'cb_new_to_uk_prior_exp',
    'Are you arriving with previous work experience or qualifications?',
    [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ]
  ),
  experienceAbroad: q(
    'cb_new_to_uk_experience_abroad',
    'Was most of your experience gained outside the UK?',
    [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ]
  ),
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

/** User selected the visible "New to the UK" entry (may still be in context questions). */
export function isNewToUkGoalSelected(state: CareerBrainState): boolean {
  return String(answers(state).cb_user_goal ?? '') === 'new_to_uk'
}

/** Context flag — set after routing questions complete (or legacy sessions). */
export function isNewToUkContext(state: CareerBrainState): boolean {
  return answers(state).cb_new_to_uk === 'yes' || isNewToUkGoalSelected(state)
}

export function isNewToUkContextComplete(state: CareerBrainState): boolean {
  if (!isNewToUkGoalSelected(state) && answers(state).cb_new_to_uk !== 'yes') return true
  if (!hasAnswer(state, 'cb_new_to_uk_prior_exp')) return false
  if (String(answers(state).cb_new_to_uk_prior_exp) === 'yes') {
    return hasAnswer(state, 'cb_new_to_uk_experience_abroad')
  }
  return true
}

export function pickNewToUkContextQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_new_to_uk_prior_exp')) {
    return {
      question: NEW_TO_UK_QUESTIONS.priorExperience,
      reason: 'New to UK — prior experience or qualifications',
    }
  }
  if (String(answers(state).cb_new_to_uk_prior_exp) === 'yes' && !hasAnswer(state, 'cb_new_to_uk_experience_abroad')) {
    return {
      question: NEW_TO_UK_QUESTIONS.experienceAbroad,
      reason: 'New to UK — where experience was gained',
    }
  }
  return { question: null, reason: 'New to UK context complete' }
}

/** Routed goal after context (first job or have work experience trees). */
export type NewToUkRoutedGoal = 'first_job' | 'have_experience'

export function getNewToUkRoutedGoal(state: CareerBrainState): NewToUkRoutedGoal | null {
  if (!isNewToUkContextComplete(state)) return null
  if (!isNewToUkContext(state) && !isNewToUkGoalSelected(state)) return null
  const prior = String(answers(state).cb_new_to_uk_prior_exp ?? '')
  if (prior === 'no') return 'first_job'
  if (prior === 'yes') return 'have_experience'
  return null
}

export function hasInternationalExperienceFlag(state: CareerBrainState): boolean {
  return answers(state).cb_international_experience === 'yes'
}

/** Apply flags + pre-fill answers for existing trees (call before routing). */
export function syncNewToUkContext(state: CareerBrainState): CareerBrainState {
  if (!isNewToUkGoalSelected(state) && answers(state).cb_new_to_uk !== 'yes') {
    return state
  }
  if (!isNewToUkContextComplete(state)) {
    return { ...state, answers: { ...state.answers, cb_new_to_uk: 'yes' } }
  }

  const prior = String(answers(state).cb_new_to_uk_prior_exp ?? '')
  const abroad = String(answers(state).cb_new_to_uk_experience_abroad ?? '')
  const international = prior === 'yes' && abroad === 'yes'
  const routed: NewToUkRoutedGoal = prior === 'no' ? 'first_job' : 'have_experience'

  const nextAnswers: Record<string, unknown> = {
    ...state.answers,
    cb_new_to_uk: 'yes',
    cb_international_experience: international ? 'yes' : 'no',
    cb_routed_user_goal: routed,
  }

  if (routed === 'first_job') {
    nextAnswers.cb_experience_level = 'no_experience'
  } else {
    nextAnswers.cb_experience_level = 'have_experience'
    if (prior === 'yes') {
      nextAnswers.cb_experience_country = abroad === 'yes' ? 'mostly_international' : 'mostly_uk'
    }
  }

  return { ...state, answers: nextAnswers }
}

export function applyNewToUkContextToProfile<T extends { constraints: string[]; experienceCountry?: string | null }>(
  profile: T,
  state: CareerBrainState
): T {
  if (!isNewToUkContext(state) && answers(state).cb_new_to_uk !== 'yes') return profile
  let next = {
    ...profile,
    constraints: [...new Set([...profile.constraints, 'new-to-uk'])],
  }
  if (hasInternationalExperienceFlag(state)) {
    next = {
      ...next,
      experienceCountry: next.experienceCountry ?? 'non-UK',
      constraints: [
        ...new Set([...next.constraints, 'international-experience', 'uk-transition']),
      ],
    }
  } else {
    next = {
      ...next,
      constraints: [...new Set([...next.constraints, 'uk-newcomer'])],
    }
  }
  return next
}
