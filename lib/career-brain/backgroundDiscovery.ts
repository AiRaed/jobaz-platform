/**
 * Phase 1 — background discovery (education, experience, field intent).
 */

import type { CareerBrainQuestion, CareerBrainState } from './types'

export const BACKGROUND_QUESTION_IDS = [
  'cb_edu',
  'cb_study_field',
  'cb_exp',
  'cb_work_experience',
  'cb_field_intent',
] as const

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false,
  maxSelect?: number
): CareerBrainQuestion {
  return {
    id,
    text,
    type: multi ? 'multi' : 'single',
    options,
    max_select: maxSelect,
    allow_free_text: options.length === 0,
  }
}

function qFreeText(id: string, text: string, placeholder?: string): CareerBrainQuestion {
  return {
    id,
    text: placeholder ? `${text}\n\n(e.g. ${placeholder})` : text,
    type: 'single',
    options: [],
    allow_free_text: true,
  }
}

export const BACKGROUND_QUESTIONS = {
  edu: q('cb_edu', 'Do you have any formal education or qualifications?', [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]),
  studyField: qFreeText(
    'cb_study_field',
    'What did you study or qualify in?',
    'animation, graphic design, accounting, nursing, computer science'
  ),
  exp: q('cb_exp', 'Do you have any work experience?', [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]),
  workExperience: qFreeText(
    'cb_work_experience',
    'What work experience do you have?',
    'junior animator, taxi driver, shop assistant, nurse, software developer'
  ),
  fieldIntent: q(
    'cb_field_intent',
    'Do you want to work in the same field as your education or experience?',
    [
      { value: 'same_field', label: 'Yes, same field' },
      { value: 'related_field', label: 'Related field' },
      { value: 'change_field', label: 'No, I want to change' },
      { value: 'unsure', label: 'Not sure' },
    ]
  ),
}

export function hasEducation(state: CareerBrainState): boolean {
  const edu = state.answers?.cb_edu ?? state.classification?.edu
  return edu === 'yes'
}

export function hasExperience(state: CareerBrainState): boolean {
  const exp = state.answers?.cb_exp ?? state.classification?.exp
  return exp === 'yes'
}

export function isBackgroundDiscoveryComplete(state: CareerBrainState): boolean {
  const answers = state.answers ?? {}

  if (answers.cb_edu === undefined && answers.edu === undefined) return false
  const edu = String(answers.cb_edu ?? answers.edu ?? '')
  if (!edu) return false

  if (edu === 'yes') {
    const study = String(answers.cb_study_field ?? '').trim()
    if (!study) return false
  }

  if (answers.cb_exp === undefined && answers.exp === undefined) return false
  const exp = String(answers.cb_exp ?? answers.exp ?? '')
  if (!exp) return false

  if (exp === 'yes') {
    const work = String(answers.cb_work_experience ?? '').trim()
    if (!work) return false
  }

  if (edu === 'no' && exp === 'no') {
    return true
  }

  if (!answers.cb_field_intent) return false

  return true
}

export function pickBackgroundQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  const answers = state.answers ?? {}

  if (answers.cb_edu === undefined && answers.edu === undefined) {
    return { question: BACKGROUND_QUESTIONS.edu, reason: 'Phase 1: education gate' }
  }

  const edu = String(answers.cb_edu ?? answers.edu)
  if (edu === 'yes' && !String(answers.cb_study_field ?? '').trim()) {
    return { question: BACKGROUND_QUESTIONS.studyField, reason: 'Phase 1: study field (free text)' }
  }

  if (answers.cb_exp === undefined && answers.exp === undefined) {
    return { question: BACKGROUND_QUESTIONS.exp, reason: 'Phase 1: experience gate' }
  }

  const exp = String(answers.cb_exp ?? answers.exp)
  if (exp === 'yes' && !String(answers.cb_work_experience ?? '').trim()) {
    return {
      question: BACKGROUND_QUESTIONS.workExperience,
      reason: 'Phase 1: work experience (free text)',
    }
  }

  if (edu === 'no' && exp === 'no') {
    return {
      question: null,
      reason: 'Phase 1 complete — no background, skipped same-field question',
    }
  }

  if (!answers.cb_field_intent) {
    return { question: BACKGROUND_QUESTIONS.fieldIntent, reason: 'Phase 1: field intent' }
  }

  return { question: null, reason: 'Phase 1 complete' }
}

/** Sync legacy classification object from Career Brain background answers. */
export function syncClassificationFromBackground(state: CareerBrainState): CareerBrainState {
  const answers = state.answers ?? {}
  const edu = answers.cb_edu ?? answers.edu
  const exp = answers.cb_exp ?? answers.exp
  if (edu === undefined && exp === undefined) return state

  return {
    ...state,
    classification: {
      ...(state.classification ?? {}),
      edu: edu ?? state.classification?.edu,
      exp: exp ?? state.classification?.exp,
    },
    classification_done: isBackgroundDiscoveryComplete(state),
  }
}
