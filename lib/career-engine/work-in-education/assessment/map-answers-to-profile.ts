/**
 * Deterministic answer → WorkInEducationProfile mapper (no LLM, no matching).
 */

import {
  resolveNormalizedQualification,
  type NormalizedQualification,
} from '@/lib/career-engine/qualification-taxonomy'
import type {
  EducationLevel,
  GraduationStatus,
  LanguageLevel,
  ProfessionalRegistrationInput,
  RegistrationScope,
  RegistrationStatus,
  WorkInEducationProfile,
} from '../types'
import type {
  MappingProvenance,
  ProfileMappingResult,
  WorkInEducationAssessmentAnswers,
} from './types'

function trimStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()
}

function parseYears(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.min(60, Math.floor(v)))
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return Math.max(0, Math.min(60, Math.floor(n)))
  }
  return 0
}

function parseYear(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return null
  const y = Math.floor(n)
  if (y < 1950 || y > 2040) return null
  return y
}

function normaliseCountry(raw: string): string {
  const c = raw.trim()
  const lower = c.toLowerCase()
  if (
    [
      'uk',
      'gb',
      'great britain',
      'united kingdom',
      'england',
      'scotland',
      'wales',
      'northern ireland',
    ].includes(lower)
  ) {
    return 'United Kingdom'
  }
  return c
}

function yesNoUnsure(v: unknown): boolean | null {
  if (v === true || v === 'yes') return true
  if (v === false || v === 'no') return false
  if (v === 'unsure' || v == null || v === '') return null
  return null
}

function mapRegStatus(raw: string): RegistrationStatus {
  const s = raw.toLowerCase()
  if (s === 'registered' || s === 'active') return 'registered'
  if (s === 'pending' || s === 'in_progress') return 'pending'
  if (s === 'expired') return 'expired'
  return 'none'
}

function mapRegScope(raw: string): RegistrationScope | null {
  const allowed: RegistrationScope[] = [
    'adult_nursing',
    'mental_health_nursing',
    'childrens_nursing',
    'learning_disability_nursing',
    'midwifery',
    'nursing_associate',
    'unknown',
  ]
  return (allowed as string[]).includes(raw) ? (raw as RegistrationScope) : raw ? 'unknown' : null
}

function mapEnglish(raw: string): LanguageLevel | string | null {
  const s = raw.toLowerCase()
  if (['basic', 'conversational', 'professional', 'fluent', 'native'].includes(s)) return s
  return raw || null
}

function asStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map((x) => trimStr(x)).filter(Boolean)
  }
  if (typeof v === 'string' && v.trim()) {
    return v.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function resolveQualificationFromAnswers(
  answers: WorkInEducationAssessmentAnswers
): NormalizedQualification {
  const equivalence =
    trimStr(answers.equivalence_status) ||
    (answers.uk_recognition_confirmed === 'yes'
      ? 'confirmed'
      : answers.uk_recognition_confirmed === 'no'
        ? 'not_confirmed'
        : answers.uk_recognition_confirmed === 'unsure'
          ? 'unsure'
          : '')

  return resolveNormalizedQualification({
    qualification_group: trimStr(answers.qualification_group) || null,
    qualification_type: trimStr(answers.qualification_type) || null,
    education_level: trimStr(answers.education_level) || null,
    qualification_title: trimStr(answers.qualification_title) || null,
    qualification_country: trimStr(answers.qualification_country) || null,
    equivalence_status: equivalence || null,
    uk_recognition_confirmed: trimStr(answers.uk_recognition_confirmed) || null,
  })
}

export function mapWorkInEducationAnswersToProfile(
  answers: WorkInEducationAssessmentAnswers
): ProfileMappingResult {
  const warnings: string[] = []
  const provenance: MappingProvenance[] = []
  const push = (answer_key: string, profile_path: string, transformation: string) => {
    provenance.push({ answer_key, profile_path, transformation })
  }

  const qualification = resolveQualificationFromAnswers(answers)
  const education_level = qualification.education_level_legacy as EducationLevel
  push(
    'qualification_group|qualification_type|education_level',
    'education_level',
    `taxonomy ${qualification.group}/${qualification.type} → ${education_level} (uk:${qualification.uk_level})`
  )
  push('qualification_*', 'qualification', 'resolveNormalizedQualification')

  const qualification_title = trimStr(answers.qualification_title)
  push('qualification_title', 'qualification_title', 'trim')

  const subject = trimStr(answers.subject)
  push('subject', 'subject', 'trim')

  const specialisation = trimStr(answers.specialisation) || null
  push('specialisation', 'specialisation', specialisation ? 'trim' : 'blank→null')

  const qualification_country = normaliseCountry(trimStr(answers.qualification_country))
  push('qualification_country', 'qualification_country', 'trim+normalise_country')

  const graduation_status = (trimStr(answers.graduation_status) || 'completed') as GraduationStatus
  if (!['completed', 'studying', 'incomplete'].includes(graduation_status)) {
    warnings.push(`Unknown graduation_status; defaulting to completed`)
  }
  push('graduation_status', 'graduation_status', 'passthrough_or_default_completed')

  const graduation_year = parseYear(answers.graduation_year)
  push('graduation_year', 'graduation_year', graduation_year == null ? 'blank→null' : 'parse_year')

  const years_relevant_experience = parseYears(answers.years_relevant_experience)
  push('years_relevant_experience', 'years_relevant_experience', 'parse_years')

  const current_job_title = trimStr(answers.current_job_title) || null
  push('current_job_title', 'current_job_title', current_job_title ? 'trim' : 'blank→null')

  const has_uk_experience = yesNoUnsure(answers.has_uk_experience)
  push('has_uk_experience', 'has_uk_experience', 'yes_no_unsure→boolean|null')

  const professional_registration: ProfessionalRegistrationInput[] = []
  const reg = answers.registration
  const hasReg = yesNoUnsure(reg?.has_registration)
  const engReg = trimStr(answers.engineering_registration)
  const qts = trimStr(answers.qts_status)

  if (hasReg === true || (reg?.body && trimStr(reg.body))) {
    const body = trimStr(reg?.body) || 'unknown'
    const status = mapRegStatus(trimStr(reg?.status) || (hasReg === true ? 'registered' : 'none'))
    const scope = mapRegScope(trimStr(reg?.scope))
    professional_registration.push({
      body,
      status,
      registration_scope: scope,
    })
    push('registration', 'professional_registration[0]', 'registration_object→array')
  }

  if (engReg && engReg !== 'none' && engReg !== 'unknown') {
    const bodyMap: Record<string, string> = {
      ceng: 'Engineering Council (CEng)',
      ieng: 'Engineering Council (IEng)',
      engtech: 'Engineering Council (EngTech)',
    }
    professional_registration.push({
      body: bodyMap[engReg.toLowerCase()] ?? engReg,
      status: 'registered',
    })
    push('engineering_registration', 'professional_registration', `eng_reg ${engReg}`)
  }

  if (qts === 'yes') {
    professional_registration.push({
      body: 'QTS',
      status: 'registered',
    })
    push('qts_status', 'professional_registration', 'qts=yes→QTS registered')
  } else if (qts === 'working_towards') {
    professional_registration.push({
      body: 'QTS',
      status: 'pending',
    })
    push('qts_status', 'professional_registration', 'qts=working_towards→QTS pending')
  }

  if (
    (qualification.kind === 'professional_registration' ||
      qualification.kind === 'statutory_licence') &&
    !professional_registration.length
  ) {
    warnings.push(
      'Professional registration/licence selected — complete registration details for accurate matching'
    )
  }

  const licences = asStringList(answers.licences)
  push('licences', 'licences', 'list_normalise')

  const skills = asStringList(answers.skills)
  push('skills', 'skills', 'list_normalise')

  const english_level = mapEnglish(trimStr(answers.english_level))
  push('english_level', 'english_level', 'optional_level')

  const prefs = answers.preferences ?? {}
  const relatedOnly = yesNoUnsure(prefs.related_field_only)
  const openRelated = yesNoUnsure(prefs.open_to_related_fields)
  const openRetrain = yesNoUnsure(prefs.open_to_retraining)
  const academic = yesNoUnsure(prefs.academic_route)

  const career_preferences = {
    wants_related_field_only: relatedOnly,
    wants_academic_route: academic,
    open_to_retraining: openRetrain ?? openRelated,
  }
  push('preferences', 'career_preferences', 'yes_no_unsure→booleans')

  if (
    qualification.equivalence_status === 'not_confirmed' ||
    qualification.equivalence_status === 'unsure' ||
    answers.uk_recognition_confirmed === 'no' ||
    answers.uk_recognition_confirmed === 'unsure'
  ) {
    if (qualification.group === 'overseas' || answers.uk_recognition_confirmed) {
      warnings.push('UK recognition not confirmed for overseas qualification')
      push('equivalence_status', '(warning)', qualification.equivalence_status)
    }
  }

  const profile: WorkInEducationProfile = {
    education_level,
    qualification_title,
    subject,
    specialisation,
    qualification_country,
    institution_country: qualification_country,
    graduation_status: ['completed', 'studying', 'incomplete'].includes(graduation_status)
      ? graduation_status
      : 'completed',
    graduation_year,
    years_relevant_experience,
    current_job_title,
    has_uk_experience,
    professional_registration,
    licences,
    skills,
    english_level: english_level ? String(english_level) : null,
    career_preferences,
    qualification_group: qualification.group,
    qualification_type: qualification.type,
    equivalence_status: qualification.equivalence_status,
    qualification,
  }

  return { profile, mapping_warnings: warnings, mapping_provenance: provenance }
}
