/**
 * Local course-interest / training action state.
 * Referral clicks must NEVER equal qualification completion.
 */

import { getCurrentUserIdSync, getUserScopedKeySync } from '@/lib/user-storage'
import { slugifyCourseName } from '@/lib/career-hub/slug'

export type CourseInterestStatus =
  | 'viewed'
  | 'clicked'
  | 'saved'
  | 'booked'
  | 'in_progress'
  | 'completed'
  | 'dismissed'

export type CourseInterestRecord = {
  courseId: string
  title: string
  slug: string
  status: CourseInterestStatus
  source?: string
  route?: string | null
  updatedAt: string
}

const STORAGE_KEY = 'jobaz_course_interest_v1'
const PROMPT_WINDOW_MS = 1000 * 60 * 60 * 24 * 14 // 14 days

type InterestStore = { items: CourseInterestRecord[] }

function readStore(): InterestStore {
  if (typeof window === 'undefined') return { items: [] }
  try {
    const raw = localStorage.getItem(getUserScopedKeySync(STORAGE_KEY, getCurrentUserIdSync()))
    if (!raw) return { items: [] }
    const parsed = JSON.parse(raw) as InterestStore
    return { items: Array.isArray(parsed.items) ? parsed.items : [] }
  } catch {
    return { items: [] }
  }
}

function writeStore(store: InterestStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    getUserScopedKeySync(STORAGE_KEY, getCurrentUserIdSync()),
    JSON.stringify(store)
  )
  window.dispatchEvent(new CustomEvent('jobaz-course-interest-updated'))
}

export function recordCourseInterest(input: {
  courseId?: string | null
  title: string
  status: CourseInterestStatus
  source?: string
  route?: string | null
}): CourseInterestRecord | null {
  const title = input.title.trim()
  if (!title || typeof window === 'undefined') return null

  const slug = slugifyCourseName(title)
  const courseId = (input.courseId || slug).trim()
  const store = readStore()
  const existing = store.items.find(
    (i) => i.slug === slug || i.courseId === courseId || i.title.toLowerCase() === title.toLowerCase()
  )

  // Never downgrade completed/dismissed from a click/view
  if (existing?.status === 'dismissed' && input.status !== 'completed' && input.status !== 'booked') {
    return existing
  }
  if (existing?.status === 'completed' && input.status !== 'completed') {
    return existing
  }

  const nextStatus =
    existing?.status === 'booked' && (input.status === 'clicked' || input.status === 'viewed')
      ? 'booked'
      : existing?.status === 'in_progress' && (input.status === 'clicked' || input.status === 'viewed')
        ? 'in_progress'
        : input.status

  const record: CourseInterestRecord = {
    courseId,
    title,
    slug,
    status: nextStatus,
    source: input.source ?? existing?.source,
    route: input.route ?? existing?.route ?? null,
    updatedAt: new Date().toISOString(),
  }

  store.items = [
    ...store.items.filter(
      (i) => i.slug !== slug && i.courseId !== courseId && i.title.toLowerCase() !== title.toLowerCase()
    ),
    record,
  ]
  writeStore(store)
  return record
}

export function updateCourseInterestStatus(
  titleOrSlug: string,
  status: CourseInterestStatus
): CourseInterestRecord | null {
  const key = titleOrSlug.trim().toLowerCase()
  if (!key) return null
  const store = readStore()
  const existing = store.items.find(
    (i) =>
      i.slug === key ||
      i.courseId === key ||
      i.title.toLowerCase() === key ||
      slugifyCourseName(i.title) === slugifyCourseName(titleOrSlug)
  )
  if (!existing) {
    return recordCourseInterest({ title: titleOrSlug, status })
  }
  const updated: CourseInterestRecord = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  }
  store.items = store.items.map((i) => (i.slug === existing.slug ? updated : i))
  writeStore(store)
  return updated
}

export function dismissCourseInterest(titleOrSlug: string): void {
  updateCourseInterestStatus(titleOrSlug, 'dismissed')
}

/** Pending prompt after a course click/view — never from auto-completion. */
export function pickPendingCourseActionPrompt(): CourseInterestRecord | null {
  const store = readStore()
  const now = Date.now()
  const actionable = store.items
    .filter((i) => {
      if (i.status === 'dismissed' || i.status === 'completed' || i.status === 'booked') return false
      if (i.status !== 'clicked' && i.status !== 'viewed' && i.status !== 'saved') return false
      const at = Date.parse(i.updatedAt)
      if (!Number.isFinite(at) || now - at > PROMPT_WINDOW_MS) return false
      return true
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))

  return actionable[0] ?? null
}

export function getCourseInterestForMatch(match: RegExp): CourseInterestRecord | null {
  const store = readStore()
  const hits = store.items
    .filter((i) => match.test(i.title) || match.test(i.slug))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  return hits[0] ?? null
}

export function listCourseInterestRecords(): CourseInterestRecord[] {
  return readStore().items
}

export function getCourseInterestLabel(status: CourseInterestStatus): string {
  switch (status) {
    case 'booked':
      return 'Booked'
    case 'in_progress':
      return 'Training in progress'
    case 'completed':
      return 'Completed'
    case 'clicked':
    case 'viewed':
      return 'Course interest'
    case 'saved':
      return 'Saved'
    case 'dismissed':
      return 'Hidden'
    default:
      return status
  }
}
