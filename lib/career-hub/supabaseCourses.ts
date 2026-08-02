/**
 * Career Hub — load published courses from Supabase and map to listing cards.
 */

import { sortCoursesForCareerHub } from '@/lib/admin/courses/catalogQuery'
import { courseRowToAdminCourse } from '@/lib/admin/courses/mappers'
import type { AdminCourse } from '@/lib/admin/courses/types'
import { resolveLocationSummary } from '@/lib/admin/courses/courseLocations'
import { formatDeliveryModesDisplay, resolveDeliveryModes } from '@/lib/admin/courses/deliveryModes'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  buildCareerHubCourseDebugLog,
  courseVisibleOnCareerHubRoute,
  normalizeRouteSlug,
  type CareerHubCourseDebugEntry,
} from '@/lib/career-hub/courseVisibility'
import type { CareerHubCourseListing, CourseDemandLevel, CourseEntryLevel } from '@/lib/career-hub/types'
import { slugifyCourseName } from '@/lib/career-hub/slug'

const OFFICIAL_UK_COURSE_SEARCH = 'https://nationalcareers.service.gov.uk/find-a-course'

function inferEntryLevel(level: string): CourseEntryLevel {
  const t = level.toLowerCase()
  if (/entry|level 2|starter|basic|beginner/.test(t)) return 'entry'
  if (/advanced|specialist|professional|licence|license|level 3|diploma|degree/.test(t)) return 'advanced'
  return 'intermediate'
}

function entryLabel(level: CourseEntryLevel): string {
  if (level === 'entry') return 'Entry Level Friendly'
  if (level === 'advanced') return 'Advanced Route'
  return 'Some Experience Helpful'
}

function demandForCourse(course: AdminCourse): { demand: CourseDemandLevel; label: string } {
  if (course.partnerCourse || course.featuredCourse) {
    return { demand: 'high', label: 'Recommended' }
  }
  return { demand: 'steady', label: 'Available' }
}

export function adminCourseToCareerHubListing(course: AdminCourse, pathId: string): CareerHubCourseListing {
  const entryLevel = inferEntryLevel(course.level || 'Entry')
  const { demand, label: demandLabel } = demandForCourse(course)
  const slug = `${slugifyCourseName(course.title)}-${course.id.slice(0, 8)}`
  const funding = course.fundingType || course.price || undefined
  const officialUrl = course.officialUrl?.trim() || OFFICIAL_UK_COURSE_SEARCH

  return {
    slug,
    name: course.title,
    pathId,
    description: course.shortDescription || course.fullDescription || course.title,
    location: resolveLocationSummary(course.locationSummary, course.location),
    duration: course.duration || 'Flexible',
    entryLevel,
    entryLevelLabel: entryLabel(entryLevel),
    demand,
    demandLabel,
    type: formatDeliveryModesDisplay(resolveDeliveryModes(course.deliveryModes, course.deliveryMode)),
    funding,
    isExternalOfficial: true,
    officialSearchUrl: officialUrl,
    providerPlaceholder: course.provider || undefined,
    providerUrl: course.officialUrl || undefined,
    affiliateUrl: course.referralUrl || undefined,
    referralPartner: course.partnerCourse ? course.provider : undefined,
    commissionType: course.commissionType === 'none' ? 'none' : 'cpa',
    providers: [],
    comparisonEnabled: false,
    reviewsEnabled: false,
    referralEnabled: Boolean(course.referralUrl),
    adminCourseId: course.id,
    isFeatured: course.featuredCourse,
    isPartner: course.partnerCourse,
    imageUrl: course.imageUrl || undefined,
    publicBadges: course.publicBadges,
  }
}

export type CareerHubCoursesFetchResult = {
  courses: AdminCourse[]
  pathId: string
  debug: CareerHubCourseDebugEntry[]
  supabaseError?: string
}

export async function fetchPublishedCoursesForPath(pathId: string): Promise<CareerHubCoursesFetchResult> {
  const normalizedPath = normalizeRouteSlug(pathId)
  console.log('[CareerHub courses] current route slug:', normalizedPath)

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    console.warn('[CareerHub courses] Supabase service client unavailable')
    return { courses: [], pathId: normalizedPath, debug: [], supabaseError: 'Supabase not configured' }
  }

  const { data, error } = await supabase.from('courses').select('*').order('updated_at', { ascending: false })

  if (error) {
    console.error('[CareerHub courses] Supabase query error:', error.message)
    return { courses: [], pathId: normalizedPath, debug: [], supabaseError: error.message }
  }

  const allRows = data ?? []
  console.log('[CareerHub courses] courses returned from Supabase:', allRows.length)

  for (const row of allRows) {
    console.log('[CareerHub courses] Supabase row:', {
      title: row.title,
      status: row.status,
      show_in_career_hub: row.show_in_career_hub,
      appears_in_routes: row.appears_in_routes,
      category: row.category,
    })
  }

  const allCourses = allRows.map((row) => courseRowToAdminCourse(row))
  const debug = buildCareerHubCourseDebugLog(allCourses, normalizedPath)

  for (const entry of debug) {
    console.log('[CareerHub courses] course check:', entry)
  }

  const matched = sortCoursesForCareerHub(
    allCourses.filter((course) => courseVisibleOnCareerHubRoute(course, normalizedPath))
  )

  console.log('[CareerHub courses] visible for route:', matched.length)

  return { courses: matched, pathId: normalizedPath, debug }
}

export async function fetchCareerHubListingsForPath(pathId: string): Promise<CareerHubCourseListing[]> {
  const { courses } = await fetchPublishedCoursesForPath(pathId)
  const normalizedPath = normalizeRouteSlug(pathId)
  return courses.map((course) => adminCourseToCareerHubListing(course, normalizedPath))
}

export { OFFICIAL_UK_COURSE_SEARCH }
