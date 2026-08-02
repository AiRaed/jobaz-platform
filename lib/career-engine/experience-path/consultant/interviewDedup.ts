/**
 * Experience interview deduplication — skip redundant questions and infer
 * equivalent answers so roadmap generation behaviour stays unchanged.
 */

import { getProfessionArchetype } from './professionInterview'
import { resolveExperienceSpecialisationLabel } from '../experienceSpecialisations'
import type { ExperienceIndustryId } from '../types'
import { parseExperienceSpecialisations, formatCombinedLabels } from './multiSelect'
import { applyCertificationInference } from '@/lib/career-engine/shared/assessmentMultiSelect'

/** Profession answer keys for "qualification obtained outside UK" */
export const OVERSEAS_QUALIFICATION_KEYS = [
  'overseas_nursing',
  'overseas_dental_qual',
  'overseas_qualification',
  'overseas_electrical',
  'overseas_accounting',
] as const

const HEALTH_ARCHETYPES = new Set(['nursing', 'dental', 'regulated_health'])

function selectedSpecs(answers: Record<string, string>): string[] {
  return parseExperienceSpecialisations(answers)
}

function hasHealthArchetype(answers: Record<string, string>): boolean {
  return selectedSpecs(answers).some((spec) => HEALTH_ARCHETYPES.has(getProfessionArchetype(spec)))
}

/**
 * Whether a question should appear in the interview (false = skip; value inferred later).
 */
export function shouldAskExperienceQuestion(
  questionId: string,
  answers: Record<string, string>
): boolean {
  const country = answers.experience_country

  if (questionId === 'uk_work_experience') {
    return country === 'outside_uk'
  }

  if ((OVERSEAS_QUALIFICATION_KEYS as readonly string[]).includes(questionId)) {
    if (country === 'outside_uk') return false
    if (country === 'uk') return true
    return true
  }

  if (questionId === 'nhs_experience') {
    if (!hasHealthArchetype(answers)) return true
    if (country === 'outside_uk') return answers.uk_work_experience === 'yes'
    return true
  }

  if (questionId === 'site_experience') {
    if (country === 'uk') return false
    return true
  }

  return true
}

export function ukWorkExperienceQuestionText(answers: Record<string, string>): string {
  const industry = answers.industry as ExperienceIndustryId | undefined
  const specs = selectedSpecs(answers)
  const labels = specs.map((spec) =>
    industry
      ? resolveExperienceSpecialisationLabel(industry, spec, answers.experience_specialisation_other)
      : spec
  )
  const roleText =
    labels.length > 1 ? `these roles (${formatCombinedLabels(labels)})` : `a ${labels[0] ?? 'professional'}`

  return `Alongside your overseas experience, have you also worked in ${roleText} in the UK?`
}

/**
 * Fill answers for questions that were skipped because they duplicate prior responses.
 * Call before roadmap generation so decision logic receives complete data.
 */
export function normalizeExperienceAnswers<T extends Record<string, string | undefined>>(
  answers: T
): T {
  const out: Record<string, string | undefined> = { ...answers }
  const country = out.experience_country

  if (country === 'uk') {
    if (!out.uk_work_experience) out.uk_work_experience = 'yes'
    for (const key of OVERSEAS_QUALIFICATION_KEYS) {
      if (!out[key]) out[key] = 'no'
    }
    if (!out.site_experience) out.site_experience = 'yes'
  }

  if (country === 'outside_uk') {
    for (const key of OVERSEAS_QUALIFICATION_KEYS) {
      if (!out[key]) out[key] = 'yes'
    }
    if (!out.uk_work_experience) out.uk_work_experience = 'no'
    if (!out.nhs_experience && out.uk_work_experience === 'no') {
      out.nhs_experience = 'no'
    }
    if (!out.site_experience) out.site_experience = 'no'
  }

  if (out.sia_ds_licence === 'yes' || out.sia_cctv_licence === 'yes' || out.sia_sg_licence === 'yes') {
    out.sia_licence = 'yes'
  }

  return applyCertificationInference(out) as T
}

export function isExperienceAnswersComplete(answers: Record<string, unknown>): boolean {
  if (!answers || typeof answers !== 'object') return false
  const a = answers as Record<string, unknown>
  const required = [
    'industry',
    'experience_specialisation',
    'years_experience',
    'experience_country',
    'english_level',
    'open_to_certifications',
    'preferred_location',
  ]
  if (!required.every((k) => typeof a[k] === 'string')) return false

  const normalized = normalizeExperienceAnswers(a as Record<string, string>)
  return typeof normalized.uk_work_experience === 'string'
}
