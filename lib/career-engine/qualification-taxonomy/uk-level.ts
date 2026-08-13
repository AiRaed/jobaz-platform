/**
 * UK level normalisation helpers.
 * Never invent a level when the qualification is ambiguous.
 */

import type { UkQualificationLevel } from './types'

const UK_LEVEL_ORDER: UkQualificationLevel[] = [
  'entry',
  'level_1',
  'level_2',
  'level_3',
  'level_4',
  'level_5',
  'level_6',
  'level_7',
  'level_8',
]

/** Numeric rank for comparisons; unknown → null (do not treat as 0). */
export function ukLevelRank(level: UkQualificationLevel | null | undefined): number | null {
  if (!level || level === 'unknown') return null
  const idx = UK_LEVEL_ORDER.indexOf(level)
  return idx >= 0 ? idx : null
}

export function ukLevelAtLeast(
  actual: UkQualificationLevel | null | undefined,
  required: UkQualificationLevel
): boolean {
  const a = ukLevelRank(actual)
  const r = ukLevelRank(required)
  if (a == null || r == null) return false
  return a >= r
}

export function formatUkLevelLabel(level: UkQualificationLevel): string {
  switch (level) {
    case 'entry':
      return 'Entry Level'
    case 'level_1':
      return 'Level 1'
    case 'level_2':
      return 'Level 2'
    case 'level_3':
      return 'Level 3'
    case 'level_4':
      return 'Level 4'
    case 'level_5':
      return 'Level 5'
    case 'level_6':
      return 'Level 6'
    case 'level_7':
      return 'Level 7'
    case 'level_8':
      return 'Level 8'
    default:
      return 'Unknown'
  }
}

/**
 * Coarse academic rank used by existing eligibility bridges.
 * 0 = below college, 1 = college/L3–L5, 2 = bachelor/L6, 3 = master/L7, 4 = doctorate/L8
 * Professional-only / unknown → null (caller must not invent).
 */
export function ukLevelToAcademicRank(level: UkQualificationLevel | null | undefined): number | null {
  const r = ukLevelRank(level)
  if (r == null) return null
  if (r <= 2) return 0 // entry–L2
  if (r <= 5) return 1 // L3–L5 college / vocational / foundation
  if (r === 6) return 2 // L6 bachelor
  if (r === 7) return 3 // L7 master / PG
  return 4 // L8
}
