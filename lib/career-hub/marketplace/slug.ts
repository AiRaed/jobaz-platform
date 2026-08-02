import { slugifyCourseName } from '@/lib/career-hub/slug'

export function normalizeCourseSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
}

/** Canonical public slug from course title */
export function courseSlugFromTitle(title: string): string {
  return slugifyCourseName(title)
}

/** Legacy slug with id suffix (backwards compatible) */
export function legacyCourseSlug(title: string, courseId: string): string {
  return `${courseSlugFromTitle(title)}-${courseId.slice(0, 8)}`
}

export function courseMatchesSlug(
  title: string,
  courseId: string,
  slug: string
): boolean {
  const target = normalizeCourseSlug(slug)
  return (
    courseSlugFromTitle(title) === target ||
    legacyCourseSlug(title, courseId) === target
  )
}

export function courseDetailPath(slug: string): string {
  return `/courses/${normalizeCourseSlug(slug)}`
}
