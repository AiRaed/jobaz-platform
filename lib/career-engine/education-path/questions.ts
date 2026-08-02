import type { EducationFieldId, EducationPathAnswers } from './types'

export type EducationPathQuestion = {
  id: keyof EducationPathAnswers
  text: string
  options: Array<{ value: string; label: string }>
  allowFreeText?: boolean
}

/** Step 1 — broad education sector */
export const EDUCATION_FIELD_QUESTION: EducationPathQuestion = {
  id: 'education_field',
  text: 'What did you study?',
  options: [
    { value: 'engineering', label: 'Engineering' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'business_finance', label: 'Business & Finance' },
    { value: 'it', label: 'IT & Technology' },
    { value: 'education', label: 'Education & Teaching' },
    { value: 'law', label: 'Law' },
    { value: 'science', label: 'Science & Laboratory' },
    { value: 'creative_arts', label: 'Creative & Design' },
    { value: 'media_communications', label: 'Media & Communications' },
    { value: 'construction', label: 'Construction & Trades' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'social_care', label: 'Social Care' },
    { value: 'logistics_transport', label: 'Logistics & Transport' },
    { value: 'public_sector', label: 'Public Sector' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'property_real_estate', label: 'Property & Real Estate' },
    { value: 'other', label: 'Other' },
  ],
}

/** Steps 3+ after field + specialisation */
export const EDUCATION_PATH_FOLLOWUP_QUESTIONS: EducationPathQuestion[] = [
  {
    id: 'qualification_origin',
    text: 'Where did you get your qualification?',
    options: [
      { value: 'uk', label: 'UK' },
      { value: 'outside_uk', label: 'Outside the UK' },
    ],
  },
  {
    id: 'qualification_level',
    text: 'What is your highest qualification?',
    options: [
      { value: 'bachelors', label: "Bachelor's" },
      { value: 'masters', label: "Master's" },
      { value: 'phd', label: 'PhD' },
    ],
  },
  {
    id: 'english_level',
    text: 'What is your English level?',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'basic', label: 'Basic' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'good', label: 'Good' },
      { value: 'fluent', label: 'Fluent' },
    ],
  },
  {
    id: 'open_to_courses',
    text: 'Are you willing to take additional UK courses or professional certifications?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'preferred_location',
    text: 'Preferred location for job search',
    options: [
      { value: 'London', label: 'London' },
      { value: 'Manchester', label: 'Manchester' },
      { value: 'Birmingham', label: 'Birmingham' },
      { value: 'Leeds', label: 'Leeds' },
      { value: 'Glasgow', label: 'Glasgow' },
      { value: 'UK-wide', label: 'UK-wide' },
    ],
    allowFreeText: true,
  },
]

/** Step 2 — profession within the selected field (options resolved at runtime) */
export const EDUCATION_SPECIALISATION_QUESTION: EducationPathQuestion = {
  id: 'education_specialisation',
  text: 'What was your specialisation?',
  options: [],
  allowFreeText: true,
}

/** @deprecated use EDUCATION_FIELD_QUESTION + EDUCATION_PATH_FOLLOWUP_QUESTIONS */
export const EDUCATION_PATH_QUESTIONS: EducationPathQuestion[] = [
  EDUCATION_FIELD_QUESTION,
  EDUCATION_SPECIALISATION_QUESTION,
  ...EDUCATION_PATH_FOLLOWUP_QUESTIONS,
]

export const EDUCATION_PATH_TOTAL_STEPS =
  2 + EDUCATION_PATH_FOLLOWUP_QUESTIONS.length

export const EDUCATION_PATH_GOAL = 'work_in_education' as const
