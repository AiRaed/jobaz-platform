/**
 * Eligibility helpers that consume normalized taxonomy — not bare “Bachelor’s” labels.
 */

import type { NormalizedQualification, UkQualificationLevel } from './types'
import { academicRequirementToUkLevel } from './academic-requirement'
import { ukLevelAtLeast, ukLevelToAcademicRank } from './uk-level'

export type QualificationEligibilityResult = {
  ok: boolean
  reason_code: string
  message: string
  /** Soft review flag (e.g. overseas unconfirmed) — does not auto-fail academic level alone */
  needs_review: boolean
  user_uk_level: UkQualificationLevel
  required_uk_level: UkQualificationLevel | null
  academic_rank: number | null
}

/**
 * Academic rank for scoring bridges.
 * Professional registration / statutory licence alone do not grant bachelor rank.
 * PGCE (teaching) does not grant generic master’s satisfaction (handled in satisfies).
 */
export function academicRankFromQualification(q: NormalizedQualification): number | null {
  if (
    q.kind === 'professional_registration' ||
    q.kind === 'statutory_licence' ||
    q.kind === 'industry_accreditation'
  ) {
    return null
  }
  if (q.kind === 'none') return 0
  return ukLevelToAcademicRank(q.uk_level)
}

/**
 * Whether the user’s academic qualification meets a role academic_requirement.
 * Does not treat professional licences as degrees.
 * Does not treat PGCE as a generic Master’s.
 * Does not auto-equate unconfirmed overseas qualifications.
 */
export function qualificationSatisfiesAcademicRequirement(
  q: NormalizedQualification,
  academicReq: string | null | undefined
): QualificationEligibilityResult {
  const required = academicRequirementToUkLevel(academicReq)
  const userLevel = q.uk_level
  const rank = academicRankFromQualification(q)

  const overseasUnconfirmed =
    q.group === 'overseas' &&
    (q.equivalence_status === 'unsure' || q.equivalence_status === 'not_confirmed')

  if (!required) {
    return {
      ok: true,
      reason_code: 'academic.none_required',
      message: 'No specific academic level required',
      needs_review: overseasUnconfirmed,
      user_uk_level: userLevel,
      required_uk_level: null,
      academic_rank: rank,
    }
  }

  // Professional-only credentials never satisfy academic degree requirements
  if (
    q.kind === 'professional_registration' ||
    q.kind === 'statutory_licence' ||
    q.kind === 'industry_accreditation' ||
    (q.group === 'professional' && q.uk_level === 'unknown')
  ) {
    return {
      ok: false,
      reason_code: 'academic.professional_not_degree',
      message:
        'A professional registration or licence is tracked separately and does not replace the academic qualification this role expects',
      needs_review: false,
      user_uk_level: userLevel,
      required_uk_level: required,
      academic_rank: rank,
    }
  }

  // PGCE / teaching quals: may be Level 7 but must not satisfy masters_relevant as generic MSc
  const reqLower = (academicReq ?? '').toLowerCase()
  if (q.not_generic_masters && reqLower.includes('master')) {
    return {
      ok: false,
      reason_code: 'academic.pgce_not_generic_masters',
      message:
        'PGCE is a teaching qualification and is not treated as a generic Master’s degree for this requirement',
      needs_review: false,
      user_uk_level: userLevel,
      required_uk_level: required,
      academic_rank: rank,
    }
  }

  // Unconfirmed overseas: do not auto-equate — force review path
  if (overseasUnconfirmed) {
    return {
      ok: false,
      reason_code: 'academic.overseas_equivalence_unconfirmed',
      message:
        'Overseas qualification equivalence is not confirmed — review required before treating as UK-equivalent',
      needs_review: true,
      user_uk_level: userLevel,
      required_uk_level: required,
      academic_rank: rank,
    }
  }

  if (userLevel === 'unknown' || rank == null) {
    return {
      ok: false,
      reason_code: 'academic.level_unknown',
      message: 'Qualification level is ambiguous and cannot automatically satisfy this requirement',
      needs_review: true,
      user_uk_level: userLevel,
      required_uk_level: required,
      academic_rank: rank,
    }
  }

  const ok = ukLevelAtLeast(userLevel, required)
  return {
    ok,
    reason_code: ok ? 'academic.level_met' : 'academic.level_below',
    message: ok
      ? 'Qualification level meets this role’s academic requirement'
      : 'Qualification level is below this role’s academic requirement',
    needs_review: false,
    user_uk_level: userLevel,
    required_uk_level: required,
    academic_rank: rank,
  }
}
