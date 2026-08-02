import type { AdminCourse, CourseDeliveryMode } from '@/lib/admin/courses/types'
import { courseIncludesDeliveryMode, resolveDeliveryModes } from '@/lib/admin/courses/deliveryModes'
import { resolvePublicBadges } from '@/lib/admin/courses/publicBadges'
import type { CareerHubCourseListing } from '@/lib/career-hub/types'
import { getCareerHubEligibleCourses, sortCoursesForCareerHub } from '@/lib/admin/courses/catalogQuery'
import { normalizeRouteSlug } from '@/lib/career-hub/courseVisibility'
import { adminCourseToMarketplaceCourse, marketplaceCourseToListing } from './mapper'

export type MarketplaceFilters = {
  search?: string
  category?: string
  provider?: string
  deliveryMode?: CourseDeliveryMode | 'all'
  fundingType?: string
  route?: string
}

export function filterMarketplaceCourses(
  courses: AdminCourse[],
  filters: MarketplaceFilters
): AdminCourse[] {
  const q = filters.search?.trim().toLowerCase() ?? ''
  const category = filters.category?.trim()
  const provider = filters.provider?.trim().toLowerCase()
  const funding = filters.fundingType?.trim().toLowerCase()
  const route = filters.route ? normalizeRouteSlug(filters.route) : ''

  return getCareerHubEligibleCourses(courses).filter((course) => {
    if (category && category !== 'all' && course.category !== category) return false
    if (provider && provider !== 'all' && course.provider.toLowerCase() !== provider.toLowerCase()) return false
    if (funding && funding !== 'all' && course.fundingType.toLowerCase() !== funding) return false
    if (filters.deliveryMode && filters.deliveryMode !== 'all') {
      const modes = resolveDeliveryModes(course.deliveryModes, course.deliveryMode)
      if (!courseIncludesDeliveryMode(modes, filters.deliveryMode)) return false
    }
    if (route) {
      const slugs = course.routeIds.map((id) => normalizeRouteSlug(id))
      if (!slugs.includes(route)) return false
    }
    if (!q) return true
    const badgeText = resolvePublicBadges(course.publicBadges).join(' ').toLowerCase()
    return (
      course.title.toLowerCase().includes(q) ||
      course.shortDescription.toLowerCase().includes(q) ||
      course.provider.toLowerCase().includes(q) ||
      course.category.toLowerCase().includes(q) ||
      badgeText.includes(q) ||
      course.routeIds.some((id) => id.toLowerCase().includes(q))
    )
  })
}

export function adminCoursesToListings(courses: AdminCourse[]): CareerHubCourseListing[] {
  return sortCoursesForCareerHub(courses).map((course) => {
    const pathId = course.routeIds[0] ?? 'security-facilities'
    return marketplaceCourseToListing(adminCourseToMarketplaceCourse(course, pathId))
  })
}

export function listMarketplaceProviders(courses: AdminCourse[]): string[] {
  const set = new Set<string>()
  for (const c of getCareerHubEligibleCourses(courses)) {
    if (c.provider.trim()) set.add(c.provider.trim())
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
