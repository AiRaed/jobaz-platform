/**
 * Map JAZ Career Engine analyse result → JobAZPlan for existing UI / My Plan handoff.
 */

import type {
  JobAZPlan,
  JobAZTrainingItem,
  JobAZWorkNowRole,
} from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import type { JazAnalyseResult, JazMatchedCourse } from './types'

function jobFinderHref(title: string): string {
  return `/job-finder?query=${encodeURIComponent(title)}`
}

function commercialToCardStatus(
  m: JazMatchedCourse
): Pick<
  RecommendationCourseCardData,
  'commercialStatus' | 'visibilityStatus' | 'referralUrl' | 'badge' | 'statusMessage'
> {
  if (m.primary_button === 'Apply Now' && m.referral_url) {
    return {
      commercialStatus: 'affiliate_ready',
      visibilityStatus: 'public_listed',
      referralUrl: m.referral_url,
      badge: 'Apply Now',
      statusMessage: undefined,
    }
  }
  if (
    m.primary_button === 'Coming Soon' ||
    m.commercial_status === 'coming_soon' ||
    m.commercial_status === 'planned_affiliate'
  ) {
    return {
      commercialStatus: 'no_link',
      visibilityStatus: 'recommendation_only',
      referralUrl: undefined,
      badge: 'Coming Soon',
      statusMessage: 'Save interest — affiliate link coming soon.',
    }
  }
  if (m.primary_button === 'Learn More' && m.official_url) {
    return {
      commercialStatus: 'official_link',
      visibilityStatus: 'recommendation_only',
      referralUrl: undefined,
      badge: 'Learn More',
      statusMessage: undefined,
    }
  }
  return {
    commercialStatus: 'no_link',
    visibilityStatus: 'recommendation_only',
    referralUrl: undefined,
    badge: 'Save Interest',
    statusMessage: 'Relevant course type — link not configured yet.',
  }
}

function matchedToCard(m: JazMatchedCourse, index: number): RecommendationCourseCardData {
  const status = commercialToCardStatus(m)
  return {
    id: m.course_id || `jaz-course-${index}`,
    publishedCourseId: m.course_id || undefined,
    slug: m.slug || undefined,
    title: m.title,
    shortDescription: m.match_reason,
    whyRecommended: m.match_reason,
    visibilityStatus: status.visibilityStatus,
    commercialStatus: status.commercialStatus,
    recommendationType: 'course_type',
    badge: status.badge,
    statusMessage: status.statusMessage,
    referralUrl: status.referralUrl,
    officialUrl: m.official_url || undefined,
    suggestedSearchKeywords: m.title,
    priority: index + 1,
    matchScore: 80 - index * 5,
    canAddToRoadmap: true,
  }
}

function trainingFromMatched(
  m: JazMatchedCourse | undefined,
  fallbackTitle: string,
  fallbackReason: string
): JobAZTrainingItem | null {
  if (m) {
    const hasApply = Boolean(m.referral_url && m.primary_button === 'Apply Now')
    const comingSoon =
      m.commercial_status === 'coming_soon' || m.commercial_status === 'planned_affiliate'
    return {
      title: m.title,
      why_recommended: m.match_reason || fallbackReason,
      type: hasApply ? 'published_course' : comingSoon ? 'recommendation_only' : 'course_type',
      id: m.course_id,
      apply_url: hasApply ? m.referral_url || undefined : undefined,
      official_url: m.official_url || undefined,
      published_course_id: m.course_id,
      action_label: hasApply
        ? 'Apply Now'
        : comingSoon
          ? 'View recommendation'
          : 'Search / Add to roadmap',
      badge: m.primary_button,
      no_published_provider: !hasApply,
      provider_name: m.provider || undefined,
    }
  }
  if (!fallbackTitle) return null
  return {
    title: fallbackTitle,
    why_recommended: fallbackReason,
    type: 'course_type',
    action_label: 'Search / Add to roadmap',
    no_published_provider: true,
  }
}

export function mapJazAnalyseToJobAZPlan(
  result: JazAnalyseResult,
  opts?: { pathId?: string; coachNotes?: string }
): JobAZPlan {
  const cards = result.matched_jobaz_courses.map(matchedToCard)
  const primaryType = result.recommended_course_types.find((t) => t.priority === 'primary')
  const primaryMatched = result.matched_jobaz_courses[0]
  const training_next = trainingFromMatched(
    primaryMatched,
    result.next_upgrade || primaryType?.title || '',
    primaryType?.reason || result.why_this_route_fits
  )

  const work_now: JobAZWorkNowRole[] = result.work_now_roles.map((r) => ({
    title: r.title,
    why_it_matches: r.why,
    estimated_pay_range: r.pay_range || 'Varies by employer',
    action_label: 'View jobs',
    href: jobFinderHref(r.job_search_terms[0] || r.title),
  }))

  const optional_training = result.recommended_course_types
    .filter((t) => t.priority !== 'primary')
    .slice(0, 3)
    .map((t) => ({
      title: t.title,
      why_useful: t.reason,
      type: 'course_type' as const,
    }))

  const after_training = result.recommended_course_types
    .flatMap((t) => t.related_roles)
    .filter(Boolean)
    .slice(0, 4)
    .map((title) => ({ title, href: jobFinderHref(title) }))

  const this_week_plan = result.first_action_plan.map((a) => a.step).slice(0, 5)
  if (this_week_plan.length === 0) {
    this_week_plan.push(`Search for ${result.current_focus}`, `Plan ${result.next_upgrade}`)
  }

  return {
    version: 1,
    source_path_id: opts?.pathId || 'jaz_career_engine',
    route_summary: {
      route_title: result.route_title,
      one_sentence_summary: opts?.coachNotes || result.why_this_route_fits,
      current_target_role: result.current_focus,
      next_upgrade_role: result.next_upgrade,
      readiness_score: result.readiness,
    },
    work_now,
    training_next,
    optional_training,
    after_training,
    cv_action: `Focus your CV on ${result.cv_focus}.`,
    cv_target_role: result.current_focus,
    this_week_plan,
    dashboard_handoff: {
      save_label: 'Save to My Plan',
      open_dashboard_label: 'Open My Plan',
      continue_guest_label: 'Continue as guest',
    },
    structured_cards: cards,
  }
}
