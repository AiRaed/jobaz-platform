/**
 * Gap / recommendation-only cards for WIP (never fake Apply Now).
 */

import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { buildGoogleCourseSearchUrl } from '@/lib/recommendations/googleSearch'
import type { WipCourseGroup, WipGapCourseType } from './gap-course-catalog'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function buildWipMissingCourseTypeCard(input: {
  course: WipGapCourseType
  fieldName: string
  specialismName: string
  index: number
}): RecommendationCourseCardData {
  const route = `${input.specialismName} · ${input.fieldName}`
  const keywords = `${input.course.title} course UK ${input.fieldName}`
  return {
    id: `wip-gap-${slugify(input.course.title)}-${input.index}`,
    title: input.course.title,
    shortDescription:
      input.course.notes ||
      `Recommended for ${route}. Provider not listed on JobAZ yet.`,
    whyRecommended: input.course.notes
      ? input.course.notes
      : `Useful next step for your ${route} route.`,
    bestFor: route,
    purpose: input.course.purpose,
    visibilityStatus: 'recommendation_only',
    commercialStatus: 'no_link',
    recommendationType: 'course_type',
    badge: 'Coming soon',
    statusMessage: 'Provider not listed yet — save interest or search courses later.',
    suggestedSearchKeywords: keywords,
    googleSearchUrl: buildGoogleCourseSearchUrl(keywords),
    priority: input.course.priority,
    matchScore: Math.min(40, Math.round(input.course.priority / 2.5)),
    canAddToRoadmap: true,
  }
}

export function groupLabel(group: WipCourseGroup): string {
  if (group === 'required_licence') return 'Required licence / check'
  if (group === 'recommended_next') return 'Recommended next'
  if (group === 'useful_boosters') return 'Useful boosters'
  return 'Checks'
}
