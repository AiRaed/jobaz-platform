import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { CommercialStatus, RecommendationCourseCardData, VisibilityStatus } from './types'
import { buildGoogleCourseSearchUrl } from './googleSearch'

export const VISIBILITY_STATUS_OPTIONS: VisibilityStatus[] = [
  'internal',
  'recommendation_only',
  'public_listed',
]

export const COMMERCIAL_STATUS_CARD_OPTIONS: CommercialStatus[] = [
  'no_link',
  'official_link',
  'affiliate_ready',
]

export function normalizeVisibilityStatus(value: string | null | undefined): VisibilityStatus {
  const v = (value ?? '').trim().toLowerCase()
  if (v === 'recommendation_only' || v === 'public_listed' || v === 'internal') return v
  return 'internal'
}

export function normalizeCommercialStatus(value: string | null | undefined): CommercialStatus {
  const v = (value ?? '').trim().toLowerCase()
  if (v === 'official_link' || v === 'affiliate_ready' || v === 'no_link') return v
  if (v === 'affiliate_potential' || v === 'research_needed' || v === 'active') return 'no_link'
  return 'no_link'
}

function preferredProvider(opp: CourseOpportunity) {
  return opp.providers.find((p) => p.isPreferred) ?? opp.providers[0]
}

export function resolveOpportunityUrls(opp: CourseOpportunity): {
  referralUrl: string
  officialUrl: string
  publicOfferLabel: string
} {
  const provider = preferredProvider(opp)
  return {
    referralUrl: (opp.linkedPublishedCourseReferralUrl || provider?.referralUrl || '').trim(),
    officialUrl: (opp.linkedPublishedCourseOfficialUrl || provider?.officialUrl || '').trim(),
    publicOfferLabel: (provider?.publicOfferLabel || '').trim(),
  }
}

export function resolveCommercialStatusForOpportunity(opp: CourseOpportunity): CommercialStatus {
  const stored = normalizeCommercialStatus(opp.commercialStatus)
  const { referralUrl, officialUrl } = resolveOpportunityUrls(opp)
  if (referralUrl) return 'affiliate_ready'
  if (officialUrl) return 'official_link'
  return stored
}

export function resolveVisibilityForOpportunity(opp: CourseOpportunity): VisibilityStatus {
  if (opp.publishedCourseId && opp.publishStatus === 'Published') return 'public_listed'
  if (opp.visibilityStatus) return normalizeVisibilityStatus(opp.visibilityStatus)
  return 'internal'
}

export function resolveRecommendationBadge(
  visibilityStatus: VisibilityStatus,
  commercialStatus: CommercialStatus
): string {
  if (commercialStatus === 'affiliate_ready') return 'JobAZ Partner'
  if (commercialStatus === 'official_link') return 'Official course link'
  if (visibilityStatus === 'recommendation_only') return 'Recommended course type'
  return 'Recommended training'
}

export function resolveStatusMessage(commercialStatus: CommercialStatus): string | undefined {
  if (commercialStatus === 'affiliate_ready') return undefined
  if (commercialStatus === 'official_link') return 'No JobAZ partner offer yet.'
  return 'JobAZ does not currently have a partner provider for this course. You can search and compare providers.'
}

export function opportunityToRecommendationCard(
  opp: CourseOpportunity,
  matchScore: number,
  whyRecommended?: string
): RecommendationCourseCardData | null {
  const visibilityStatus = resolveVisibilityForOpportunity(opp)
  if (visibilityStatus === 'internal') return null
  if (!opp.canBeCourseCard) return null

  const commercialStatus = resolveCommercialStatusForOpportunity(opp)
  const { referralUrl, officialUrl, publicOfferLabel } = resolveOpportunityUrls(opp)
  const keywords = opp.suggestedSearchKeywords.trim() || `${opp.courseName} course UK`

  return {
    id: opp.id,
    opportunityId: opp.id,
    publishedCourseId: opp.publishedCourseId ?? undefined,
    slug: opp.linkedPublishedCourseSlug,
    title: opp.linkedPublishedCourseTitle?.trim() || opp.courseName,
    shortDescription: opp.adminNotes || opp.coursePurpose || opp.notes,
    whyRecommended: whyRecommended || opp.adminNotes || opp.notes || 'Matched to your education background and UK career goals.',
    bestFor: opp.specialisations.slice(0, 3).join(' · ') || undefined,
    level: opp.coursePurpose || undefined,
    purpose: opp.coursePurpose || undefined,
    visibilityStatus,
    commercialStatus,
    recommendationType: (opp.recommendationType as RecommendationCourseCardData['recommendationType']) || 'course_type',
    badge: resolveRecommendationBadge(visibilityStatus, commercialStatus),
    statusMessage: resolveStatusMessage(commercialStatus),
    referralUrl: referralUrl || undefined,
    officialUrl: officialUrl || undefined,
    publicOfferLabel: publicOfferLabel || undefined,
    suggestedSearchKeywords: keywords,
    googleSearchUrl:
      commercialStatus === 'no_link' ? buildGoogleCourseSearchUrl(keywords) : undefined,
    priority: opp.priority,
    matchScore,
    canAddToRoadmap: true,
  }
}
