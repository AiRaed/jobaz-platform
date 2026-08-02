/**
 * Field-specific education path interview — multi-select where UK professionals
 * commonly hold multiple skills, certifications, or systems experience.
 */

import type { CareerEngineQuestion } from '@/lib/career-engine/conversation/types'
import { EDUCATION_CONVERSATION_QUESTIONS } from '@/lib/career-engine/conversation/pathQuestions'
import type { EducationFieldId } from './types'
import {
  MULTI_SELECT_HELPER,
  isMultiSelectQuestion,
  buildCertificationStatusQuestions,
} from '@/lib/career-engine/shared/assessmentMultiSelect'
import { EDUCATION_PATH_FOLLOWUP_QUESTIONS } from './questions'
import {
  CERTIFICATION_QUESTION_TEXT,
  getRelevantCertificationOptions,
} from './getRelevantCertificationOptions'

/** Legacy ids merged into the dynamic professional_certifications question */
const REDUNDANT_CERT_QUESTION_IDS = new Set([
  'electrical_qualifications',
  'tech_certifications',
  'healthcare_certifications',
  'construction_cards',
])

type FieldQuestionDef = {
  id: string
  text: string
  options: Array<{ value: string; label: string }>
  allowMultiple?: boolean
  fields: EducationFieldId[]
  priority: number
}

const FIELD_QUESTIONS: FieldQuestionDef[] = [
  {
    id: 'accounting_software',
    text: 'Which accounting software are you proficient with?',
    options: [
      { value: 'sage', label: 'Sage' },
      { value: 'xero', label: 'Xero' },
      { value: 'quickbooks', label: 'QuickBooks' },
      { value: 'sap', label: 'SAP' },
      { value: 'oracle', label: 'Oracle Financials' },
      { value: 'excel_advanced', label: 'Advanced Excel' },
      { value: 'other', label: 'Other' },
    ],
    allowMultiple: true,
    fields: ['business_finance'],
    priority: 2,
  },
  {
    id: 'cloud_platforms',
    text: 'Which cloud platforms have you worked with?',
    options: [
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Microsoft Azure' },
      { value: 'gcp', label: 'Google Cloud' },
      { value: 'other', label: 'Other' },
    ],
    allowMultiple: true,
    fields: ['it'],
    priority: 2,
  },
  {
    id: 'programming_languages',
    text: 'Which programming languages do you use?',
    options: [
      { value: 'javascript_ts', label: 'JavaScript / TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'java', label: 'Java' },
      { value: 'csharp', label: 'C#' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: 'php', label: 'PHP' },
      { value: 'other', label: 'Other' },
    ],
    allowMultiple: true,
    fields: ['it'],
    priority: 3,
  },
  {
    id: 'languages_spoken',
    text: 'Which languages do you speak professionally?',
    options: [
      { value: 'english', label: 'English' },
      { value: 'arabic', label: 'Arabic' },
      { value: 'polish', label: 'Polish' },
      { value: 'romanian', label: 'Romanian' },
      { value: 'spanish', label: 'Spanish' },
      { value: 'french', label: 'French' },
      { value: 'urdu', label: 'Urdu' },
      { value: 'other', label: 'Other' },
    ],
    allowMultiple: true,
    fields: [
      'business_finance',
      'healthcare',
      'hospitality',
      'it',
      'engineering',
      'construction',
      'law',
      'social_care',
      'logistics_transport',
      'public_sector',
      'education',
      'science',
      'creative_arts',
      'media_communications',
      'manufacturing',
      'property_real_estate',
      'other',
    ],
    priority: 5,
  },
]

function buildProfessionalCertificationsQuestion(
  fieldId: EducationFieldId,
  answers: Record<string, string>
): CareerEngineQuestion {
  const matched = getRelevantCertificationOptions({
    goal: 'work_in_education',
    educationField: fieldId,
    specialisation: answers.education_specialisation ?? '',
    qualificationCountry: answers.qualification_origin,
    willingToTakeCourses: answers.open_to_courses,
  })

  return {
    id: 'professional_certifications',
    text: matched.questionText || CERTIFICATION_QUESTION_TEXT,
    options: matched.options,
    allowMultiple: true,
    helperText: matched.helperText ?? MULTI_SELECT_HELPER,
  }
}

function toCareerQuestion(def: FieldQuestionDef): CareerEngineQuestion {
  return {
    id: def.id,
    text: def.text,
    options: def.options,
    allowMultiple: def.allowMultiple ?? isMultiSelectQuestion(def.id),
    helperText: def.allowMultiple || isMultiSelectQuestion(def.id) ? MULTI_SELECT_HELPER : undefined,
  }
}

/** Resolve dynamic field questions (certification options, etc.) at display time. */
export function resolveEducationFieldQuestion(
  question: CareerEngineQuestion,
  answers: Record<string, string>
): CareerEngineQuestion {
  if (question.id !== 'professional_certifications') return question

  const fieldId = answers.education_field as EducationFieldId | undefined
  if (!fieldId) return question

  return buildProfessionalCertificationsQuestion(fieldId, answers)
}

export function buildEducationFieldQuestions(
  fieldId: EducationFieldId,
  answers: Record<string, string>
): CareerEngineQuestion[] {
  const seen = new Set<string>()
  const out: CareerEngineQuestion[] = []

  out.push(buildProfessionalCertificationsQuestion(fieldId, answers))
  seen.add('professional_certifications')

  for (const def of [...FIELD_QUESTIONS].sort((a, b) => a.priority - b.priority)) {
    if (!def.fields.includes(fieldId)) continue
    if (seen.has(def.id) || REDUNDANT_CERT_QUESTION_IDS.has(def.id)) continue
    seen.add(def.id)
    out.push(toCareerQuestion(def))
  }

  out.push(...buildCertificationStatusQuestions(answers))

  return out
}

export function resolveEducationQuestionFlow(answers: Record<string, string>): CareerEngineQuestion[] {
  const base: CareerEngineQuestion[] = EDUCATION_CONVERSATION_QUESTIONS.map((q) => ({ ...q }))

  const fieldId = answers.education_field as EducationFieldId | undefined
  if (!fieldId || !answers.education_specialisation) {
    return base
  }

  const universalDone = EDUCATION_PATH_FOLLOWUP_QUESTIONS.every(
    (q) => typeof answers[q.id] === 'string'
  )
  if (!universalDone) {
    return base
  }

  return [...base, ...buildEducationFieldQuestions(fieldId, answers)]
}
