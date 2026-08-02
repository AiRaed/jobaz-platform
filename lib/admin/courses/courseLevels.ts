/** Standard course level options for admin select. */
export const COURSE_LEVEL_OPTIONS = [
  'Entry',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Specialist',
  'Professional',
  'Refresher',
  'Renewal / Top-up',
  'Qualification',
  'Licence',
] as const

export type CourseLevelOption = (typeof COURSE_LEVEL_OPTIONS)[number]

const LEVEL_LOOKUP = new Set<string>(COURSE_LEVEL_OPTIONS)

export function normalizeCourseLevel(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return 'Entry'
  const match = COURSE_LEVEL_OPTIONS.find((opt) => opt.toLowerCase() === trimmed.toLowerCase())
  return match ?? trimmed
}

export function isKnownCourseLevel(value: string | null | undefined): boolean {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return false
  return LEVEL_LOOKUP.has(trimmed) || COURSE_LEVEL_OPTIONS.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())
}
