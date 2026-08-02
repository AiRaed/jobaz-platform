export interface AssessmentOption {
  value: string
  label: string
}

import type { AssessmentAnswers } from '@/lib/jobaz-ai'

export interface AssessmentQuestion {
  id: keyof AssessmentAnswers
  text: string
  options: AssessmentOption[]
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'situation',
    text: 'What best describes your situation?',
    options: [
      { value: 'need_job_quickly', label: 'I need a job quickly' },
      { value: 'better_job', label: 'I want a better job' },
      { value: 'no_uk_experience', label: 'I have no UK experience' },
      { value: 'limited_english', label: 'My English is limited' },
      { value: 'change_career', label: 'I want to change career' },
    ],
  },
  {
    id: 'experience',
    text: 'Do you have work experience?',
    options: [
      { value: 'none', label: 'No experience' },
      { value: 'some', label: 'Some experience' },
      { value: 'strong', label: 'Strong experience' },
      { value: 'outside_uk', label: 'Experience outside the UK' },
    ],
  },
  {
    id: 'english',
    text: 'What is your English level?',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'basic', label: 'Basic' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'good', label: 'Good' },
    ],
  },
  {
    id: 'cv',
    text: 'Do you already have a CV?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'needs_improvement', label: 'I have one but it needs improvement' },
    ],
  },
  {
    id: 'helpNext',
    text: 'What do you want help with next?',
    options: [
      { value: 'find_jobs', label: 'Find jobs' },
      { value: 'build_cv', label: 'Build my CV' },
      { value: 'improve_skills', label: 'Improve my skills' },
      { value: 'interviews', label: 'Prepare for interviews' },
      { value: 'understand_options', label: 'Understand my options' },
    ],
  },
]
