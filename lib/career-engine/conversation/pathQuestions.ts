import type { CareerEngineQuestion } from './types'
import type { EducationFieldId } from '@/lib/career-engine/education-path/types'
import {
  EDUCATION_FIELD_QUESTION,
  EDUCATION_PATH_FOLLOWUP_QUESTIONS,
  EDUCATION_SPECIALISATION_QUESTION,
} from '@/lib/career-engine/education-path/questions'
import { resolveEducationFieldQuestion } from '@/lib/career-engine/education-path/educationDynamicInterview'
import {
  getSpecialisationOptions,
} from '@/lib/career-engine/education-path/educationSpecialisations'
import { EXPERIENCE_INDUSTRY_QUESTION, EXPERIENCE_SPECIALISATION_QUESTION } from '@/lib/career-engine/experience-path/questions'
import { MULTI_SELECT_HELPER } from '@/lib/career-engine/shared/assessmentMultiSelect'
import {
  getExperienceSpecialisationOptions,
} from '@/lib/career-engine/experience-path/experienceSpecialisations'
import type { ExperienceIndustryId } from '@/lib/career-engine/experience-path/types'
import {
  START_NEW_CAREER_QUESTIONS,
  resolveStartNewCareerQuestion,
  resolveStartNewCareerQuestionFlow,
} from '@/lib/career-engine/start-new-career/questions'

export {
  START_NEW_CAREER_QUESTIONS,
  resolveStartNewCareerQuestion,
  resolveStartNewCareerQuestionFlow,
}

function toConversationQuestion(q: {
  id: string
  text: string
  options: Array<{ value: string; label: string }>
  allowFreeText?: boolean
}): CareerEngineQuestion {
  return {
    id: q.id,
    text: q.text,
    options: q.options,
    allowFreeText: q.allowFreeText,
  }
}

export const EDUCATION_CONVERSATION_QUESTIONS: CareerEngineQuestion[] = [
  toConversationQuestion(EDUCATION_FIELD_QUESTION),
  toConversationQuestion(EDUCATION_SPECIALISATION_QUESTION),
  ...EDUCATION_PATH_FOLLOWUP_QUESTIONS.map(toConversationQuestion),
]

/** Inject field-specific specialisation options before the question is shown. */
export function resolveEducationConversationQuestion(
  question: CareerEngineQuestion,
  answers: Record<string, string>
): CareerEngineQuestion {
  const fieldResolved = resolveEducationFieldQuestion(question, answers)
  if (fieldResolved.id !== 'education_specialisation') {
    return fieldResolved
  }

  const fieldId = answers.education_field as EducationFieldId | undefined
  if (!fieldId) {
    return {
      ...question,
      text: 'What was your specialisation?',
      options: [],
    }
  }

  const options = getSpecialisationOptions(fieldId).map((o) => ({
    value: o.value,
    label: o.label,
  }))

  return {
    ...question,
    text: 'What was your specialisation?',
    options,
    allowFreeText: fieldId === 'other',
  }
}

export const EXPERIENCE_CONVERSATION_QUESTIONS: CareerEngineQuestion[] = [
  toConversationQuestion(EXPERIENCE_INDUSTRY_QUESTION),
  toConversationQuestion(EXPERIENCE_SPECIALISATION_QUESTION),
]

/** Inject industry-specific job specialisation options. */
export function resolveExperienceConversationQuestion(
  question: CareerEngineQuestion,
  answers: Record<string, string>
): CareerEngineQuestion {
  if (question.id !== 'experience_specialisation') return question

  const industryId = answers.industry as ExperienceIndustryId | undefined
  if (!industryId) {
    return {
      ...question,
      text: 'What was your most recent job title or specialisation?',
      options: [],
    }
  }

  const options = getExperienceSpecialisationOptions(industryId).map((o) => ({
    value: o.value,
    label: o.label,
  }))

  return {
    ...question,
    text: 'Which job titles or specialisations match your experience?',
    options,
    allowFreeText: industryId === 'other',
    allowMultiple: industryId !== 'other',
    helperText: industryId !== 'other' ? MULTI_SELECT_HELPER : undefined,
  }
}

export const GROW_CAREER_QUESTIONS: CareerEngineQuestion[] = [
  {
    id: 'grow_field',
    text: 'What field do you currently work in?',
    options: [
      { value: 'it', label: 'IT' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'finance', label: 'Finance' },
      { value: 'education', label: 'Education' },
      { value: 'construction', label: 'Construction' },
      { value: 'hospitality', label: 'Hospitality' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'current_role',
    text: 'What is your current job title?',
    options: [],
    allowFreeText: true,
  },
  {
    id: 'grow_years',
    text: 'How many years have you worked in this field?',
    options: [
      { value: '1_3', label: '1–3 years' },
      { value: '3_5', label: '3–5 years' },
      { value: '5_10', label: '5–10 years' },
      { value: '10_plus', label: '10+ years' },
    ],
  },
  {
    id: 'grow_goal',
    text: 'What is your main goal right now?',
    options: [
      { value: 'promotion', label: 'Get promoted' },
      { value: 'salary', label: 'Earn more' },
      { value: 'leadership', label: 'Move into leadership' },
      { value: 'specialist', label: 'Become a senior specialist' },
    ],
  },
  {
    id: 'grow_study',
    text: 'Are you willing to complete qualifications or certifications to progress?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'grow_certifications',
    text: 'Which professional certifications are you willing to complete to progress?',
    options: [
      { value: 'acca', label: 'ACCA' },
      { value: 'cima', label: 'CIMA' },
      { value: 'cipd', label: 'CIPD' },
      { value: 'prince2', label: 'PRINCE2' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' },
      { value: 'nebosh', label: 'NEBOSH' },
      { value: 'other', label: 'Other' },
    ],
    allowMultiple: true,
    helperText: MULTI_SELECT_HELPER,
  },
  {
    id: 'preferred_location',
    text: 'Where in the UK are you looking to progress?',
    options: [
      { value: 'London', label: 'London' },
      { value: 'Manchester', label: 'Manchester' },
      { value: 'UK-wide', label: 'UK-wide' },
    ],
    allowFreeText: true,
  },
]

export const EXTRA_INCOME_QUESTIONS: CareerEngineQuestion[] = [
  {
    id: 'side_profile',
    text: 'Which best describes you?',
    options: [
      { value: 'student', label: 'Student' },
      { value: 'employed_full', label: 'Employed full-time' },
      { value: 'employed_part', label: 'Employed part-time' },
      { value: 'self_employed', label: 'Self-employed' },
      { value: 'not_working', label: 'Not currently working' },
    ],
  },
  {
    id: 'side_hours',
    text: 'How many hours per week can you dedicate to extra income?',
    options: [
      { value: 'under_10', label: 'Under 10 hours' },
      { value: '10_20', label: '10–20 hours' },
      { value: '20_plus', label: '20+ hours' },
    ],
  },
  {
    id: 'side_schedule',
    text: 'What schedule works best for you?',
    options: [
      { value: 'evenings_weekends', label: 'Evenings & weekends' },
      { value: 'weekdays', label: 'Weekdays only' },
      { value: 'flexible', label: 'Fully flexible' },
    ],
  },
  {
    id: 'side_income_goal',
    text: 'How much extra income are you aiming for per month?',
    options: [
      { value: 'under_500', label: 'Under £500' },
      { value: '500_1000', label: '£500–£1,000' },
      { value: '1000_plus', label: '£1,000+' },
    ],
  },
  {
    id: 'side_skills',
    text: 'What skills could you use for side income? (Select all that apply)',
    options: [
      { value: 'driving', label: 'Driving / Delivery' },
      { value: 'customer_service', label: 'Customer Service' },
      { value: 'hospitality', label: 'Hospitality / Events' },
      { value: 'retail', label: 'Retail' },
      { value: 'warehouse', label: 'Warehouse' },
      { value: 'administration', label: 'Administration' },
      { value: 'writing', label: 'Writing' },
      { value: 'teaching', label: 'Teaching / Tutoring' },
      { value: 'tech', label: 'IT / Tech' },
      { value: 'creative', label: 'Creative / Design' },
      { value: 'photography', label: 'Photography / Video' },
      { value: 'languages', label: 'Languages / Translation' },
      { value: 'care', label: 'Care / Support' },
      { value: 'cleaning', label: 'Cleaning' },
      { value: 'security', label: 'Security' },
      { value: 'trades', label: 'Trades / Handyman' },
      { value: 'sales', label: 'Sales' },
      { value: 'marketing', label: 'Marketing / Social Media' },
      { value: 'general', label: 'General / Open to anything' },
    ],
    allowMultiple: true,
    maxSelections: 6,
    helperText: 'Choose up to 6 skills — we match jobs and qualifications to what you can do now.',
  },
]

export const START_BUSINESS_QUESTIONS: CareerEngineQuestion[] = [
  {
    id: 'biz_idea',
    text: 'What type of business do you want to start?',
    options: [
      { value: 'online_shop', label: 'Online shop / e-commerce' },
      { value: 'services', label: 'Services (consulting, trades, etc.)' },
      { value: 'food', label: 'Food & hospitality' },
      { value: 'creative', label: 'Creative / freelance' },
      { value: 'tech', label: 'Tech / app / SaaS' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'biz_experience',
    text: 'Do you have experience in this area?',
    options: [
      { value: 'yes_professional', label: 'Yes — professional experience' },
      { value: 'some', label: 'Some experience' },
      { value: 'no', label: 'No — new to this field' },
    ],
  },
  {
    id: 'biz_capital',
    text: 'How much capital can you invest to start?',
    options: [
      { value: 'under_1k', label: 'Under £1,000' },
      { value: '1k_5k', label: '£1,000–£5,000' },
      { value: '5k_20k', label: '£5,000–£20,000' },
      { value: '20k_plus', label: '£20,000+' },
    ],
  },
  {
    id: 'biz_time',
    text: 'How much time can you commit?',
    options: [
      { value: 'part_time', label: 'Part-time (alongside job)' },
      { value: 'full_time', label: 'Full-time' },
      { value: 'side_project', label: 'Side project only' },
    ],
  },
  {
    id: 'biz_risk',
    text: 'How do you feel about business risk?',
    options: [
      { value: 'low', label: 'Prefer low risk / steady income' },
      { value: 'moderate', label: 'Moderate risk is OK' },
      { value: 'high', label: 'Ready for higher risk' },
    ],
  },
  {
    id: 'preferred_location',
    text: 'Where will you operate in the UK?',
    options: [
      { value: 'London', label: 'London' },
      { value: 'Manchester', label: 'Manchester' },
      { value: 'UK-wide', label: 'UK-wide / online' },
    ],
    allowFreeText: true,
  },
]
