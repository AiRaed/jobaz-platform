/**
 * Career Hub course visibility — filter reasons and debug logging.
 * Temporarily: route slug + published only (category and show_in_career_hub not required).
 */

import type { AdminCourse } from '@/lib/admin/courses/types'
import { expandToPathSlugs, normalizeRouteSlug } from '@/lib/admin/courses/routeSlugs'

export type CareerHubVisibilityReason =
  | 'visible'
  | 'status_not_published'
  | 'hidden_from_career_hub'
  | 'route_not_in_appears_in_routes'

export type CareerHubVisibilityResult = {
  visible: boolean
  reason: CareerHubVisibilityReason
  details: string
}

export { expandToPathSlugs, normalizeRouteSlug }

export function getCareerHubVisibilityReason(
  course: Pick<AdminCourse, 'status' | 'showInCareerHub' | 'routeIds' | 'title'>,
  pathId: string
): CareerHubVisibilityResult {
  const status = (course.status ?? '').trim().toLowerCase()
  if (status !== 'published') {
    return {
      visible: false,
      reason: 'status_not_published',
      details: `status="${course.status}" (expected "published")`,
    }
  }

  const target = normalizeRouteSlug(pathId)
  const courseSlugs = expandToPathSlugs(course.routeIds)

  if (!courseSlugs.includes(target)) {
    return {
      visible: false,
      reason: 'route_not_in_appears_in_routes',
      details: `appears_in_routes raw=[${course.routeIds.join(', ')}] expanded=[${courseSlugs.join(', ')}] missing "${target}"`,
    }
  }

  if (!course.showInCareerHub) {
    return {
      visible: false,
      reason: 'hidden_from_career_hub',
      details: 'show_in_career_hub=false',
    }
  }

  return { visible: true, reason: 'visible', details: 'ok' }
}

export function courseVisibleOnCareerHubRoute(
  course: Pick<AdminCourse, 'status' | 'showInCareerHub' | 'routeIds' | 'title'>,
  pathId: string
): boolean {
  return getCareerHubVisibilityReason(course, pathId).visible
}

export type CareerHubCourseDebugEntry = {
  title: string
  status: string
  show_in_career_hub: boolean
  appears_in_routes: string[]
  expandedRouteSlugs: string[]
  visible: boolean
  filteredOutBecause: CareerHubVisibilityReason | null
  details: string
}

export function buildCareerHubCourseDebugLog(
  courses: AdminCourse[],
  pathId: string
): CareerHubCourseDebugEntry[] {
  return courses.map((course) => {
    const result = getCareerHubVisibilityReason(course, pathId)
    return {
      title: course.title,
      status: course.status,
      show_in_career_hub: course.showInCareerHub,
      appears_in_routes: course.routeIds,
      expandedRouteSlugs: expandToPathSlugs(course.routeIds),
      visible: result.visible,
      filteredOutBecause: result.visible ? null : result.reason,
      details: result.details,
    }
  })
}
