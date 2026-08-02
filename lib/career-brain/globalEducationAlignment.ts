/**
 * Global education alignment — career changer, new to UK, and shared intent mapping.
 */

import {
  getEntrySituation,
  isGraduatePath,
  isStudentPath,
} from './entryClassification'
import {
  applyFieldAlignmentToProfile,
  FIELD_ALIGNMENT_QUESTION,
  hasFieldAlignmentAnswer,
} from './fieldAlignment'
import {
  applyFirstJobEducationToProfile,
  getFirstJobCareerPreference,
  isFirstJobEducationComplete,
  isFirstJobPath,
  isPostSecondaryEducation,
  pickFirstJobEducationQuestion,
  studyFieldBridgeText,
} from './firstJobEducationPath'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile, EducationLevel } from './types'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const GLOBAL_EDUCATION_QUESTIONS = {
  level: q('cb_global_education_level', 'What is your highest level of education?', [
    { value: 'gcse_a_levels', label: 'GCSE / A Levels' },
    { value: 'college_diploma', label: 'College / Diploma' },
    { value: 'bachelors', label: "Bachelor's Degree" },
    { value: 'masters', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' },
    { value: 'other', label: 'Other' },
  ]),
  fieldAlignment: FIELD_ALIGNMENT_QUESTION,
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

export function needsGlobalEducationBlock(state: CareerBrainState): boolean {
  if (isStudentPath(state) || isGraduatePath(state) || isFirstJobPath(state)) return false
  const situation = getEntrySituation(state)
  return situation === 'career_change' || situation === 'new_to_uk'
}

function isDegreeLevel(level: string): boolean {
  return ['bachelors', 'masters', 'phd', 'diploma_college', 'college_diploma'].includes(level)
}

export function isGlobalEducationComplete(state: CareerBrainState): boolean {
  if (isFirstJobPath(state)) return isFirstJobEducationComplete(state)
  if (!needsGlobalEducationBlock(state)) return true
  if (!hasAnswer(state, 'cb_global_education_level')) return false
  const level = String(answers(state).cb_global_education_level)
  if (isDegreeLevel(level) && !hasFieldAlignmentAnswer(state)) return false
  return true
}

export function pickGlobalEducationQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (isFirstJobPath(state)) return pickFirstJobEducationQuestion(state)
  if (!needsGlobalEducationBlock(state)) {
    return { question: null, reason: 'Global education not required for this path' }
  }
  if (!hasAnswer(state, 'cb_global_education_level')) {
    return {
      question: GLOBAL_EDUCATION_QUESTIONS.level,
      reason: 'Global education — highest qualification level',
    }
  }
  const level = String(answers(state).cb_global_education_level)
  if (isDegreeLevel(level) && !hasFieldAlignmentAnswer(state)) {
    return {
      question: GLOBAL_EDUCATION_QUESTIONS.fieldAlignment,
      reason: 'Global education — field alignment',
    }
  }
  return { question: null, reason: 'Global education complete' }
}

function mapGlobalLevel(level: string): EducationLevel {
  if (level === 'gcse_a_levels' || level === 'other') return 'school'
  if (level === 'college_diploma') return 'college'
  if (level === 'bachelors') return 'degree'
  if (level === 'masters' || level === 'phd') return 'postgrad'
  return 'college'
}

export function applyGlobalEducationToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  if (isFirstJobPath(state)) return applyFirstJobEducationToProfile(profile, state)

  if (!needsGlobalEducationBlock(state)) return profile

  const level = String(answers(state).cb_global_education_level ?? '')
  if (!level) return profile

  let next: CareerProfile = {
    ...profile,
    educationLevel: mapGlobalLevel(level),
  }

  return applyFieldAlignmentToProfile(next, state)
}

/** Re-export first-job helpers used elsewhere */
export {
  applyFirstJobEducationToProfile,
  buildEducationAlignmentReasoning,
  getFirstJobCareerPreference,
  isFirstJobPath,
  isPostSecondaryEducation,
  studyFieldBridgeText,
} from './firstJobEducationPath'
