/**
 * Rank relevant matched courses by commercial priority / affiliate status.
 * Never promotes irrelevant courses — relevance already filtered by courseMatcher.
 */

import type { JazInventoryCourse } from './courseInventoryAdapter'
import type { JazCommercialStatus, JazMatchedCourse, JazPrimaryButton } from './types'

export function resolveCommercialPresentation(course: JazInventoryCourse): {
  commercial_status: JazCommercialStatus
  primary_button: JazPrimaryButton
  referral_url: string | null
} {
  if (course.referral_url) {
    return {
      commercial_status: 'active_affiliate',
      primary_button: 'Apply Now',
      referral_url: course.referral_url,
    }
  }

  if (course.affiliate_status === 'planned_affiliate' || course.affiliate_status === 'coming_soon') {
    return {
      commercial_status: course.affiliate_status === 'planned_affiliate' ? 'planned_affiliate' : 'coming_soon',
      primary_button: 'Coming Soon',
      referral_url: null,
    }
  }

  if (course.official_url) {
    return {
      commercial_status: 'no_link',
      primary_button: 'Learn More',
      referral_url: null,
    }
  }

  return {
    commercial_status: 'coming_soon',
    primary_button: 'Save Interest',
    referral_url: null,
  }
}

/** Lower is better */
export function commercialRankScore(course: JazInventoryCourse): number {
  const statusBoost =
    course.affiliate_status === 'active_affiliate'
      ? 0
      : course.affiliate_status === 'planned_affiliate'
        ? 10
        : course.affiliate_status === 'coming_soon'
          ? 20
          : 30
  // Lower priorityOrder = higher commercial priority in Admin
  return statusBoost + (course.commercial_priority ?? 50)
}

export function rankRelevantCourses(
  items: Array<{ course: JazInventoryCourse; score: number }>
): Array<{ course: JazInventoryCourse; score: number }> {
  return [...items].sort((a, b) => {
    // Relevance dominates
    if (b.score !== a.score) return b.score - a.score
    return commercialRankScore(a.course) - commercialRankScore(b.course)
  })
}

export function assertNoFakeApplyNow(matched: JazMatchedCourse[]): JazMatchedCourse[] {
  return matched.map((m) => {
    if (m.primary_button === 'Apply Now' && !m.referral_url) {
      return {
        ...m,
        primary_button: 'Coming Soon',
        commercial_status: m.commercial_status === 'active_affiliate' ? 'coming_soon' : m.commercial_status,
        referral_url: null,
      }
    }
    return m
  })
}
