/**
 * First job path — education & career alignment before recommendations.
 */

import {
  applyFieldAlignmentToProfile,
  buildFieldAlignmentReasoning,
  FIELD_ALIGNMENT_QUESTION,
  getFieldAlignment,
  hasFieldAlignmentAnswer,
  isFieldAlignmentBoth,
  isFieldAlignmentNo,
  isFieldAlignmentYes,
  type FieldAlignment,
} from './fieldAlignment'
import {
  isFieldSpecialisationComplete,
  pickFieldSpecialisationQuestion,
  resolveEffectiveStudyField,
  specialisationStudyLabel,
} from './fieldSpecialisation'
import { getEntrySituation } from './entryClassification'
import { getRoutingGoal } from './userGoal'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile, EducationLevel } from './types'

export type FirstJobEducationLevel =
  | 'no_formal'
  | 'gcse_a_levels'
  | 'vocational'
  | 'diploma_college'
  | 'bachelors'
  | 'masters'
  | 'phd'

/** @deprecated use FieldAlignment from fieldAlignment.ts */
export type FirstJobCareerPreference = 'yes_only' | 'prefer_field' | 'open_any' | 'no_longer'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const FIRST_JOB_EDUCATION_QUESTIONS = {
  educationLevel: q('cb_first_job_education_level', 'What is your highest level of education?', [
    { value: 'no_formal', label: 'No formal qualifications' },
    { value: 'gcse_a_levels', label: 'GCSE / A Levels' },
    { value: 'vocational', label: 'Vocational qualification' },
    { value: 'diploma_college', label: 'Diploma / College qualification' },
    { value: 'bachelors', label: "Bachelor's degree" },
    { value: 'masters', label: "Master's degree" },
    { value: 'phd', label: 'PhD / Doctorate' },
  ]),
  studyField: q('cb_first_job_study_field', 'What did you study?', [
    { value: 'business_management', label: 'Business & Management' },
    { value: 'it_computing', label: 'IT / Computing' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'science', label: 'Science' },
    { value: 'arts_design', label: 'Arts & Design' },
    { value: 'media_communications', label: 'Media & Communications' },
    { value: 'law', label: 'Law' },
    { value: 'construction_trades', label: 'Construction & Trades' },
    { value: 'other', label: 'Other' },
  ]),
  fieldAlignment: FIELD_ALIGNMENT_QUESTION,
}

const STUDY_FIELD_BRIDGE_TEXT: Record<string, string> = {
  business_management: 'business management',
  it_computing: 'computer science',
  engineering: 'engineering',
  healthcare: 'healthcare',
  education: 'education',
  science: 'science',
  arts_design: 'animation design',
  media_communications: 'media communications',
  law: 'law',
  construction_trades: 'construction',
  other: 'general studies',
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

export function isFirstJobPath(state: CareerBrainState): boolean {
  if (getRoutingGoal(state) === 'first_job') return true
  const situation = getEntrySituation(state)
  return situation === 'first_job' || situation === 'graduate_little_exp'
}

export function getFirstJobEducationLevel(state: CareerBrainState): FirstJobEducationLevel | null {
  const v = answers(state).cb_first_job_education_level
  return v ? (String(v) as FirstJobEducationLevel) : null
}

/** @deprecated use getFieldAlignment — maps to legacy preference ids for older checks */
export function getFirstJobCareerPreference(state: CareerBrainState): FirstJobCareerPreference | null {
  const a = getFieldAlignment(state)
  if (a === 'yes') return 'yes_only'
  if (a === 'no') return 'open_any'
  if (a === 'both') return 'prefer_field'
  return null
}

export function getFirstJobFieldAlignment(state: CareerBrainState): FieldAlignment | null {
  return getFieldAlignment(state)
}

export function isPostSecondaryEducation(level: FirstJobEducationLevel | null): boolean {
  if (!level) return false
  return ['diploma_college', 'bachelors', 'masters', 'phd'].includes(level)
}

export function isDegreeOrAbove(level: FirstJobEducationLevel | null): boolean {
  if (!level) return false
  return ['bachelors', 'masters', 'phd'].includes(level)
}

/** Diploma and above — used for profile/education mapping only, not English inference. */
export function isHigherFormalEducation(level: FirstJobEducationLevel | null): boolean {
  if (!level) return false
  return ['diploma_college', 'bachelors', 'masters', 'phd'].includes(level)
}

/** English confidence is always collected separately — never inferred from education. */
export function needsFirstJobEnglishQuestion(state: CareerBrainState): boolean {
  if (!isFirstJobPath(state)) return false
  return isFirstJobEducationComplete(state)
}

/** @deprecated Education does not determine English level — use cb_english only. */
export function getAssumedFirstJobEnglishLevel(_state: CareerBrainState): null {
  return null
}

export function hasFirstJobEnglishResolved(state: CareerBrainState): boolean {
  return hasAnswer(state, 'cb_english')
}

/** Explicit English confidence answer only. */
export function resolveFirstJobEnglishLevel(state: CareerBrainState): string | null {
  if (!hasAnswer(state, 'cb_english')) return null
  return String(answers(state).cb_english)
}

export function studyFieldBridgeText(value: string): string {
  return STUDY_FIELD_BRIDGE_TEXT[value] ?? value.replace(/_/g, ' ')
}

export function studyFieldLabel(value: string): string {
  const opt = FIRST_JOB_EDUCATION_QUESTIONS.studyField.options.find((o) => o.value === value)
  return opt?.label ?? value.replace(/_/g, ' ')
}

function mapEducationLevel(level: FirstJobEducationLevel): EducationLevel {
  switch (level) {
    case 'no_formal':
      return 'none'
    case 'gcse_a_levels':
      return 'school'
    case 'vocational':
    case 'diploma_college':
      return 'college'
    case 'bachelors':
      return 'degree'
    case 'masters':
    case 'phd':
      return 'postgrad'
    default:
      return 'none'
  }
}

export function isFirstJobEducationComplete(state: CareerBrainState): boolean {
  if (!isFirstJobPath(state)) return true
  if (!hasAnswer(state, 'cb_first_job_education_level')) return false
  const level = getFirstJobEducationLevel(state)
  if (!isPostSecondaryEducation(level)) return true
  if (!hasAnswer(state, 'cb_first_job_study_field')) return false
  if (!isFieldSpecialisationComplete(state)) return false
  if (!hasFieldAlignmentAnswer(state)) return false
  return true
}

export function pickFirstJobEducationQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!isFirstJobPath(state)) {
    return { question: null, reason: 'Not first-job path' }
  }
  if (!hasAnswer(state, 'cb_first_job_education_level')) {
    return {
      question: FIRST_JOB_EDUCATION_QUESTIONS.educationLevel,
      reason: 'First job — education level before career alignment',
    }
  }
  const level = getFirstJobEducationLevel(state)
  if (isPostSecondaryEducation(level) && !hasAnswer(state, 'cb_first_job_study_field')) {
    return {
      question: FIRST_JOB_EDUCATION_QUESTIONS.studyField,
      reason: 'First job — field of study for post-secondary qualification',
    }
  }
  const specQ = pickFieldSpecialisationQuestion(state)
  if (specQ.question) {
    return specQ
  }
  if (isPostSecondaryEducation(level) && !hasFieldAlignmentAnswer(state)) {
    return {
      question: FIRST_JOB_EDUCATION_QUESTIONS.fieldAlignment,
      reason: 'First job — work in this field?',
    }
  }
  return { question: null, reason: 'First job education block complete' }
}

export function applyFirstJobEducationToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  if (!isFirstJobPath(state)) return profile

  const level = getFirstJobEducationLevel(state)
  if (!level) return profile

  let next: CareerProfile = {
    ...profile,
    educationLevel: mapEducationLevel(level),
    yearsOfExperience: 0,
    workExperienceField: null,
    constraints: [...new Set([...profile.constraints, 'first-job-path', 'first-job-no-prior-exp'])],
  }

  const studyValue = String(answers(state).cb_first_job_study_field ?? '')
  if (studyValue) {
    next.studyField = resolveEffectiveStudyField(state, studyFieldBridgeText(studyValue))
  }

  const eng = resolveFirstJobEnglishLevel(state)
  if (eng) {
    next.englishLevel = eng === 'intermediate' ? 'intermediate' : eng === 'fluent' ? 'fluent' : eng === 'basic' ? 'basic' : 'good'
  }

  return applyFieldAlignmentToProfile(next, state)
}

export function buildEducationAlignmentReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state || !isFirstJobPath(state)) return []

  const level = getFirstJobEducationLevel(state)
  if (!level) return []

  const study = String(state.answers?.cb_first_job_study_field ?? '')
  const lines: string[] = [
    'Education & career alignment — qualification informs the pathway without overriding urgent income needs.',
  ]

  if (isPostSecondaryEducation(level) && study) {
    const specLabel = specialisationStudyLabel(state)
    const fieldLine = specLabel
      ? `${studyFieldLabel(study)} — ${specLabel}`
      : studyFieldLabel(study)
    lines.push(`Qualification: ${fieldLine} (${level.replace(/_/g, ' ')}).`)
  } else {
    lines.push(`Education level: ${level.replace(/_/g, ' ')}.`)
  }

  return [...lines, ...buildFieldAlignmentReasoning(profile, state)]
}

export { isFieldAlignmentYes, isFieldAlignmentNo, isFieldAlignmentBoth }
