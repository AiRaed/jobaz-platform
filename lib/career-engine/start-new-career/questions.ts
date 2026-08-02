import type { CareerEngineQuestion } from '@/lib/career-engine/conversation/types'
import {
  CAREER_SECTOR_OPTIONS,
  labelCareerSector,
} from '@/lib/career-engine/shared/careerSectors'
import {
  INTEREST_AREA_HELPER,
  INTEREST_AREA_MAX,
  INTEREST_AREA_OPTIONS,
  labelInterestAreas,
} from '@/lib/career-engine/shared/interestScoring'
import type { StartNewCareerSituation } from './types'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export const STARTING_SITUATION_QUESTION: CareerEngineQuestion = {
  id: 'starting_situation',
  text: 'Which best describes your situation right now?',
  options: [
    {
      value: 'experienced_known_target',
      label: 'I have work experience and want to change career',
    },
    {
      value: 'experienced_unknown_target',
      label: "I have work experience but don't know which career to move into",
    },
    {
      value: 'no_experience_known_target',
      label: 'I have no work experience but already know which career I want',
    },
    {
      value: 'no_experience_unknown_target',
      label: "I have no work experience and don't know which career suits me",
    },
  ],
}

export const CURRENT_FIELD_QUESTION: CareerEngineQuestion = {
  id: 'current_field',
  text: 'What field is most of your work experience in?',
  options: [...CAREER_SECTOR_OPTIONS],
}

export const CURRENT_FIELD_OTHER_QUESTION: CareerEngineQuestion = {
  id: 'current_field_other',
  text: 'Please describe your current field:',
  options: [],
  allowFreeText: true,
}

export const EXPERIENCE_YEARS_QUESTION: CareerEngineQuestion = {
  id: 'experience_years',
  text: 'How many years of work experience do you have?',
  options: [
    { value: '0_1', label: 'Less than 1 year' },
    { value: '1_3', label: '1–3 years' },
    { value: '3_5', label: '3–5 years' },
    { value: '5_10', label: '5–10 years' },
    { value: '10_plus', label: '10+ years' },
  ],
}

export const TARGET_FIELD_QUESTION: CareerEngineQuestion = {
  id: 'target_field',
  text: 'Which career field would you like to move into?',
  options: [...CAREER_SECTOR_OPTIONS],
  helperText:
    'Select the UK career field you want — the same list used across Career Engine pathways. We will not guess your target.',
}

export const TARGET_FIELD_OTHER_QUESTION: CareerEngineQuestion = {
  id: 'target_field_other',
  text: 'Please describe the career you want to move into:',
  options: [],
  allowFreeText: true,
}

export const INTEREST_AREA_QUESTION: CareerEngineQuestion = {
  id: 'interest_area',
  text: 'Which interests best describe you? (Choose up to 3)',
  options: [...INTEREST_AREA_OPTIONS],
  allowMultiple: true,
  maxSelections: INTEREST_AREA_MAX,
  helperText: INTEREST_AREA_HELPER,
}

export const WORK_ENVIRONMENT_QUESTION: CareerEngineQuestion = {
  id: 'work_environment',
  text: 'Which work environments appeal to you? (Choose up to 3)',
  options: [
    { value: 'customer_facing', label: 'Customer-facing / public contact' },
    { value: 'office_desk', label: 'Office / desk-based' },
    { value: 'physical_active', label: 'Physical / active work' },
    { value: 'outdoors', label: 'Outdoors or on-site' },
    { value: 'quiet_independent', label: 'Quiet / independent focus' },
    { value: 'team_based', label: 'Team-based collaboration' },
  ],
  allowMultiple: true,
  maxSelections: 3,
  helperText: 'Choose up to 3 environments you could see yourself working in.',
}

export const EDUCATION_LEVEL_QUESTION: CareerEngineQuestion = {
  id: 'education_level',
  text: 'What is your highest level of education?',
  options: [
    { value: 'no_formal', label: 'No formal qualifications' },
    { value: 'gcse_a_levels', label: 'GCSE / A Levels' },
    { value: 'vocational', label: 'Vocational qualification' },
    { value: 'diploma_college', label: 'Diploma / College qualification' },
    { value: 'bachelors', label: "Bachelor's degree" },
    { value: 'masters', label: "Master's degree" },
    { value: 'phd', label: 'PhD / Doctorate' },
  ],
}

export const ENGLISH_LEVEL_QUESTION: CareerEngineQuestion = {
  id: 'english_level',
  text: 'What is your English level?',
  options: [
    { value: 'beginner', label: 'Beginner' },
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'good', label: 'Good' },
    { value: 'fluent', label: 'Fluent' },
  ],
}

export const UK_WORK_EXPERIENCE_QUESTION: CareerEngineQuestion = {
  id: 'uk_work_experience',
  text: 'Do you already have UK work experience?',
  options: YES_NO,
}

export const URGENCY_QUESTION: CareerEngineQuestion = {
  id: 'urgency',
  text: 'What is your priority right now?',
  options: [
    { value: 'immediate', label: 'I need a job immediately' },
    { value: 'balanced', label: 'I can work now while studying part-time' },
    { value: 'study_first', label: 'I am happy to study first, then move into the new career' },
  ],
}

export const STUDY_WILLING_QUESTION: CareerEngineQuestion = {
  id: 'study_willing',
  text: 'Are you willing to complete UK courses or certifications for your new career?',
  options: YES_NO,
}

export const PREFERRED_LOCATION_QUESTION: CareerEngineQuestion = {
  id: 'preferred_location',
  text: 'Where in the UK would you like to work?',
  options: [
    { value: 'London', label: 'London' },
    { value: 'Manchester', label: 'Manchester' },
    { value: 'Birmingham', label: 'Birmingham' },
    { value: 'UK-wide', label: 'UK-wide' },
  ],
  allowFreeText: true,
}

export const SITUATION_LABELS: Record<StartNewCareerSituation, string> = {
  experienced_known_target: 'Experienced — target career known',
  experienced_unknown_target: 'Experienced — exploring careers',
  no_experience_known_target: 'New starter — target career known',
  no_experience_unknown_target: 'New starter — exploring careers',
}

function hasExperience(situation?: string): boolean {
  return situation === 'experienced_known_target' || situation === 'experienced_unknown_target'
}

function knowsTarget(situation?: string): boolean {
  return situation === 'experienced_known_target' || situation === 'no_experience_known_target'
}

/** Adaptive question flow — every question depends on the starting situation. */
export function resolveStartNewCareerQuestionFlow(
  answers: Record<string, string>
): CareerEngineQuestion[] {
  const situation = answers.starting_situation as StartNewCareerSituation | undefined
  const flow: CareerEngineQuestion[] = [STARTING_SITUATION_QUESTION]

  if (!situation) return flow

  // Situation A — user knows their destination: ask career selection FIRST (mandatory, never inferred)
  if (knowsTarget(situation)) {
    flow.push(TARGET_FIELD_QUESTION)
    if (answers.target_field === 'other') {
      flow.push(TARGET_FIELD_OTHER_QUESTION)
    }
  }

  if (hasExperience(situation)) {
    flow.push(CURRENT_FIELD_QUESTION)
    if (answers.current_field === 'other') {
      flow.push(CURRENT_FIELD_OTHER_QUESTION)
    }
    flow.push(EXPERIENCE_YEARS_QUESTION)
  }

  if (!knowsTarget(situation)) {
    flow.push(INTEREST_AREA_QUESTION, WORK_ENVIRONMENT_QUESTION)
  }

  flow.push(
    EDUCATION_LEVEL_QUESTION,
    ENGLISH_LEVEL_QUESTION,
    UK_WORK_EXPERIENCE_QUESTION,
    URGENCY_QUESTION,
    STUDY_WILLING_QUESTION,
    PREFERRED_LOCATION_QUESTION
  )

  return flow
}

export function resolveStartNewCareerQuestion(
  question: CareerEngineQuestion,
  answers: Record<string, string>
): CareerEngineQuestion {
  return question
}

export function labelStartNewCareerAnswer(
  questionId: string,
  value: string,
  answers: Record<string, string>
): string {
  if (questionId === 'current_field' && value === 'other') {
    return answers.current_field_other?.trim() || 'Other'
  }
  if (questionId === 'target_field' && value === 'other') {
    return answers.target_field_other?.trim() || 'Other'
  }
  if (questionId === 'current_field' || questionId === 'target_field') {
    return labelCareerSector(value)
  }
  if (questionId === 'interest_area') {
    return labelInterestAreas(value) || value.replace(/_/g, ' ')
  }
  if (questionId === 'work_environment') {
    const ids = value.split(',').map((s) => s.trim()).filter(Boolean)
    const labels = ids.map(
      (id) =>
        WORK_ENVIRONMENT_QUESTION.options.find((o) => o.value === id)?.label ??
        id.replace(/_/g, ' ')
    )
    return labels.join(' · ')
  }
  if (questionId === 'starting_situation') {
    return SITUATION_LABELS[value as StartNewCareerSituation] ?? value
  }
  const q = resolveStartNewCareerQuestionFlow(answers).find((item) => item.id === questionId)
  return q?.options.find((o) => o.value === value)?.label ?? value.replace(/_/g, ' ')
}

/** Static export for pathRegistry fallback (flow is resolved dynamically). */
export const START_NEW_CAREER_QUESTIONS: CareerEngineQuestion[] = [STARTING_SITUATION_QUESTION]
