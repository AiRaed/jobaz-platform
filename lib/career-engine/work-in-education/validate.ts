/**
 * Server-side validation for WorkInEducationProfile.
 */

import type {
  EducationLevel,
  GraduationStatus,
  LanguageLevel,
  RegistrationScope,
  RegistrationStatus,
  WorkInEducationProfile,
} from './types'

const EDUCATION_LEVELS: EducationLevel[] = [
  'college',
  'bachelor',
  'master',
  'doctorate',
  'professional',
  'other',
]
const GRAD_STATUSES: GraduationStatus[] = ['completed', 'studying', 'incomplete']
const REG_STATUSES: RegistrationStatus[] = ['registered', 'pending', 'expired', 'none']
const REG_SCOPES: RegistrationScope[] = [
  'adult_nursing',
  'mental_health_nursing',
  'childrens_nursing',
  'learning_disability_nursing',
  'midwifery',
  'nursing_associate',
  'unknown',
]
const LANG_LEVELS: LanguageLevel[] = [
  'basic',
  'conversational',
  'professional',
  'fluent',
  'native',
]

export type ValidationResult =
  | { ok: true; profile: WorkInEducationProfile }
  | { ok: false; errors: string[] }

function asString(v: unknown, max = 300): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t) return null
  return t.slice(0, max)
}

function asBoolOrNull(v: unknown): boolean | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'boolean') return v
  return null
}

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return null
  return n
}

export function validateWorkInEducationProfile(input: unknown): ValidationResult {
  const errors: string[] = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['Profile must be an object'] }
  }
  const raw = input as Record<string, unknown>

  const education_level = asString(raw.education_level, 40) as EducationLevel | null
  if (!education_level || !EDUCATION_LEVELS.includes(education_level)) {
    errors.push(`education_level must be one of: ${EDUCATION_LEVELS.join(', ')}`)
  }

  const qualification_title = asString(raw.qualification_title, 240)
  if (!qualification_title) errors.push('qualification_title is required')

  const subject = asString(raw.subject, 240)
  // subject may be empty → clarification path, but still accept with warning path
  const subjectValue = subject ?? ''

  if (errors.length) return { ok: false, errors }

  const graduation_status_raw = asString(raw.graduation_status, 40)
  let graduation_status: GraduationStatus = 'completed'
  if (graduation_status_raw) {
    if (!GRAD_STATUSES.includes(graduation_status_raw as GraduationStatus)) {
      errors.push(`graduation_status must be one of: ${GRAD_STATUSES.join(', ')}`)
    } else {
      graduation_status = graduation_status_raw as GraduationStatus
    }
  }

  const years = asNumberOrNull(raw.years_relevant_experience)
  if (raw.years_relevant_experience !== undefined && years === null) {
    errors.push('years_relevant_experience must be a number')
  }
  if (years !== null && (years < 0 || years > 60)) {
    errors.push('years_relevant_experience must be between 0 and 60')
  }

  const graduation_year = asNumberOrNull(raw.graduation_year)
  if (raw.graduation_year !== undefined && raw.graduation_year !== null && graduation_year === null) {
    errors.push('graduation_year must be a number or null')
  }

  const professional_registration: WorkInEducationProfile['professional_registration'] = []
  if (raw.professional_registration !== undefined) {
    if (!Array.isArray(raw.professional_registration)) {
      errors.push('professional_registration must be an array')
    } else if (raw.professional_registration.length > 20) {
      errors.push('professional_registration max 20 entries')
    } else {
      for (const item of raw.professional_registration) {
        if (!item || typeof item !== 'object') {
          errors.push('professional_registration entries must be objects')
          continue
        }
        const row = item as Record<string, unknown>
        const body = asString(row.body, 120)
        const status = asString(row.status, 40) as RegistrationStatus | null
        if (!body || !status || !REG_STATUSES.includes(status)) {
          errors.push('professional_registration entries need body + valid status')
          continue
        }
        const scopeRaw = asString(row.registration_scope, 60) as RegistrationScope | null
        let registration_scope: RegistrationScope | null | undefined
        if (scopeRaw) {
          if (!REG_SCOPES.includes(scopeRaw)) {
            errors.push(`registration_scope must be one of: ${REG_SCOPES.join(', ')}`)
            continue
          }
          registration_scope = scopeRaw
        }
        // Accept but never require registration_number; do not persist into logs elsewhere
        professional_registration.push({
          body,
          status,
          registration_scope: registration_scope ?? null,
          registration_number: null,
        })
      }
    }
  }

  const languages: WorkInEducationProfile['languages'] = []
  if (raw.languages !== undefined) {
    if (!Array.isArray(raw.languages)) {
      errors.push('languages must be an array')
    } else if (raw.languages.length > 30) {
      errors.push('languages max 30 entries')
    } else {
      for (const item of raw.languages) {
        if (!item || typeof item !== 'object') continue
        const row = item as Record<string, unknown>
        const language = asString(row.language, 80)
        const level = asString(row.level, 40) as LanguageLevel | null
        if (!language || !level || !LANG_LEVELS.includes(level)) {
          errors.push('languages entries need language + valid level')
          continue
        }
        languages.push({ language, level })
      }
    }
  }

  const licences = Array.isArray(raw.licences)
    ? raw.licences.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean).slice(0, 30)
    : []
  const skills = Array.isArray(raw.skills)
    ? raw.skills.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean).slice(0, 50)
    : []

  let career_preferences: WorkInEducationProfile['career_preferences']
  if (raw.career_preferences !== undefined) {
    if (!raw.career_preferences || typeof raw.career_preferences !== 'object') {
      errors.push('career_preferences must be an object')
    } else {
      const p = raw.career_preferences as Record<string, unknown>
      career_preferences = {
        wants_academic_route: asBoolOrNull(p.wants_academic_route),
        wants_related_field_only: asBoolOrNull(p.wants_related_field_only),
        open_to_retraining: asBoolOrNull(p.open_to_retraining),
        preferred_work_types: Array.isArray(p.preferred_work_types)
          ? p.preferred_work_types.filter((x): x is string => typeof x === 'string').slice(0, 20)
          : [],
        preferred_locations: Array.isArray(p.preferred_locations)
          ? p.preferred_locations.filter((x): x is string => typeof x === 'string').slice(0, 20)
          : [],
      }
    }
  }

  if (errors.length) return { ok: false, errors }

  const profile: WorkInEducationProfile = {
    education_level: education_level!,
    qualification_title: qualification_title!,
    subject: subjectValue,
    specialisation: asString(raw.specialisation, 240),
    institution_country: asString(raw.institution_country, 80),
    qualification_country: asString(raw.qualification_country, 80),
    graduation_status,
    graduation_year,
    years_relevant_experience: years ?? 0,
    current_job_title: asString(raw.current_job_title, 160),
    has_uk_experience: asBoolOrNull(raw.has_uk_experience),
    professional_registration,
    licences,
    skills,
    languages,
    english_level: asString(raw.english_level, 40),
    career_preferences,
  }

  return { ok: true, profile }
}
