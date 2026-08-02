/** Canonical public badge labels for course cards (admin multi-select). */
export const COURSE_PUBLIC_BADGE_OPTIONS = [
  'Licence',
  'Beginner friendly',
  'Required first step',
  'Fast route',
  'Career growth',
  'Specialist',
  'Renewal',
  'Online',
  'Classroom',
  'Practical training',
  'Regulated qualification',
  'CPD',
  'Employer preferred',
  'Entry route',
  'Advanced',
  'Existing workers',
  'Control room jobs',
] as const

export type CoursePublicBadge = (typeof COURSE_PUBLIC_BADGE_OPTIONS)[number]

const BADGE_LOOKUP = new Map(
  COURSE_PUBLIC_BADGE_OPTIONS.map((badge) => [badge.toLowerCase(), badge])
)

export function normalizePublicBadge(value: string | null | undefined): CoursePublicBadge | null {
  const key = (value ?? '').trim().toLowerCase()
  if (!key) return null
  return BADGE_LOOKUP.get(key) ?? null
}

export function normalizePublicBadges(values: string[] | null | undefined): CoursePublicBadge[] {
  const seen = new Set<string>()
  const result: CoursePublicBadge[] = []
  for (const value of values ?? []) {
    const badge = normalizePublicBadge(value)
    if (!badge || seen.has(badge)) continue
    seen.add(badge)
    result.push(badge)
  }
  return result
}

export function resolvePublicBadges(values: string[] | null | undefined): CoursePublicBadge[] {
  return normalizePublicBadges(values)
}

export const MAX_COURSE_CARD_BADGES = 4

export function courseCardBadges(
  publicBadges: string[] | null | undefined,
  pathwayBadge?: string
): string[] {
  const badges: string[] = []
  const seen = new Set<string>()

  const add = (badge: string) => {
    const trimmed = badge.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    badges.push(trimmed)
  }

  if (pathwayBadge) add(pathwayBadge)
  for (const badge of resolvePublicBadges(publicBadges)) {
    add(badge)
    if (badges.length >= MAX_COURSE_CARD_BADGES) break
  }

  return badges.slice(0, MAX_COURSE_CARD_BADGES)
}
