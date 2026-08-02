/**
 * Grow in My Current Career — JAZ dynamic questioning + profile sync.
 */

import {
  isJazQuestioningComplete,
  mapJazAnswersToGrowCareerState,
  pickNextJazQuestion,
} from './jaz/jazEngine'
import { domainForGrowField, normalizeGrowFieldSlug, type GrowCareerFieldSlug } from './growCareerGrowthAdvisor'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile } from './types'

/** Grow-career answer keys that do not use the cb_ prefix. */
export const GROW_CAREER_ASSESSMENT_ANSWER_KEYS = ['currentJobTitle', 'coreSkills'] as const

export type GrowCareerAssessmentAnswerKey = (typeof GROW_CAREER_ASSESSMENT_ANSWER_KEYS)[number]

export function isGrowCareerAssessmentAnswerKey(id: string): boolean {
  return (GROW_CAREER_ASSESSMENT_ANSWER_KEYS as readonly string[]).includes(id)
}

/** All structured Career Brain answer keys (including grow-career keys without cb_ prefix). */
export function isCareerBrainStructuredAnswerKey(id: string): boolean {
  return (
    id.startsWith('cb_') ||
    id.startsWith('jaz_') ||
    id.startsWith('si_') ||
    id.startsWith('biz_') ||
    id === 'edu' ||
    id === 'exp' ||
    id === 'rel' ||
    isGrowCareerAssessmentAnswerKey(id)
  )
}

export function describeGrowCareerFlowStep(state: CareerBrainState): string | null {
  if (!isGrowCareerPath(state)) return null
  const pick = pickGrowCareerPathQuestion(state)
  if (pick.question) return pick.question.id
  if (pick.reason.toLowerCase().includes('complete')) return 'complete'
  return pick.reason
}

export function logGrowCareerJobTitleFlow(params: {
  receivedJobTitle: string
  savedJobTitle?: string
  stepBefore: string | null
  stepAfter: string | null
  source: string
}): void {
  console.log('[Grow Career — job title]', {
    receivedJobTitle: params.receivedJobTitle,
    savedJobTitle: params.savedJobTitle ?? '',
    stepBefore: params.stepBefore,
    stepAfter: params.stepAfter,
    source: params.source,
  })
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false
): CareerBrainQuestion {
  return { id, text, type: multi ? 'multi' : 'single', options, allow_free_text: false }
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

export const GROW_CAREER_FIELD_QUESTION = q('cb_grow_field', 'What field do you currently work in?', [
  { value: 'it', label: 'IT' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'administration', label: 'Administration' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'construction', label: 'Construction' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'retail', label: 'Retail' },
  { value: 'creative_media', label: 'Creative & Media' },
  { value: 'other', label: 'Other' },
])

export const GROW_CAREER_JOB_TITLE_QUESTION = qFreeText(
  'currentJobTitle',
  'What is your current job title?',
  'Graphic Designer, Mechanical Engineer, Nurse, Administrator, Software Developer'
)

export const GROW_CAREER_CORE_SKILLS_QUESTION = q(
  'coreSkills',
  'What skills do you use most in your role?',
  [
    { value: 'communication', label: 'Communication' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'project_management', label: 'Project Management' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'technical_skills', label: 'Technical Skills' },
    { value: 'design', label: 'Design' },
    { value: 'coding', label: 'Coding' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'operations', label: 'Operations' },
    { value: 'other', label: 'Other' },
  ],
  true
)

const CORE_SKILL_LABELS: Record<string, string> = {
  communication: 'Communication',
  leadership: 'Leadership',
  project_management: 'Project Management',
  problem_solving: 'Problem Solving',
  technical_skills: 'Technical Skills',
  design: 'Design',
  coding: 'Coding',
  analysis: 'Analysis',
  sales: 'Sales',
  marketing: 'Marketing',
  customer_service: 'Customer Service',
  operations: 'Operations',
  other: 'Other',
}

export const GROW_CAREER_YEARS_QUESTION = q('cb_grow_years', 'How many years of experience do you have?', [
  { value: '0_1', label: 'Less than 1 year' },
  { value: '1_3', label: '1–3 years' },
  { value: '3_5', label: '3–5 years' },
  { value: '5_10', label: '5–10 years' },
  { value: '10_plus', label: '10+ years' },
])

export const GROW_CAREER_LEVEL_QUESTION = q(
  'cb_grow_level',
  'Which best describes your current level?',
  [
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid-Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'team_leader', label: 'Team Leader' },
    { value: 'manager', label: 'Manager' },
  ]
)

export const GROW_CAREER_GOAL_QUESTION = q('cb_grow_goal', 'What is your main goal right now?', [
  { value: 'salary', label: 'Higher salary' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'leadership', label: 'Leadership role' },
  { value: 'specialist', label: 'Become a specialist' },
  { value: 'change_company', label: 'Change company' },
  { value: 'work_life_balance', label: 'Better work-life balance' },
])

export const GROW_CAREER_BLOCKER_QUESTION = q(
  'cb_grow_blocker',
  'What is currently holding you back?',
  [
    { value: 'qualification', label: 'Lack of qualifications' },
    { value: 'uk_exp', label: 'Lack of UK experience' },
    { value: 'technical_skills', label: 'Lack of technical skills' },
    { value: 'leadership_exp', label: 'Lack of leadership experience' },
    { value: 'confidence', label: 'Lack of confidence' },
    { value: 'limited_opportunities', label: 'Limited opportunities in current company' },
    { value: 'weak_cv', label: 'Weak CV / LinkedIn' },
    { value: 'not_sure', label: 'Not sure' },
  ],
  true
)

export const GROW_CAREER_STUDY_QUESTION = q('cb_grow_study_willing', 'Are you willing to invest in learning?', [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
])

export const GROW_CAREER_DEV_TIME_QUESTION = q(
  'cb_grow_dev_time',
  'How much time can you invest in career development?',
  [
    { value: 'under_3_months', label: 'Less than 3 months' },
    { value: '3_12_months', label: '3–12 months' },
    { value: '1_2_years', label: '1–2 years' },
    { value: '2_plus_years', label: '2+ years' },
  ]
)

export const GROW_CAREER_LEADERSHIP_QUESTION = q(
  'cb_grow_leadership_ready',
  'Would you be comfortable taking on more responsibility?',
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'not_sure', label: 'Not sure' },
  ]
)

export const GROW_CAREER_EMPLOYER_CHANGE_QUESTION = q(
  'cb_grow_employer_change',
  'Would you change employer if it accelerated your career growth?',
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'maybe', label: 'Maybe' },
  ]
)

const FIELD_LABELS: Record<string, string> = {
  it: 'IT',
  engineering: 'Engineering',
  healthcare: 'Healthcare',
  education: 'Education',
  customer_service: 'Customer Service',
  administration: 'Administration',
  finance: 'Finance',
  marketing: 'Marketing',
  construction: 'Construction',
  logistics: 'Logistics',
  hospitality: 'Hospitality',
  retail: 'Retail',
  creative_media: 'Creative & Media',
  other: 'Other',
}

const LEVEL_LABELS: Record<string, string> = {
  entry: 'Entry Level',
  junior: 'Junior',
  mid: 'Mid-Level',
  senior: 'Senior',
  team_leader: 'Team Leader',
  manager: 'Manager',
}

const GOAL_LABELS: Record<string, string> = {
  salary: 'higher salary',
  promotion: 'promotion',
  leadership: 'a leadership role',
  specialist: 'becoming a specialist',
  change_company: 'changing company',
  work_life_balance: 'better work-life balance',
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  if (Array.isArray(a) && a.length === 0) return false
  return true
}

export function isGrowCareerPath(state: CareerBrainState): boolean {
  return String(answers(state).cb_user_goal ?? '') === 'grow_career'
}

export function isGrowCareerPathComplete(state: CareerBrainState): boolean {
  if (!isGrowCareerPath(state)) return false
  return isJazQuestioningComplete(state)
}

export function pickGrowCareerPathQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!isGrowCareerPath(state)) {
    return { question: null, reason: 'Not grow career path' }
  }
  const pick = pickNextJazQuestion(state)
  return { question: pick.question, reason: pick.reason }
}

export function prepareGrowCareerStateForResults(state: CareerBrainState): CareerBrainState {
  if (!isGrowCareerPath(state)) return state
  return mapJazAnswersToGrowCareerState(state)
}

export function resolveGrowCareerCurrentJobTitle(state: CareerBrainState): string {
  const raw = String(
    answers(state).currentJobTitle ??
      answers(state).jaz_job_title ??
      answers(state).cb_grow_job_title ??
      ''
  ).trim()
  return raw || 'Professional'
}

/** Accept any non-empty trimmed job title — no clarification pass. */
export function normalizeGrowCareerJobTitleInput(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

export function saveGrowCareerJobTitle(
  state: CareerBrainState,
  rawTitle: unknown,
  source: string
): CareerBrainState {
  const stepBefore = describeGrowCareerFlowStep(state)
  const received = String(rawTitle ?? '').trim()
  const normalized = normalizeGrowCareerJobTitleInput(rawTitle)

  logGrowCareerJobTitleFlow({
    receivedJobTitle: received,
    savedJobTitle: normalized ?? '',
    stepBefore,
    stepAfter: stepBefore,
    source: `${source}:received`,
  })

  if (!normalized) {
    return state
  }

  const next: CareerBrainState = {
    ...state,
    answers: {
      ...(state.answers ?? {}),
      currentJobTitle: normalized,
    },
  }

  const stepAfter = describeGrowCareerFlowStep(next)
  logGrowCareerJobTitleFlow({
    receivedJobTitle: received,
    savedJobTitle: normalized,
    stepBefore,
    stepAfter,
    source: `${source}:saved`,
  })

  return next
}

export function getGrowCareerCoreSkills(state: CareerBrainState): string[] {
  const raw = answers(state).coreSkills ?? answers(state).jaz_strengths ?? answers(state).cb_grow_core_skills
  if (Array.isArray(raw)) {
    return raw.map((v) => CORE_SKILL_LABELS[String(v)] ?? String(v)).filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [CORE_SKILL_LABELS[raw] ?? raw]
  }
  return []
}

export function resolveGrowCareerField(state: CareerBrainState): string {
  const raw = String(answers(state).cb_grow_field ?? '').trim()
  if (raw === 'other') {
    return String(answers(state).cb_grow_field_other ?? 'Other').trim() || 'Other'
  }
  return FIELD_LABELS[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function resolveGrowCareerFieldSlug(state: CareerBrainState): string {
  const raw = String(answers(state).cb_grow_field ?? 'other').trim()
  if (raw && raw !== 'other') return raw
  const text = resolveGrowCareerField(state).toLowerCase()
  if (/it|tech|software|digital/.test(text)) return 'it'
  if (/engineer/.test(text)) return 'engineering'
  if (/health|care|nurs/.test(text)) return 'healthcare'
  if (/teach|education/.test(text)) return 'education'
  if (/customer|call centre|contact/.test(text)) return 'customer_service'
  if (/admin|office/.test(text)) return 'administration'
  if (/finance|account/.test(text)) return 'finance'
  if (/market/.test(text)) return 'marketing'
  if (/construct|trade|build/.test(text)) return 'construction'
  if (/logistic|warehouse|transport/.test(text)) return 'logistics'
  if (/hospitality|hotel|restaurant/.test(text)) return 'hospitality'
  if (/retail|shop/.test(text)) return 'retail'
  if (/creative|media|design/.test(text)) return 'creative_media'
  return 'other'
}

export function getGrowCareerBlockers(state: CareerBrainState): string[] {
  const raw = answers(state).cb_grow_blocker
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string' && raw.trim()) return [raw]
  return []
}

export function labelGrowCareerExperienceYears(state: CareerBrainState): string {
  const bands: Record<string, string> = {
    '0_1': 'less than 1 year',
    '1_3': '1–3 years',
    '3_5': '3–5 years',
    '5_10': '5–10 years',
    '10_plus': '10+ years',
    '1_2': '1–2 years',
    '6_10': '6–10 years',
  }
  return bands[String(answers(state).cb_grow_years ?? '')] ?? 'several years'
}

export function labelGrowCareerLevel(state: CareerBrainState): string {
  return LEVEL_LABELS[String(answers(state).cb_grow_level ?? '')] ?? 'Mid-Level'
}

export function labelGrowCareerGoal(state: CareerBrainState): string {
  return GOAL_LABELS[String(answers(state).cb_grow_goal ?? '')] ?? 'career progression'
}

export function isGrowCareerStudyWilling(state: CareerBrainState): boolean {
  return String(answers(state).cb_grow_study_willing ?? '') === 'yes'
}

export function applyGrowCareerPathToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  if (!isGrowCareerPath(state)) return profile

  const field = resolveGrowCareerField(state)
  const jobTitle = resolveGrowCareerCurrentJobTitle(state)
  const yearsMap: Record<string, number> = {
    '0_1': 1,
    '1_3': 2,
    '3_5': 4,
    '5_10': 7,
    '10_plus': 12,
    '1_2': 2,
    '6_10': 8,
  }
  const yearsBand = String(answers(state).cb_grow_years ?? '')
  const constraints = new Set(profile.constraints)
  if (isGrowCareerPathComplete(state)) {
    constraints.add('grow-career-path')
    constraints.add('employed-growth')
    constraints.delete('unemployed-path')
    constraints.delete('pathway-deterministic-locked')
  }

  return {
    ...profile,
    workExperienceField: jobTitle ? `${jobTitle} (${field})` : field || profile.workExperienceField,
    studyField: profile.studyField ?? field,
    detectedRoles: jobTitle ? [...new Set([...profile.detectedRoles, jobTitle])] : profile.detectedRoles,
    toolsAndSkills: [...new Set([...profile.toolsAndSkills, ...getGrowCareerCoreSkills(state)])],
    yearsOfExperience: yearsMap[yearsBand] ?? profile.yearsOfExperience,
    wantsSameField: true,
    wantsCareerChange: false,
    domain: domainForGrowField(normalizeGrowFieldSlug(state) as GrowCareerFieldSlug),
    constraints: [...constraints],
  }
}

export function buildGrowCareerPathReasoning(profile: CareerProfile, state: CareerBrainState): string[] {
  if (!isGrowCareerPath(state)) return []
  const lines = [
    `Grow career path: ${resolveGrowCareerCurrentJobTitle(state)} in ${resolveGrowCareerField(state)} (${labelGrowCareerLevel(state)}).`,
    `Experience: ${labelGrowCareerExperienceYears(state)}; goal: ${labelGrowCareerGoal(state)}.`,
  ]
  const skills = getGrowCareerCoreSkills(state)
  if (skills.length) lines.push(`Core skills: ${skills.join(', ')}.`)
  const blockers = getGrowCareerBlockers(state)
  if (blockers.length) lines.push(`Barriers flagged: ${blockers.join(', ')}.`)
  if (profile.constraints.includes('grow-career-path')) {
    lines.push('Dynamic progression inferred from current job title — same-profession growth plan.')
  }
  return lines
}
