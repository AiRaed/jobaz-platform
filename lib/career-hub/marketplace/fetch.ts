import { courseRowToAdminCourse } from '@/lib/admin/courses/mappers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { getCareerHubEligibleCourses, sortCoursesForCareerHub } from '@/lib/admin/courses/catalogQuery'
import { courseVisibleOnCareerHubRoute } from '@/lib/career-hub/courseVisibility'
import { adminCourseToMarketplaceCourse, marketplaceCourseToListing } from './mapper'
import { adminCoursesToListings, filterMarketplaceCourses, type MarketplaceFilters } from './query'
import { courseMatchesSlug } from './slug'
import type { MarketplaceCourse } from './types'
import type { CareerHubCourseListing } from '@/lib/career-hub/types'

async function fetchAllAdminCourses() {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    const { publishedLaunchCourses } = await import('@/lib/admin/courses/seedCatalog')
    const ts = new Date().toISOString()
    return publishedLaunchCourses().map((c) => ({
      ...c,
      clicks: 0,
      saves: 0,
      createdAt: ts,
      updatedAt: ts,
    }))
  }

  const { data, error } = await supabase.from('courses').select('*').order('updated_at', { ascending: false })
  if (error || !data?.length) return []
  return data.map((row) => courseRowToAdminCourse(row))
}

export async function fetchAllPublishedMarketplaceCourses(): Promise<MarketplaceCourse[]> {
  const courses = getCareerHubEligibleCourses(await fetchAllAdminCourses())
  return sortCoursesForCareerHub(courses).map((course) =>
    adminCourseToMarketplaceCourse(course, course.routeIds[0] ?? 'security-facilities')
  )
}

export async function fetchMarketplaceListings(
  filters: MarketplaceFilters = {}
): Promise<CareerHubCourseListing[]> {
  const all = await fetchAllAdminCourses()
  const filtered = filterMarketplaceCourses(all, filters)
  return adminCoursesToListings(filtered)
}

export async function fetchMarketplaceCourseBySlug(slug: string): Promise<MarketplaceCourse | null> {
  const courses = await fetchAllAdminCourses()

  for (const admin of courses) {
    if (!courseMatchesSlug(admin.title, admin.id, slug)) continue
    if ((admin.status ?? '').trim().toLowerCase() !== 'published') continue
    if (!admin.showInCareerHub) continue
    const pathId = admin.routeIds[0] ?? 'security-facilities'
    return adminCourseToMarketplaceCourse(admin, pathId)
  }

  return null
}

export async function fetchMarketplaceCoursesForPath(pathId: string): Promise<MarketplaceCourse[]> {
  const courses = await fetchAllAdminCourses()
  const eligible = courses.filter((course) => courseVisibleOnCareerHubRoute(course, pathId))

  return sortCoursesForCareerHub(eligible).map((course) =>
    adminCourseToMarketplaceCourse(course, pathId)
  )
}

export async function fetchListingsForPath(pathId: string): Promise<CareerHubCourseListing[]> {
  const courses = await fetchMarketplaceCoursesForPath(pathId)
  return courses.map(marketplaceCourseToListing)
}

export async function fetchListingBySlug(slug: string): Promise<CareerHubCourseListing | null> {
  const course = await fetchMarketplaceCourseBySlug(slug)
  return course ? marketplaceCourseToListing(course) : null
}
