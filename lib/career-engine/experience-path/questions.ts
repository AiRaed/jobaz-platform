import type { ExperiencePathAnswers } from './types'

export type ExperiencePathQuestion = {
  id: keyof ExperiencePathAnswers
  text: string
  options: Array<{ value: string; label: string }>
  allowFreeText?: boolean
}

/** Step 1 — broad industry (parent category only) */
export const EXPERIENCE_INDUSTRY_QUESTION: ExperiencePathQuestion = {
  id: 'industry',
  text: 'What industry is most of your experience in?',
  options: [
    { value: 'driving_transport', label: 'Driving & Transport' },
    { value: 'healthcare', label: 'Healthcare & Care' },
    { value: 'software_developer', label: 'Software / IT Development' },
    { value: 'construction', label: 'Construction' },
    { value: 'electrician', label: 'Electrical / Trades' },
    { value: 'warehouse_logistics', label: 'Warehouse & Logistics' },
    { value: 'security', label: 'Security' },
    { value: 'chef', label: 'Hospitality Kitchen' },
    { value: 'hospitality', label: 'Hospitality Front of House' },
    { value: 'sales', label: 'Sales & Business Development' },
    { value: 'office_admin', label: 'Office & Administration' },
    { value: 'accountant', label: 'Accounting & Finance' },
    { value: 'manufacturing_engineering', label: 'Manufacturing & Engineering' },
    { value: 'customer_service', label: 'Customer Service & Call Centre' },
    { value: 'marketing_digital', label: 'Marketing & Digital Marketing' },
    { value: 'education_teaching', label: 'Education & Teaching' },
    { value: 'hr_recruitment', label: 'HR & Recruitment' },
    { value: 'cleaning_facilities', label: 'Cleaning & Facilities' },
    { value: 'other', label: 'Other' },
  ],
}

/** Step 2 — job title / specialisation (options resolved at runtime) */
export const EXPERIENCE_SPECIALISATION_QUESTION: ExperiencePathQuestion = {
  id: 'experience_specialisation',
  text: 'What was your most recent job title or specialisation?',
  options: [],
  allowFreeText: true,
}

/** Steps 3+ after industry + specialisation */
export const EXPERIENCE_PATH_FOLLOWUP_QUESTIONS: ExperiencePathQuestion[] = [
  {
    id: 'years_experience',
    text: 'How many years of work experience do you have?',
    options: [
      { value: '1_2', label: '1–2 years' },
      { value: '3_5', label: '3–5 years' },
      { value: '6_10', label: '6–10 years' },
      { value: '10_plus', label: '10+ years' },
    ],
  },
  {
    id: 'highest_position',
    text: 'What was your highest or most recent position level?',
    options: [
      { value: 'skilled_worker', label: 'Skilled worker / operative' },
      { value: 'senior_specialist', label: 'Senior specialist / team lead' },
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'manager', label: 'Manager' },
      { value: 'director', label: 'Director / head of department' },
    ],
  },
  {
    id: 'experience_country',
    text: 'Where did you gain most of your experience?',
    options: [
      { value: 'uk', label: 'United Kingdom' },
      { value: 'outside_uk', label: 'Outside the UK' },
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
    id: 'uk_work_experience',
    text: 'Do you already have UK work experience?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'management_experience',
    text: 'Do you have supervisory or management experience?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'open_to_certifications',
    text: 'Are you willing to complete UK professional certifications if required?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'driving_licence',
    text: 'Do you hold a valid UK driving licence? (if relevant to your role)',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not_applicable', label: 'Not applicable' },
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

export const EXPERIENCE_PATH_QUESTIONS: ExperiencePathQuestion[] = [
  EXPERIENCE_INDUSTRY_QUESTION,
  EXPERIENCE_SPECIALISATION_QUESTION,
  ...EXPERIENCE_PATH_FOLLOWUP_QUESTIONS,
]

export const EXPERIENCE_PATH_TOTAL_STEPS =
  2 + EXPERIENCE_PATH_FOLLOWUP_QUESTIONS.length

export const EXPERIENCE_PATH_GOAL = 'work_in_experience' as const
