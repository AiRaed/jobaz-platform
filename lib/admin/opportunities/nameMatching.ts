import type { AdminCourse } from '@/lib/admin/courses/types'
import { courseSlugFromTitle } from '@/lib/career-hub/marketplace/slug'

const MATCH_STOP_WORDS = new Set([
  'course',
  'training',
  'certificate',
  'certification',
  'programme',
  'program',
  'diploma',
  'qualification',
  'award',
  'the',
  'and',
])

/** Normalize for fuzzy opportunity ↔ published course matching. */
export function normalizeForOpportunityMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !MATCH_STOP_WORDS.has(w))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function opportunityMatchKey(text: string): string {
  return normalizeForOpportunityMatch(text)
}

function tokenSet(text: string): Set<string> {
  const key = opportunityMatchKey(text)
  return new Set(key ? key.split(' ') : [])
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = tokenSet(a)
  const tb = tokenSet(b)
  if (!ta.size && !tb.size) return 1
  if (!ta.size || !tb.size) return 0
  let intersection = 0
  for (const t of ta) {
    if (tb.has(t)) intersection += 1
  }
  const union = new Set([...ta, ...tb]).size
  return union === 0 ? 0 : intersection / union
}

function containsMatch(a: string, b: string): boolean {
  const na = opportunityMatchKey(a)
  const nb = opportunityMatchKey(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const shorter = na.length <= nb.length ? na : nb
  const longer = na.length > nb.length ? na : nb
  if (shorter.length < 8) return false
  return longer.includes(shorter)
}

/** Score how well an opportunity matches a published course title (higher = better). */
export function scoreOpportunityCourseMatch(
  opportunityName: string,
  shortLabel: string,
  courseTitle: string
): number {
  const candidates = [opportunityName, shortLabel].filter(Boolean)
  let best = 0

  for (const candidate of candidates) {
    const nc = opportunityMatchKey(candidate)
    const nt = opportunityMatchKey(courseTitle)
    if (!nc || !nt) continue
    if (nc === nt) return 100
    if (containsMatch(candidate, courseTitle)) best = Math.max(best, 90)
    const slugA = courseSlugFromTitle(candidate).replace(/-/g, ' ')
    const slugB = courseSlugFromTitle(courseTitle).replace(/-/g, ' ')
    if (opportunityMatchKey(slugA) === opportunityMatchKey(slugB)) best = Math.max(best, 85)
    best = Math.max(best, Math.round(jaccardSimilarity(candidate, courseTitle) * 80))
  }

  return best
}

const MATCH_THRESHOLD = 72

export function findBestPublishedCourseMatch(
  opportunity: { courseName: string; shortLabel: string; publishedCourseId?: string | null },
  publishedCourses: AdminCourse[],
  coursesById: Map<string, AdminCourse>
): AdminCourse | null {
  if (opportunity.publishedCourseId) {
    const linked = coursesById.get(opportunity.publishedCourseId)
    if (linked && linked.status === 'published') return linked
  }

  let best: AdminCourse | null = null
  let bestScore = 0

  for (const course of publishedCourses) {
    const score = scoreOpportunityCourseMatch(
      opportunity.courseName,
      opportunity.shortLabel,
      course.title
    )
    if (score > bestScore && score >= MATCH_THRESHOLD) {
      bestScore = score
      best = course
    }
  }

  return best
}

export function buildPublishedCourseIndex(courses: AdminCourse[]): {
  published: AdminCourse[]
  byId: Map<string, AdminCourse>
} {
  const published = courses.filter((c) => c.status === 'published')
  const byId = new Map(published.map((c) => [c.id, c]))
  return { published, byId }
}
