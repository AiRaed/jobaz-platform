/**
 * Student experience signals — category, intent, employability bridges.
 */

import type { CareerBrainState, CareerProfile } from './types'

export type ExperienceCategory =
  | 'retail'
  | 'hospitality'
  | 'customer_service'
  | 'warehouse'
  | 'delivery'
  | 'office_admin'
  | 'social_media'
  | 'design'
  | 'freelance'
  | 'care'
  | 'it_technology'
  | 'other'
  | 'unknown'

const KNOWN_EXPERIENCE_VALUES: ExperienceCategory[] = [
  'retail',
  'hospitality',
  'customer_service',
  'warehouse',
  'delivery',
  'office_admin',
  'social_media',
  'design',
  'freelance',
  'care',
  'it_technology',
  'other',
]

export type StudentExperienceSignals = {
  previousExperience: string
  experienceCategory: ExperienceCategory
  experienceIntent: string
  wantsContinueExperience: boolean
  wantsDifferentDirection: boolean
  employabilitySignals: string[]
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

export function studentHasSomeExperience(state: CareerBrainState): boolean {
  const v = String(answers(state).cb_experience_level ?? '')
  return v === 'have_experience' || v === 'some_experience' || v === 'small_basic' || v === 'experienced'
}

export function getStudentExperienceRaw(state: CareerBrainState): string {
  const type = answers(state).cb_student_experience_type
  const prior = answers(state).cb_student_prior_work
  if (Array.isArray(type)) return [...type, prior].filter(Boolean).join(', ')
  return String(type ?? prior ?? '').trim()
}

export function getSelectedExperienceCategories(state: CareerBrainState): string[] {
  const type = answers(state).cb_student_experience_type
  if (Array.isArray(type)) return type.map(String).filter(Boolean)
  if (type) return [String(type)]
  return []
}

export function resolvePrimaryExperienceCategory(
  raw: string,
  selected: string[] = []
): ExperienceCategory {
  if (selected.includes('it_technology')) return 'it_technology'
  if (selected.length === 1 && KNOWN_EXPERIENCE_VALUES.includes(selected[0] as ExperienceCategory)) {
    return selected[0] as ExperienceCategory
  }
  if (selected.length > 1) {
    const fromSelected = inferExperienceCategory(selected.join(', '))
    if (fromSelected !== 'other' && fromSelected !== 'unknown') return fromSelected
  }
  return inferExperienceCategory(raw)
}

export function inferExperienceCategory(raw: string): ExperienceCategory {
  const t = raw.toLowerCase()
  if (/\bit_technology\b/.test(t)) return 'it_technology'
  if (
    /software|developer|programming|web\s*dev|it\s*support|helpdesk|help\s*desk|cyber|networking|\bqa\b|quality\s*assurance|tech\s*support|technical\s*support|cybersecurity|computing|\bit\b|technology/.test(
      t
    )
  ) {
    return 'it_technology'
  }
  if (/retail|shop|store|supermarket|tesco|sainsbury|asda/.test(t)) return 'retail'
  if (/hospitality|barista|waiter|waitress|kitchen|cafe|restaurant|hotel/.test(t)) {
    return 'hospitality'
  }
  if (/customer\s*service|call\s*centre|support|reception/.test(t)) return 'customer_service'
  if (/warehouse|picker|packer|logistics/.test(t)) return 'warehouse'
  if (/delivery|courier|driver|uber|deliveroo/.test(t)) return 'delivery'
  if (/office|admin|data\s*entry|clerical/.test(t)) return 'office_admin'
  if (/social\s*media|content|instagram|tiktok|community/.test(t)) return 'social_media'
  if (/design|graphic|creative|animation|video|edit/.test(t)) return 'design'
  if (/freelance|self.?employed|gig/.test(t)) return 'freelance'
  if (/care|support\s*worker|carer|nursing\s*home/.test(t)) return 'care'
  if (t.trim()) return 'other'
  return 'unknown'
}

export function getStudentExperienceIntent(state: CareerBrainState): string {
  return String(answers(state).cb_student_continue_experience ?? '')
}

export function buildStudentExperienceSignals(state: CareerBrainState): StudentExperienceSignals {
  const raw = getStudentExperienceRaw(state)
  const selected = getSelectedExperienceCategories(state)
  const category = resolvePrimaryExperienceCategory(raw, selected)
  const intent = getStudentExperienceIntent(state)
  const wantsContinueExperience = intent.includes('yes_continue')
  const wantsDifferentDirection =
    intent.includes('no_different') || intent.includes('different')

  const employabilitySignals: string[] = []
  if (category === 'retail' || category === 'hospitality' || category === 'customer_service') {
    employabilitySignals.push('customer-facing', 'communication', 'teamwork')
  }
  if (category === 'warehouse' || category === 'delivery') {
    employabilitySignals.push('physical-stamina', 'reliability')
  }
  if (category === 'office_admin') {
    employabilitySignals.push('organisation', 'computer-basics')
  }
  if (category === 'social_media' || category === 'design') {
    employabilitySignals.push('digital-skills', 'creative-output')
  }
  if (category === 'care') {
    employabilitySignals.push('empathy', 'communication')
  }
  if (category === 'it_technology') {
    employabilitySignals.push('technical-support', 'troubleshooting', 'digital-literacy')
  }
  if (wantsContinueExperience) employabilitySignals.push('experience-momentum')
  if (wantsDifferentDirection) employabilitySignals.push('career-pivot')

  return {
    previousExperience: raw,
    experienceCategory: category,
    experienceIntent: intent,
    wantsContinueExperience,
    wantsDifferentDirection,
    employabilitySignals,
  }
}

export function applyStudentExperienceToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  if (!studentHasSomeExperience(state)) return profile

  const signals = buildStudentExperienceSignals(state)
  const next = { ...profile }

  if (signals.previousExperience) {
    next.workExperienceField = signals.previousExperience
    next.yearsOfExperience = Math.max(next.yearsOfExperience ?? 0, 1)
  }

  next.transferableSkills = [
    ...new Set([...next.transferableSkills, ...signals.employabilitySignals]),
  ]

  const expConstraints = getSelectedExperienceCategories(state)
    .filter((v) => KNOWN_EXPERIENCE_VALUES.includes(v as ExperienceCategory))
    .map((v) => `exp-${v}`)
  if (!expConstraints.length) expConstraints.push(`exp-${signals.experienceCategory}`)

  next.constraints = [
    ...new Set([
      ...next.constraints,
      ...expConstraints,
      signals.wantsContinueExperience ? 'student-continue-exp' : '',
      signals.wantsDifferentDirection ? 'student-pivot-exp' : '',
    ].filter(Boolean)),
  ]

  const anyJob = String(state.answers?.cb_student_work_intent ?? '').includes('any_job')
  if (signals.wantsContinueExperience && !anyJob) {
    next.wantsSameField = next.wantsSameField ?? true
  }
  if (signals.wantsDifferentDirection) {
    next.wantsCareerChange = true
  }

  next.confidence = Math.min(1, next.confidence + 0.12)

  return next
}
