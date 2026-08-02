/**
 * Career Hub eligible courses and sort order.
 */

import { routeTargetLabels } from './routeTargets'
import { courseVisibleOnCareerHubRoute, normalizeRouteSlug } from '@/lib/career-hub/courseVisibility'
import type { AdminCourse, CourseStatus } from './types'

export type AdminCourseQuickFilter = 'all' | 'published' | 'draft' | 'partner' | 'featured'

export type AdminCourseFilters = {
  search: string
  category: string
  status: CourseStatus | 'all'
  quickFilter: AdminCourseQuickFilter
}

export function filterAdminCourses(courses: AdminCourse[], filters: AdminCourseFilters): AdminCourse[] {
  const q = filters.search.trim().toLowerCase()

  return courses.filter((course) => {
    if (filters.category && filters.category !== 'all' && course.category !== filters.category) {
      return false
    }
    if (filters.status !== 'all' && course.status !== filters.status) {
      return false
    }
    if (filters.quickFilter === 'published' && course.status !== 'published') return false
    if (filters.quickFilter === 'draft' && course.status !== 'draft') return false
    if (filters.quickFilter === 'partner' && !course.partnerCourse) return false
    if (filters.quickFilter === 'featured' && !course.featuredCourse) return false
    if (!q) return true

    const routeLabels = routeTargetLabels(course.routeIds).join(' ')
    return (
      course.title.toLowerCase().includes(q) ||
      course.shortDescription.toLowerCase().includes(q) ||
      course.fullDescription.toLowerCase().includes(q) ||
      course.provider.toLowerCase().includes(q) ||
      routeLabels.toLowerCase().includes(q) ||
      course.routeIds.some((id) => id.toLowerCase().includes(q)) ||
      course.category.toLowerCase().includes(q) ||
      course.location.toLowerCase().includes(q)
    )
  })
}

export function getCareerHubEligibleCourses(courses: AdminCourse[]): AdminCourse[] {
  return courses.filter((c) => c.status.trim().toLowerCase() === 'published' && c.showInCareerHub)
}

export function courseMatchesCareerHubPath(course: AdminCourse, pathId: string): boolean {
  return courseVisibleOnCareerHubRoute(course, normalizeRouteSlug(pathId))
}

/** Partner → featured → priority → newest */
export function sortCoursesForCareerHub(courses: AdminCourse[]): AdminCourse[] {
  return [...courses].sort((a, b) => {
    if (a.partnerCourse !== b.partnerCourse) return a.partnerCourse ? -1 : 1
    if (a.featuredCourse !== b.featuredCourse) return a.featuredCourse ? -1 : 1
    if (a.priorityOrder !== b.priorityOrder) return b.priorityOrder - a.priorityOrder
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function filterAndSortCareerHubCourses(courses: AdminCourse[], pathId: string): AdminCourse[] {
  return sortCoursesForCareerHub(
    getCareerHubEligibleCourses(courses).filter((c) => courseMatchesCareerHubPath(c, pathId))
  )
}
