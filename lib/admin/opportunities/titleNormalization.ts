import type { CourseOpportunity } from './types'

/** Lowercase, trim, strip punctuation, collapse spaces — for duplicate detection. */
export function normalizeOpportunityTitleKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Canonical groups — titles in the same group are treated as duplicates.
 * First item is the canonical key used for matching.
 */
const TITLE_CANONICAL_GROUPS: string[][] = [
  ['power bi', 'power bi data analysis'],
  ['revit', 'revit bim'],
  ['apm project management', 'apm'],
  ['data protection gdpr', 'gdpr', 'gdpr basics'],
  ['sage', 'sage accounting'],
  ['tefl certificate', 'tefl'],
  [
    'health and social care level 2',
    'level 2 diploma in care',
    'qualifi level 2 diploma in care',
  ],
  ['health and social care level 3', 'level 3 health and social care'],
  ['moving and handling people', 'moving handling people', 'moving and handling'],
  ['aat', 'aat foundation'],
  ['autocad', 'auto cad'],
  ['iosh managing safely', 'iosh'],
  ['care certificate', 'the care certificate'],
  ['cscs green card pathway', 'cscs green card'],
  ['english for work', 'workplace english'],
]

const canonicalKeyByNormalized = new Map<string, string>()

for (const group of TITLE_CANONICAL_GROUPS) {
  const canonical = normalizeOpportunityTitleKey(group[0])
  for (const alias of group) {
    canonicalKeyByNormalized.set(normalizeOpportunityTitleKey(alias), canonical)
  }
}

export function canonicalOpportunityTitleKey(name: string): string {
  const normalized = normalizeOpportunityTitleKey(name)
  return canonicalKeyByNormalized.get(normalized) ?? normalized
}

export function opportunityTitleKeysMatch(a: string, b: string): boolean {
  return canonicalOpportunityTitleKey(a) === canonicalOpportunityTitleKey(b)
}

export function findExistingOpportunityByTitle(
  opportunities: CourseOpportunity[],
  courseName: string
): CourseOpportunity | null {
  const target = canonicalOpportunityTitleKey(courseName)
  const matches = opportunities.filter(
    (o) => canonicalOpportunityTitleKey(o.courseName) === target
  )
  if (!matches.length) return null
  return [...matches].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id)
  )[0]
}
