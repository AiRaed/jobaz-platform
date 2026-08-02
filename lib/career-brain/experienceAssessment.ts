/**
 * Universal experience assessment — No Experience vs Have Experience with explicit follow-ups.
 */

import type { CareerBrainQuestion, CareerBrainState } from './types'

export type NormalizedExperienceLevel = 'no_experience' | 'have_experience'

/** @deprecated internal alias — use NormalizedExperienceLevel */
export type ExperienceTier = NormalizedExperienceLevel

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
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

export const EXPERIENCE_LEVEL_QUESTION = q('cb_experience_level', 'Do you have work experience?', [
  { value: 'no_experience', label: 'No experience' },
  { value: 'have_experience', label: 'Have experience' },
])

export const HAVE_EXPERIENCE_QUESTIONS = {
  fieldRelation: q(
    'cb_experience_field_relation',
    'Is your work experience related to your field of study or qualification?',
    [
      { value: 'study_related', label: 'Yes — related to my studies' },
      { value: 'different_field', label: 'No — in a different field' },
      { value: 'both_fields', label: 'I have experience in both study and other fields' },
    ]
  ),
  experienceCountry: q('cb_experience_country', 'Was your experience in the UK or outside the UK?', [
    { value: 'mostly_uk', label: 'Mostly UK experience' },
    { value: 'mostly_international', label: 'Mostly international experience' },
    { value: 'both', label: 'Both UK and international' },
  ]),
  experienceDescription: qFreeText(
    'cb_work_experience_field',
    'What type of work or field was your experience in?',
    'retail, warehouse, nursing, engineering technician, office admin'
  ),
}

/** Map legacy answers to the simplified two-tier model. */
export function normalizeExperienceLevel(raw: string | null | undefined): NormalizedExperienceLevel {
  const v = String(raw ?? '').trim()
  if (v === 'no_experience') return 'no_experience'
  return 'have_experience'
}

export function getNormalizedExperienceLevel(state: CareerBrainState): NormalizedExperienceLevel | null {
  const v = answers(state).cb_experience_level
  if (!v) return null
  return normalizeExperienceLevel(String(v))
}

/** @deprecated use getNormalizedExperienceLevel */
export function getExperienceTier(state: CareerBrainState): NormalizedExperienceLevel | null {
  return getNormalizedExperienceLevel(state)
}

export function isHaveExperiencePath(state: CareerBrainState): boolean {
  return getNormalizedExperienceLevel(state) === 'have_experience'
}

/** @deprecated use isHaveExperiencePath */
export function isSmallBasicPath(state: CareerBrainState): boolean {
  return isHaveExperiencePath(state)
}

export function isExperiencedPath(state: CareerBrainState): boolean {
  return isHaveExperiencePath(state) && !!answers(state).cb_professional_field
}

export function pickExperienceLevelQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_experience_level')) {
    return { question: EXPERIENCE_LEVEL_QUESTION, reason: 'Experience — level' }
  }
  return { question: null, reason: 'Experience level answered' }
}

export function pickHaveExperienceFollowUp(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (getNormalizedExperienceLevel(state) !== 'have_experience') {
    return { question: null, reason: 'Not have-experience path' }
  }
  if (!hasAnswer(state, 'cb_experience_field_relation')) {
    return {
      question: HAVE_EXPERIENCE_QUESTIONS.fieldRelation,
      reason: 'Experience — relation to study field',
    }
  }
  if (!hasAnswer(state, 'cb_work_experience_field') && !hasAnswer(state, 'cb_basic_experience_text')) {
    return {
      question: HAVE_EXPERIENCE_QUESTIONS.experienceDescription,
      reason: 'Experience — which field or role type',
    }
  }
  if (!hasAnswer(state, 'cb_experience_country')) {
    return {
      question: HAVE_EXPERIENCE_QUESTIONS.experienceCountry,
      reason: 'Experience — UK vs international',
    }
  }
  return { question: null, reason: 'Have-experience follow-ups complete' }
}

export function isHaveExperienceBlockComplete(state: CareerBrainState): boolean {
  if (getNormalizedExperienceLevel(state) !== 'have_experience') return true
  return pickHaveExperienceFollowUp(state).question === null
}

export function pickExperienceAssessmentQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  const level = pickExperienceLevelQuestion(state)
  if (level.question) return level
  const follow = pickHaveExperienceFollowUp(state)
  if (follow.question) return follow
  return { question: null, reason: 'Experience assessment complete' }
}

export function isExperienceAssessmentComplete(state: CareerBrainState): boolean {
  return pickExperienceAssessmentQuestion(state).question === null
}

export function experienceRelationToStudy(state: CareerBrainState): string {
  return String(answers(state).cb_experience_field_relation ?? '')
}

export function isExperienceStudyRelated(state: CareerBrainState): boolean {
  const r = experienceRelationToStudy(state)
  return r.includes('study_related') || r.includes('both_fields')
}

export function isExperienceDifferentField(state: CareerBrainState): boolean {
  const r = experienceRelationToStudy(state)
  return r.includes('different_field') || r.includes('both_fields')
}
