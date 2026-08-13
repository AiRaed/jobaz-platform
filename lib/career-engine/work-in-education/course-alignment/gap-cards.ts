/**
 * Public-safe gap cards when WIE has no aligned Course Library match.
 * Suggested course types only — never fake Apply Now / referral URLs.
 */

import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { buildGoogleCourseSearchUrl } from '@/lib/recommendations/googleSearch'
import type { SuggestedCourseType } from './suggested-course-types'
import type { WieCoverageStatus } from './coverage'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function buildWieMissingCourseTypeCards(input: {
  suggestions: SuggestedCourseType[]
  fieldName: string
  specialismName?: string | null
  coverageStatus: WieCoverageStatus
  limit?: number
}): RecommendationCourseCardData[] {
  const limit = input.limit ?? 3
  const route = [input.specialismName, input.fieldName].filter(Boolean).join(' · ')

  return input.suggestions.slice(0, limit).map((s, index) => {
    const keywords = `${s.title} course UK ${input.fieldName}`
    const isBridgeOnly =
      input.coverageStatus === 'partially_covered' &&
      (s.purpose === 'uk_workplace_bridge' || s.priority === 'low')

    return {
      id: `wie-gap-${slugify(s.title)}-${index}`,
      title: s.title,
      shortDescription: s.note
        ? s.note
        : `Recommended course type for ${route}. Provider not listed on JobAZ yet.`,
      whyRecommended: isBridgeOnly
        ? `Optional UK workplace / CV bridge for ${route} — useful, but not a primary specialism match.`
        : `Recommended for your Work in My Education route (${route}). JobAZ does not have a partner provider listed yet.`,
      bestFor: route,
      purpose: s.purpose,
      visibilityStatus: 'recommendation_only',
      commercialStatus: 'no_link',
      recommendationType: 'course_type',
      badge: 'Coming soon',
      statusMessage: 'Provider not listed yet — save interest or search courses later. Never use a fake Apply Now.',
      suggestedSearchKeywords: keywords,
      googleSearchUrl: buildGoogleCourseSearchUrl(keywords),
      priority: s.priority === 'high' ? 70 : s.priority === 'medium' ? 50 : 30,
      matchScore: isBridgeOnly ? 28 : s.priority === 'high' ? 36 : 32,
      canAddToRoadmap: true,
    }
  })
}

/** Prefer specialism → field → bridge → professional → CPD when ranking real cards. */
export function wieMatchTierBoost(card: {
  title: string
  purpose?: string
  matchScore: number
  commercialStatus?: string
}): number {
  let boost = card.matchScore
  const purpose = (card.purpose ?? '').toLowerCase()
  if (/career.?bridge|career starter/i.test(purpose)) boost += 12
  if (/professional|advanced/i.test(purpose)) boost += 8
  if (/uk.?workplace|cv booster|employability/i.test(purpose)) boost += 4
  if (/cpd/i.test(purpose)) boost += 2
  // Never prefer commercial emptiness into primary — affiliate is fine but not required
  if (card.commercialStatus === 'affiliate_ready') boost += 3
  return boost
}
