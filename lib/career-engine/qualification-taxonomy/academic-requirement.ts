/**
 * Map Career Library role academic_requirement → required UK level / academic rank.
 */

import type { UkQualificationLevel } from './types'
import { ukLevelToAcademicRank } from './uk-level'

export type RoleAcademicRequirement =
  | 'none'
  | 'degree_relevant'
  | 'masters_relevant'
  | 'phd_relevant'
  | 'accredited_degree_preferred'
  | string

export function academicRequirementToUkLevel(
  academicReq: string | null | undefined
): UkQualificationLevel | null {
  const req = (academicReq ?? 'none').toLowerCase()
  if (req === 'none' || req === '' || req === 'unknown') return null
  if (req.includes('phd') || req.includes('doctor')) return 'level_8'
  if (req.includes('master')) return 'level_7'
  if (req.includes('degree') || req.includes('bachelor') || req.includes('accredited')) {
    return 'level_6'
  }
  return null
}

/** Same numeric scale as historical educationLevelRank (2=bachelor, 3=master, 4=phd). */
export function academicRequirementToRank(academicReq: string | null | undefined): number | null {
  const level = academicRequirementToUkLevel(academicReq)
  if (!level) return null
  return ukLevelToAcademicRank(level)
}
