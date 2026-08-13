/**
 * Backward-compatible adapter: legacy education_level values → taxonomy.
 * Does not invalidate existing assessments.
 */

import type {
  EquivalenceStatus,
  NormalizedQualification,
  QualificationGroupId,
  QualificationTypeId,
  ResolveQualificationInput,
} from './types'
import { getQualificationType } from './groups'
import { isUkCountryHint } from './country'

type LegacyMap = {
  group: QualificationGroupId
  type: QualificationTypeId
  note: string
}

/**
 * Maps old wizard / profile values into the new taxonomy.
 * Ambiguous college/diploma → other_vocational with unknown UK level (do not guess).
 */
const LEGACY_EDUCATION_LEVEL_MAP: Record<string, LegacyMap> = {
  // Wizard answer values
  college_or_diploma: { group: 'college_vocational', type: 'other_vocational', note: 'legacy college_or_diploma' },
  bachelor: { group: 'undergraduate', type: 'bachelors', note: 'legacy bachelor' },
  master: { group: 'postgraduate', type: 'masters', note: 'legacy master' },
  doctorate: { group: 'doctoral', type: 'phd', note: 'legacy doctorate' },
  professional_qualification: {
    group: 'professional',
    type: 'other_professional',
    note: 'legacy professional_qualification',
  },
  other: { group: 'other_unsure', type: 'other', note: 'legacy other' },
  // Canonical profile values
  college: { group: 'college_vocational', type: 'other_vocational', note: 'legacy college' },
  professional: { group: 'professional', type: 'other_professional', note: 'legacy professional' },
  // Alternate spellings from other JobAZ paths
  bachelors: { group: 'undergraduate', type: 'bachelors', note: 'legacy bachelors' },
  masters: { group: 'postgraduate', type: 'masters', note: 'legacy masters' },
  phd: { group: 'doctoral', type: 'phd', note: 'legacy phd' },
  college_diploma: { group: 'college_vocational', type: 'diploma', note: 'legacy college_diploma' },
  diploma_college: { group: 'college_vocational', type: 'diploma', note: 'legacy diploma_college' },
  no_formal: { group: 'no_formal', type: 'none', note: 'legacy no_formal' },
  gcse_a_levels: { group: 'school', type: 'a_level_l3', note: 'legacy gcse_a_levels→A level (conservative)' },
  vocational: { group: 'college_vocational', type: 'other_vocational', note: 'legacy vocational' },
}

export function mapLegacyEducationLevel(
  raw: string | null | undefined
): LegacyMap | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  return LEGACY_EDUCATION_LEVEL_MAP[key] ?? null
}

export function listLegacyEducationLevelKeys(): string[] {
  return Object.keys(LEGACY_EDUCATION_LEVEL_MAP)
}

function mapEquivalence(
  input: ResolveQualificationInput,
  group: QualificationGroupId
): EquivalenceStatus {
  if (group !== 'overseas' && isUkCountryHint(input.qualification_country)) {
    return 'uk'
  }
  if (group === 'overseas') {
    const conf = String(input.uk_recognition_confirmed ?? input.equivalence_status ?? '')
      .trim()
      .toLowerCase()
    if (conf === 'yes' || conf === 'confirmed' || conf === 'equivalence_confirmed') return 'confirmed'
    if (conf === 'no' || conf === 'not_confirmed' || conf === 'equivalence_not_confirmed') {
      return 'not_confirmed'
    }
    if (conf === 'unsure' || conf === '') return 'unsure'
    if (conf === 'uk') return 'uk'
  }
  const direct = String(input.equivalence_status ?? '').trim().toLowerCase()
  if (direct === 'confirmed') return 'confirmed'
  if (direct === 'not_confirmed') return 'not_confirmed'
  if (direct === 'unsure') return 'unsure'
  if (direct === 'uk') return 'uk'
  return group === 'overseas' ? 'unsure' : 'not_applicable'
}

function legacyBandFromGroup(
  group: QualificationGroupId,
  typeId: string
): NormalizedQualification['education_level_legacy'] {
  if (group === 'doctoral' || typeId === 'overseas_doctorate') return 'doctorate'
  if (group === 'postgraduate' || typeId === 'overseas_postgraduate') {
    const type = getQualificationType(typeId)
    if (type?.not_generic_masters) return 'professional' // teaching — not generic master band
    return 'master'
  }
  if (group === 'undergraduate' || typeId === 'overseas_undergraduate') return 'bachelor'
  if (group === 'professional' || typeId === 'overseas_professional') return 'professional'
  if (group === 'college_vocational' || group === 'school' || typeId === 'overseas_college') {
    return 'college'
  }
  if (group === 'no_formal') return 'other'
  return 'other'
}

/**
 * Resolve a normalized qualification from new taxonomy fields and/or legacy education_level.
 */
export function resolveNormalizedQualification(
  input: ResolveQualificationInput
): NormalizedQualification {
  let groupId = (input.qualification_group || '').trim() as QualificationGroupId | ''
  let typeId = (input.qualification_type || '').trim()

  // Prefer explicit taxonomy; fall back to legacy education_level
  if (!groupId || !typeId) {
    const legacy = mapLegacyEducationLevel(input.education_level)
    if (legacy) {
      if (!groupId) groupId = legacy.group
      if (!typeId) typeId = legacy.type
    }
  }

  if (!groupId) {
    groupId = 'other_unsure'
  }
  if (!typeId) {
    typeId = groupId === 'no_formal' ? 'none' : 'other'
  }

  const typeDef = getQualificationType(typeId)
  // If type belongs to a different group, trust the type's group
  if (typeDef) {
    groupId = typeDef.group_id
  }

  const uk_level = typeDef?.uk_level ?? 'unknown'
  const kind = typeDef?.kind ?? 'other'
  const not_generic_masters = Boolean(typeDef?.not_generic_masters)
  const is_integrated_masters = Boolean(typeDef?.is_integrated_masters)
  const equivalence_status = mapEquivalence(input, groupId)

  // Keep structural UK level for display; eligibility uses equivalence_status
  // and will not auto-equate unconfirmed overseas qualifications.

  return {
    group: groupId,
    type: typeId,
    uk_level,
    kind,
    not_generic_masters,
    is_integrated_masters,
    equivalence_status,
    professional_body: input.professional_body?.trim() || null,
    registration_or_licence: input.registration_or_licence?.trim() || null,
    raw_user_input: input.qualification_title?.trim() || null,
    education_level_legacy: legacyBandFromGroup(groupId, typeId),
  }
}

/** Public map of old → new for docs/tests */
export const LEGACY_TO_TAXONOMY = { ...LEGACY_EDUCATION_LEVEL_MAP }
