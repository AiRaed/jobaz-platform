import { trackCourseEvent, type CourseClickAction, type CourseClickSource } from './track'
import { recordCourseInterest } from '@/lib/cv-builder/courseInterest'
import { resolveCourseCtaMode } from '@/lib/career-routes'

export type ApplyUrlInput = {
  referralUrl?: string | null
  providerDefaultReferralUrl?: string | null
  officialUrl?: string | null
  published?: boolean
}

/** Referral → provider default → official. Returns null when no link is available. */
export function resolveApplyUrl(input: ApplyUrlInput): string | null {
  const referral = input.referralUrl?.trim()
  if (referral) return referral

  const providerDefault = input.providerDefaultReferralUrl?.trim()
  if (providerDefault) return providerDefault

  const official = input.officialUrl?.trim()
  if (official) return official

  return null
}

export function canApplyToCourse(input: ApplyUrlInput): boolean {
  return resolveApplyUrl(input) !== null
}

/**
 * Affiliate-first CTA mode from the route-stage framework.
 * Apply Now only when a referral/provider default URL exists.
 */
export function courseCtaMode(input: ApplyUrlInput): 'apply_now' | 'course_type' | 'coming_soon' {
  const referral =
    input.referralUrl?.trim() || input.providerDefaultReferralUrl?.trim() || null
  return resolveCourseCtaMode({
    referralUrl: referral,
    officialUrl: input.officialUrl,
    published: input.published,
  })
}

/** Open apply destination in a new tab and track the click. Never marks qualification complete. */
export function openCourseApply(
  course: ApplyUrlInput & {
    id: string
    title?: string
    providerName?: string
    route?: string | null
  },
  source: CourseClickSource = 'course_detail',
  action: CourseClickAction = 'apply_now'
): boolean {
  if (typeof window === 'undefined') return false

  // Hard rule: never open Apply Now without a real destination URL
  const targetUrl = resolveApplyUrl(course)
  if (!targetUrl) return false
  if (action === 'apply_now' && courseCtaMode(course) === 'coming_soon') return false

  void trackCourseEvent({
    courseId: course.id,
    source,
    action,
    providerName: course.providerName,
    referralUrl: targetUrl,
    route: course.route,
  })

  // Local interest only — clicked/viewed, never completed
  if (course.title) {
    recordCourseInterest({
      courseId: course.id,
      title: course.title,
      status: action === 'view_details' ? 'viewed' : 'clicked',
      source,
      route: course.route,
    })
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer')
  return true
}
