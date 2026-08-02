/**
 * Unemployed / Looking for a job — adaptive conversation flow.
 * Experience, education, priority, and training openness shape recommendations.
 */

import { applyBridgeModeToProfile } from './bridgeRoleIntelligence'
import type { CareerDirectionPriority } from './educationExperienceSplit'
import {
  FIRST_JOB_EDUCATION_QUESTIONS,
  getFirstJobEducationLevel,
  isDegreeOrAbove,
  studyFieldBridgeText,
} from './firstJobEducationPath'
import { resolveEffectiveStudyField } from './fieldSpecialisation'
import { EXPERIENCE_LEVEL_QUESTION, isHaveExperiencePath } from './experienceAssessment'
import { pickTrainingReadinessQuestion } from './speedDevelopmentMode'
import { getRoutingGoal, getSelectedUserGoal } from './userGoal'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile, EducationLevel } from './types'

export type UnemployedCareerFocus = 'education' | 'experience' | 'both' | 'blended' | 'general' | 'fast_employment'

export type ExperienceYearsBand = 'under_1' | '1_3' | '3_5' | '5_10' | '10_plus'

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

export const UNEMPLOYED_PATH_PRIORITY_QUESTION = q(
  'cb_career_direction_priority',
  'Which path would you like to prioritise?',
  [
    { value: 'experience_field', label: 'My previous work experience' },
    { value: 'education_field', label: 'My education field' },
    { value: 'both', label: 'Both equally' },
    { value: 'fast_employment', label: 'Fastest route into employment' },
  ]
)

export const UNEMPLOYED_EXPERIENCE_FIELD_QUESTION = q(
  'cb_work_experience_field',
  'What type of work or field was your experience in?',
  [
    { value: 'retail', label: 'Retail' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'driving', label: 'Driving' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'office_admin', label: 'Office Admin' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'trades', label: 'Trades' },
    { value: 'it', label: 'IT' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'media_communications', label: 'Media & Communications' },
    { value: 'education', label: 'Education' },
    { value: 'arts_design', label: 'Animation & Design' },
    { value: 'other', label: 'Other' },
  ]
)

export const UNEMPLOYED_EXPERIENCE_COUNTRY_QUESTION = q(
  'cb_experience_country',
  'Where was most of this experience gained?',
  [
    { value: 'mostly_uk', label: 'UK' },
    { value: 'mostly_international', label: 'Outside UK' },
    { value: 'both', label: 'Both' },
  ]
)

export const UNEMPLOYED_EXPERIENCE_YEARS_QUESTION = q(
  'cb_experience_years',
  'How many years of experience do you have?',
  [
    { value: 'under_1', label: 'Less than 1 year' },
    { value: '1_3', label: '1–3 years' },
    { value: '3_5', label: '3–5 years' },
    { value: '5_10', label: '5–10 years' },
    { value: '10_plus', label: '10+ years' },
  ]
)

const EXPERIENCE_FIELD_LABELS: Record<string, string> = {
  retail: 'retail',
  warehouse: 'warehouse',
  driving: 'driving',
  customer_service: 'customer service',
  office_admin: 'office admin',
  hospitality: 'hospitality',
  healthcare: 'healthcare',
  trades: 'trades',
  it: 'IT',
  marketing: 'marketing',
  media_communications: 'media communications',
  education: 'education',
  arts_design: 'animation design',
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

export function isUnemployedPath(state: CareerBrainState): boolean {
  return getRoutingGoal(state) === 'unemployed' || getSelectedUserGoal(state) === 'unemployed'
}

export function getExperienceYearsBand(state: CareerBrainState): ExperienceYearsBand | null {
  const v = String(answers(state).cb_experience_years ?? '')
  if (v === 'under_1' || v === '1_3' || v === '3_5' || v === '5_10' || v === '10_plus') {
    return v
  }
  return null
}

function getCareerDirectionPriority(state: CareerBrainState): CareerDirectionPriority | null {
  const v = String(answers(state).cb_career_direction_priority ?? '')
  if (
    v === 'education_field' ||
    v === 'experience_field' ||
    v === 'both' ||
    v === 'not_sure' ||
    v === 'fast_employment'
  ) {
    return v
  }
  return null
}

function mapExperienceYearsToProfile(band: ExperienceYearsBand | null): number {
  switch (band) {
    case 'under_1':
      return 0
    case '1_3':
      return 2
    case '3_5':
      return 4
    case '5_10':
      return 7
    case '10_plus':
      return 12
    default:
      return 1
  }
}

function experienceFieldText(state: CareerBrainState): string {
  const raw = String(answers(state).cb_work_experience_field ?? '').trim()
  if (raw === 'other') {
    return String(answers(state).cb_basic_experience_text ?? '').trim()
  }
  if (raw && EXPERIENCE_FIELD_LABELS[raw]) {
    return EXPERIENCE_FIELD_LABELS[raw]
  }
  return raw || String(answers(state).cb_basic_experience_text ?? '').trim()
}

function hasExperienceFieldAnswer(state: CareerBrainState): boolean {
  const raw = String(answers(state).cb_work_experience_field ?? '').trim()
  if (!raw) return false
  if (raw === 'other') return hasAnswer(state, 'cb_basic_experience_text')
  return true
}

function mapEducationLevel(level: NonNullable<ReturnType<typeof getFirstJobEducationLevel>>): EducationLevel {
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

/** Sync legacy alignment/intent answers from explicit priority choice. */
export function syncUnemployedLegacyAnswers(state: CareerBrainState): CareerBrainState {
  if (!isUnemployedPath(state)) return state
  const priority = getCareerDirectionPriority(state)
  if (!priority) return state

  const nextAnswers = { ...answers(state) }
  if (priority === 'education_field') {
    nextAnswers.cb_field_alignment = 'yes'
    nextAnswers.cb_experience_field_intent = 'no'
  } else if (priority === 'experience_field') {
    nextAnswers.cb_field_alignment = 'no'
    nextAnswers.cb_experience_field_intent = 'yes'
  } else if (priority === 'both') {
    nextAnswers.cb_field_alignment = 'both'
    nextAnswers.cb_experience_field_intent = 'yes'
  } else if (priority === 'fast_employment') {
    nextAnswers.cb_field_alignment = 'no'
    nextAnswers.cb_experience_field_intent = 'yes'
  } else if (priority === 'not_sure') {
    nextAnswers.cb_field_alignment = 'both'
    nextAnswers.cb_experience_field_intent = 'yes'
  }

  return { ...state, answers: nextAnswers }
}

/** @deprecated Priority is chosen explicitly — use syncUnemployedLegacyAnswers after priority is set. */
export function syncUnemployedPathAnswers(state: CareerBrainState): CareerBrainState {
  return syncUnemployedLegacyAnswers(state)
}

export function wantsStudyFieldCareer(state: CareerBrainState): boolean {
  const level = getFirstJobEducationLevel(state)
  if (!isDegreeOrAbove(level)) return false
  const priority = getCareerDirectionPriority(state)
  if (priority === 'education_field' || priority === 'both') return true
  if (priority === 'experience_field' || priority === 'fast_employment') return false
  if (priority === 'not_sure') return true
  return false
}

export function wantsExperienceFieldCareer(state: CareerBrainState): boolean {
  if (!isHaveExperiencePath(state)) return false
  const priority = getCareerDirectionPriority(state)
  if (priority === 'experience_field' || priority === 'both' || priority === 'fast_employment') return true
  if (priority === 'education_field') return false
  if (priority === 'not_sure') return true
  return true
}

export function wantsBothEducationAndExperience(state: CareerBrainState): boolean {
  return wantsStudyFieldCareer(state) && wantsExperienceFieldCareer(state)
}

export function wantsNeitherStudyNorExperience(state: CareerBrainState): boolean {
  return false
}

function unemployedPriorityOptions(state: CareerBrainState): Array<{ value: string; label: string }> {
  if (isHaveExperiencePath(state)) {
    return UNEMPLOYED_PATH_PRIORITY_QUESTION.options ?? []
  }
  return [
    { value: 'education_field', label: 'My education field' },
    { value: 'fast_employment', label: 'Fastest route into employment' },
  ]
}

/** Priority is mandatory once education (and experience, if applicable) is collected. */
export function needsUnemployedPathPriorityQuestion(state: CareerBrainState): boolean {
  if (!isUnemployedPath(state)) return false
  if (!isUnemployedEducationBlockComplete(state)) return false
  if (isHaveExperiencePath(state) && !isUnemployedExperienceBlockComplete(state)) return false
  return true
}

export function pickUnemployedPathPriorityQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!needsUnemployedPathPriorityQuestion(state)) {
    return { question: null, reason: 'Unemployed priority not required' }
  }
  if (hasAnswer(state, 'cb_career_direction_priority')) {
    return { question: null, reason: 'Unemployed path priority already selected' }
  }
  return {
    question: {
      ...UNEMPLOYED_PATH_PRIORITY_QUESTION,
      options: unemployedPriorityOptions(state),
    },
    reason: 'Unemployed — choose which path to prioritise',
  }
}

export function getUnemployedCareerFocus(state: CareerBrainState): UnemployedCareerFocus | null {
  if (!isUnemployedPath(state)) return null
  if (!hasAnswer(state, 'cb_experience_level')) return null
  if (!isUnemployedEducationBlockComplete(state)) return null
  if (!isUnemployedExperienceBlockComplete(state)) return null

  if (!isHaveExperiencePath(state)) {
    if (!getCareerDirectionPriority(state)) return null
    if (!isUnemployedTailComplete(state)) return null
    const priority = getCareerDirectionPriority(state)
    if (priority === 'fast_employment') return 'fast_employment'
    return 'education'
  }

  if (needsUnemployedPathPriorityQuestion(state) && !getCareerDirectionPriority(state)) {
    return null
  }
  if (!isUnemployedTailComplete(state)) return null

  const priority = getCareerDirectionPriority(state)
  if (priority === 'education_field') return 'education'
  if (priority === 'experience_field') return 'experience'
  if (priority === 'both') return 'both'
  if (priority === 'fast_employment') return 'fast_employment'
  if (priority === 'not_sure') return 'blended'
  return null
}

export function isUnemployedEducationBlockComplete(state: CareerBrainState): boolean {
  if (!hasAnswer(state, 'cb_first_job_education_level')) return false
  const level = getFirstJobEducationLevel(state)
  if (isDegreeOrAbove(level) && !hasAnswer(state, 'cb_first_job_study_field')) return false
  return true
}

export function isUnemployedExperienceBlockComplete(state: CareerBrainState): boolean {
  if (!isHaveExperiencePath(state)) return true
  if (!hasExperienceFieldAnswer(state)) return false
  if (!hasAnswer(state, 'cb_experience_country')) return false
  if (!hasAnswer(state, 'cb_experience_years')) return false
  return true
}

function isUnemployedTailComplete(state: CareerBrainState): boolean {
  return hasAnswer(state, 'cb_cert_openness')
}

export function isUnemployedPathComplete(state: CareerBrainState): boolean {
  if (!isUnemployedPath(state)) return true
  if (!hasAnswer(state, 'cb_experience_level')) return false
  if (!isUnemployedEducationBlockComplete(state)) return false
  if (!isUnemployedExperienceBlockComplete(state)) return false

  if (isHaveExperiencePath(state)) {
    if (needsUnemployedPathPriorityQuestion(state) && !hasAnswer(state, 'cb_career_direction_priority')) {
      return false
    }
  } else if (!hasAnswer(state, 'cb_career_direction_priority')) {
    return false
  }

  return isUnemployedTailComplete(state)
}

export function pickUnemployedEducationQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_first_job_education_level')) {
    return {
      question: FIRST_JOB_EDUCATION_QUESTIONS.educationLevel,
      reason: 'Unemployed — highest education level',
    }
  }
  const level = getFirstJobEducationLevel(state)
  if (isDegreeOrAbove(level) && !hasAnswer(state, 'cb_first_job_study_field')) {
    return {
      question: FIRST_JOB_EDUCATION_QUESTIONS.studyField,
      reason: 'Unemployed — field of study',
    }
  }
  return { question: null, reason: 'Unemployed education block complete' }
}

function pickUnemployedExperienceQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!isHaveExperiencePath(state)) {
    return { question: null, reason: 'No experience path — skip experience block' }
  }
  if (!hasExperienceFieldAnswer(state)) {
    if (
      String(answers(state).cb_work_experience_field ?? '') === 'other' &&
      !hasAnswer(state, 'cb_basic_experience_text')
    ) {
      return {
        question: qFreeText(
          'cb_basic_experience_text',
          'Please describe your work experience field',
          'cleaning, security, childcare'
        ),
        reason: 'Unemployed — describe other experience field',
      }
    }
    return {
      question: UNEMPLOYED_EXPERIENCE_FIELD_QUESTION,
      reason: 'Unemployed — previous work field',
    }
  }
  if (!hasAnswer(state, 'cb_experience_country')) {
    return {
      question: UNEMPLOYED_EXPERIENCE_COUNTRY_QUESTION,
      reason: 'Unemployed — where experience was gained',
    }
  }
  if (!hasAnswer(state, 'cb_experience_years')) {
    return {
      question: UNEMPLOYED_EXPERIENCE_YEARS_QUESTION,
      reason: 'Unemployed — years of experience',
    }
  }
  return { question: null, reason: 'Unemployed experience block complete' }
}

function pickUnemployedTailQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  return pickTrainingReadinessQuestion(state)
}

export function pickUnemployedPathQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_experience_level')) {
    return { question: EXPERIENCE_LEVEL_QUESTION, reason: 'Unemployed — work experience?' }
  }

  if (isHaveExperiencePath(state)) {
    const exp = pickUnemployedExperienceQuestion(state)
    if (exp.question) return exp
  }

  const edu = pickUnemployedEducationQuestion(state)
  if (edu.question) return edu

  const priorityQ = pickUnemployedPathPriorityQuestion(state)
  if (priorityQ.question) return priorityQ

  return pickUnemployedTailQuestion(state)
}

export function applyUnemployedPathToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  if (!isUnemployedPath(state)) return profile

  const synced = syncUnemployedLegacyAnswers(state)
  const a = synced.answers ?? {}
  const level = getFirstJobEducationLevel(synced)
  let next: CareerProfile = {
    ...profile,
    constraints: [...new Set([...profile.constraints, 'unemployed-path'])],
  }

  if (level) {
    next.educationLevel = mapEducationLevel(level)
  }

  const studyValue = String(a.cb_first_job_study_field ?? '')
  if (studyValue) {
    next.studyField = resolveEffectiveStudyField(synced, studyFieldBridgeText(studyValue))
  }

  if (isHaveExperiencePath(synced)) {
    const exp = experienceFieldText(synced)
    if (exp) {
      next.workExperienceField = exp
    }
    next.yearsOfExperience = mapExperienceYearsToProfile(getExperienceYearsBand(synced))
    const country = String(a.cb_experience_country ?? '')
    if (country === 'mostly_uk') next.experienceCountry = 'UK'
    else if (country === 'mostly_international') next.experienceCountry = 'international'
    else if (country === 'both') next.experienceCountry = 'both'
  } else {
    next.yearsOfExperience = 0
  }

  const focus = getUnemployedCareerFocus(synced)
  if (focus === 'education') {
    next = applyBridgeModeToProfile(
      {
        ...next,
        wantsSameField: true,
        wantsCareerChange: false,
        constraints: [
          ...new Set([
            ...next.constraints.filter((c) => c !== 'first-job-no-prior-exp'),
            'unemployed-education-path',
            'bridge-role-mode',
            'field-first-education',
            'path-focus-education',
          ]),
        ],
      },
      synced
    )
  } else if (focus === 'experience') {
    next = applyBridgeModeToProfile(
      {
        ...next,
        wantsSameField: true,
        wantsCareerChange: false,
        constraints: [
          ...new Set([...next.constraints, 'path-focus-experience', 'bridge-role-mode']),
        ],
      },
      synced
    )
  } else if (focus === 'both') {
    next = {
      ...next,
      constraints: [...new Set([...next.constraints, 'dual-education-experience-paths'])],
    }
  } else if (focus === 'blended') {
    next = {
      ...next,
      constraints: [...new Set([...next.constraints, 'unemployed-blended-path'])],
    }
  } else if (focus === 'fast_employment') {
    next = applyBridgeModeToProfile(
      {
        ...next,
        wantsSameField: false,
        wantsCareerChange: null,
        constraints: [
          ...new Set([
            ...next.constraints,
            'fast-employment-priority',
            ...(isHaveExperiencePath(synced) ? ['path-focus-experience', 'bridge-role-mode'] : []),
          ]),
        ],
      },
      synced
    )
  }

  return next
}

export function buildUnemployedPathReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state || !isUnemployedPath(state)) return []
  const focus = getUnemployedCareerFocus(state)
  if (!focus) return []

  const lines: string[] = [
    'Unemployed pathway — your experience, education, stated priority, and training openness shape these recommendations.',
  ]

  if (focus === 'both') {
    lines.push(
      'You chose to balance both paths equally — Work Now, Build Next, and Long-Term combine roles from your qualification and your work history.',
      'Each recommendation shows whether it came from your education field or your work experience.',
    )
  } else if (focus === 'blended') {
    lines.push(
      'You are not sure which path to prioritise — we blended education-aligned and experience-aligned options with trade-offs explained below.',
    )
  } else if (focus === 'education') {
    lines.push('You prioritised your education field — recommendations follow your qualification, not your degree title alone.')
  } else if (focus === 'experience') {
    lines.push('You prioritised your work experience — Work Now roles connect to what you have already done in the UK market.')
  } else if (focus === 'fast_employment') {
    lines.push(
      'You chose the fastest route into employment — recommendations favour realistic hiring speed over field prestige.',
    )
  } else {
    lines.push(
      'No prior work experience — recommendations follow your education, priority, and fastest realistic UK entry roles.',
    )
  }

  return lines
}
