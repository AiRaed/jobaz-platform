import type { CourseOpportunity, OpportunityProvider } from './types'

export const AFFILIATE_READINESS_HELPER =
  'Provider may be approved, but a course is counted as affiliate-ready only after its specific referral link or public listing is confirmed.'

export function hasVerifiedReferralLink(referralUrl: string | null | undefined): boolean {
  return Boolean((referralUrl ?? '').trim())
}

/** Provider option contributes to course-level affiliate readiness. */
export function providerMakesCourseAffiliateReady(provider: OpportunityProvider): boolean {
  const status = provider.affiliateStatus
  const affiliateOk = status === 'Active' || status === 'Approved'
  return affiliateOk && hasVerifiedReferralLink(provider.referralUrl)
}

/**
 * Course-level affiliate readiness — not the same as provider account approval.
 */
export function isCourseAffiliateReady(opp: CourseOpportunity): boolean {
  if (opp.linkedPublishedCourseReferralUrl?.trim() || opp.linkedPublishedCourseOfficialUrl?.trim()) {
    return true
  }
  if (opp.publishStatus === 'Published' || opp.publishedCourseId) return true
  if (opp.opportunityStatus === 'Ready to add') return true
  return opp.providers.some((p) => providerMakesCourseAffiliateReady(p))
}

/** Needs a per-course custom referral link verified by admin. */
export function needsCustomLink(opp: CourseOpportunity): boolean {
  if (!opp.providers.length) return false
  return opp.providers.some(
    (p) => p.affiliateStatus === 'Need follow-up' && !hasVerifiedReferralLink(p.referralUrl)
  )
}

/** @deprecated Use isCourseAffiliateReady — counts provider account only, not course readiness. */
export function hasActiveAffiliateAccount(opp: CourseOpportunity): boolean {
  return opp.providers.some(
    (p) => p.affiliateStatus === 'Active' || p.affiliateStatus === 'Approved'
  )
}

export function summarizeCourseAffiliateReadiness(opp: CourseOpportunity): string {
  if (opp.publishedCourseId) return 'Linked to published course'
  if (isCourseAffiliateReady(opp)) return 'Course ready'
  if (needsCustomLink(opp)) return 'Need custom link'
  const preferred = opp.providers.find((p) => p.isPreferred) ?? opp.providers[0]
  if (!preferred) return 'Unknown'
  return preferred.affiliateStatus
}
