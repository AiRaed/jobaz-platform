/**
 * Adapt Admin Course Inventory into engine-friendly inventory records.
 */

import type { AdminCourse } from '@/lib/admin/courses/types'
import { loadServerPublishedCourses } from '@/lib/recommendations/opportunityPool'

export type JazInventoryCourse = {
  course_id: string
  title: string
  provider: string
  category: string
  related_routes: string[]
  related_goals: string[]
  related_roles: string[]
  related_skills: string[]
  pathway_stage: string
  delivery_modes: string[]
  commercial_priority: number
  affiliate_status: 'active_affiliate' | 'planned_affiliate' | 'no_link' | 'coming_soon'
  referral_url: string | null
  official_url: string | null
  is_published: boolean
  is_active: boolean
  slug?: string | null
  short_description?: string
  purpose?: string
}

function hasHttpUrl(url: string | null | undefined): boolean {
  const t = (url || '').trim()
  return /^https?:\/\//i.test(t)
}

export function adaptAdminCourse(course: AdminCourse): JazInventoryCourse {
  const referral = hasHttpUrl(course.referralUrl) ? course.referralUrl.trim() : null
  const official = hasHttpUrl(course.officialUrl) ? course.officialUrl.trim() : null
  const partnerish = Boolean(course.partnerCourse || course.featuredCourse)

  let affiliate_status: JazInventoryCourse['affiliate_status'] = 'no_link'
  if (referral) affiliate_status = 'active_affiliate'
  else if (partnerish || course.showInCareerHub) affiliate_status = 'planned_affiliate'
  else if (course.status === 'published') affiliate_status = 'coming_soon'

  return {
    course_id: course.id,
    title: course.title,
    provider: course.provider || 'JobAZ partner',
    category: course.category || '',
    related_routes: course.routeIds ?? [],
    related_goals: [],
    related_roles: [],
    related_skills: [],
    pathway_stage: course.coursePurpose || 'upgrade',
    delivery_modes: (course.deliveryModes?.length
      ? course.deliveryModes
      : [course.deliveryMode]
    ).filter(Boolean),
    commercial_priority: Number.isFinite(course.priorityOrder) ? course.priorityOrder : 50,
    affiliate_status,
    referral_url: referral,
    official_url: official,
    is_published: course.status === 'published',
    is_active: course.status === 'published' && course.showInCareerHub !== false,
    slug: null,
    short_description: course.shortDescription,
    purpose: course.coursePurpose,
  }
}

export async function loadJazCourseInventory(): Promise<JazInventoryCourse[]> {
  const published = await loadServerPublishedCourses()
  return published.map(adaptAdminCourse)
}
