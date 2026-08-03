/**
 * Profile normalisation for Work in My Education.
 */

import {
  aliasKey,
  buildAliasIndex,
  resolveAlias,
  type AliasIndex,
  type CareerKnowledgeAlias,
} from './aliases'
import { enrichRegistrationScopes } from './qualification-scope'
import type {
  EducationLevel,
  GraduationStatus,
  NormalisedWorkInEducationProfile,
  WorkInEducationProfile,
} from './types'

const STOP = new Set([
  'and',
  'or',
  'of',
  'the',
  'in',
  'for',
  'with',
  'a',
  'an',
  'to',
  'on',
  'at',
  'by',
  'from',
])

const UK_COUNTRY_KEYS = new Set([
  'uk',
  'united kingdom',
  'great britain',
  'britain',
  'england',
  'scotland',
  'wales',
  'northern ireland',
  'gb',
])

function tokensFrom(text: string): string[] {
  return aliasKey(text)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t))
}

function expandWithAliases(text: string, index: AliasIndex): {
  normalised: string
  tokens: string[]
  hits: string[]
} {
  const resolved = resolveAlias(text, index)
  const base = resolved.canonical || aliasKey(text)
  const hits: string[] = []
  if (resolved.hit) hits.push(`${resolved.hit.kind}:${resolved.hit.canonical}`)

  // Expand individual tokens through aliases
  const parts = base.split(' ')
  const expanded: string[] = []
  for (const p of parts) {
    const r = resolveAlias(p, index)
    if (r.hit) {
      hits.push(`${r.hit.kind}:${r.hit.canonical}`)
      expanded.push(...r.canonical.split(' '))
    } else {
      expanded.push(p)
    }
  }
  const normalised = expanded.join(' ').replace(/\s+/g, ' ').trim()
  return { normalised, tokens: tokensFrom(normalised), hits: [...new Set(hits)] }
}

export function isUkCountry(value: string | null | undefined): boolean {
  if (!value) return false
  return UK_COUNTRY_KEYS.has(aliasKey(value))
}

export function normaliseWorkInEducationProfile(
  profile: WorkInEducationProfile,
  aliasSource?: CareerKnowledgeAlias[]
): NormalisedWorkInEducationProfile {
  const index = buildAliasIndex(aliasSource)
  const subject = expandWithAliases(profile.subject ?? '', index)
  const title = expandWithAliases(profile.qualification_title ?? '', index)
  const specialisationRaw = profile.specialisation?.trim() || null
  const specialisation = specialisationRaw
    ? expandWithAliases(specialisationRaw, index)
    : { normalised: null as string | null, tokens: [] as string[], hits: [] as string[] }

  const prefs = profile.career_preferences ?? {}
  const jobTitle = profile.current_job_title?.trim() || null
  const qualificationCountry = profile.qualification_country?.trim() || null
  const institutionCountry = profile.institution_country?.trim() || null

  const alias_hits = [...new Set([...title.hits, ...subject.hits, ...specialisation.hits])]

  const regs = enrichRegistrationScopes(
    Array.isArray(profile.professional_registration) ? profile.professional_registration : [],
    profile.qualification_title?.trim() ?? '',
    profile.subject?.trim() ?? ''
  )

  return {
    education_level: profile.education_level,
    qualification_title_raw: profile.qualification_title?.trim() ?? '',
    qualification_title_normalised: title.normalised,
    subject_raw: profile.subject?.trim() ?? '',
    subject_normalised: subject.normalised,
    subject_tokens: subject.tokens,
    specialisation_raw: specialisationRaw,
    specialisation_normalised: specialisation.normalised,
    specialisation_tokens: specialisation.tokens,
    institution_country: institutionCountry,
    qualification_country: qualificationCountry,
    is_uk_qualification: isUkCountry(qualificationCountry) || isUkCountry(institutionCountry),
    graduation_status: (profile.graduation_status ?? 'completed') as GraduationStatus,
    graduation_year: profile.graduation_year ?? null,
    years_relevant_experience: Math.max(0, Number(profile.years_relevant_experience ?? 0) || 0),
    current_job_title: jobTitle,
    current_job_tokens: jobTitle ? tokensFrom(jobTitle) : [],
    has_uk_experience: profile.has_uk_experience ?? null,
    professional_registration: regs,
    licences: Array.isArray(profile.licences) ? profile.licences.map((l) => l.trim()).filter(Boolean) : [],
    skills: Array.isArray(profile.skills) ? profile.skills.map((s) => s.trim()).filter(Boolean) : [],
    skill_tokens: (profile.skills ?? []).flatMap((s) => tokensFrom(s)),
    languages: Array.isArray(profile.languages) ? profile.languages : [],
    english_level: profile.english_level?.trim() || null,
    career_preferences: {
      wants_academic_route: prefs.wants_academic_route ?? null,
      wants_related_field_only: prefs.wants_related_field_only ?? null,
      open_to_retraining: prefs.open_to_retraining ?? null,
      preferred_work_types: prefs.preferred_work_types ?? [],
      preferred_locations: prefs.preferred_locations ?? [],
    },
    alias_hits,
  }
}

export function educationLevelRank(level: EducationLevel): number {
  switch (level) {
    case 'college':
      return 1
    case 'bachelor':
      return 2
    case 'professional':
      return 2
    case 'master':
      return 3
    case 'doctorate':
      return 4
    default:
      return 1
  }
}

export { tokensFrom, aliasKey }
