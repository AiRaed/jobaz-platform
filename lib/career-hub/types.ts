/**
 * Career Hub — Phase 1 types (future-ready for providers & referrals).
 */

export type CareerPlanItemStatus =
  | 'recommended'
  | 'saved'
  | 'interested'
  | 'in_progress'
  | 'completed'

export type CareerPlanItemSource = 'ai_assessment' | 'career_hub' | 'manual'

/** User's saved training plan entry */
export type CareerPlanItem = {
  id: string
  courseName: string
  courseSlug: string
  pathId?: string
  routeLabel?: string
  icon?: string
  status: CareerPlanItemStatus
  source: CareerPlanItemSource
  /** 1 = top priority (gold), 2, 3 */
  priority?: number
  addedAt: string
  updatedAt: string
  /** Phase 2+ referral / provider fields */
  providerId?: string
  providerUrl?: string
  referralUrl?: string
  affiliateUrl?: string
  referralPartner?: string
  commissionType?: 'cpa' | 'cpl' | 'revenue_share' | 'none'
  priceFrom?: string
  startDate?: string
  /** Supabase marketplace course id when known */
  courseId?: string
  startedAt?: string
  completedAt?: string
}

export type CourseDemandLevel = 'high' | 'medium' | 'steady'
export type CourseEntryLevel = 'entry' | 'intermediate' | 'advanced'

/** Enriched course listing — placeholder data in Phase 1 */
export type CareerHubCourseListing = {
  slug: string
  name: string
  pathId: string
  description: string
  location: string
  duration: string
  entryLevel: CourseEntryLevel
  entryLevelLabel: string
  demand: CourseDemandLevel
  demandLabel: string
  type: string
  funding?: string
  /** External official search (e.g. National Careers Service) */
  isExternalOfficial?: boolean
  officialSearchUrl?: string
  providerPlaceholder?: string
  /** Phase 2+ referral fields */
  providerUrl?: string
  affiliateUrl?: string
  referralPartner?: string
  commissionType?: 'cpa' | 'cpl' | 'revenue_share' | 'none'
  /** Reserved — Phase 2+ */
  providers?: CareerHubProviderSlot[]
  comparisonEnabled?: boolean
  reviewsEnabled?: boolean
  referralEnabled?: boolean
  /** Supabase admin course id */
  adminCourseId?: string
  isFeatured?: boolean
  isPartner?: boolean
  imageUrl?: string
  priceLabel?: string
  /** Public pill badges for course cards */
  publicBadges?: string[]
  /** Career Assistant course purpose label */
  coursePurpose?: string
  /** Public partner offer for course cards */
  publicOffer?: import('@/lib/admin/courses/publicOffer').ResolvedPublicOffer
  /** Full marketplace record when loaded from Supabase */
  marketplace?: import('./marketplace/types').MarketplaceCourse
}

/** Placeholder slot for future provider listings */
export type CareerHubProviderSlot = {
  id: string
  name: string
  location: string
  priceFrom?: string
  startDate?: string
  referralUrl?: string
  affiliateUrl?: string
  providerUrl?: string
  referralPartner?: string
  commissionType?: 'cpa' | 'cpl' | 'revenue_share' | 'none'
  rating?: number
  reviewCount?: number
  featured?: boolean
}

export type CareerHubRouteCategory = {
  id: string
  label: string
  description: string
  icon: string
  pathIds: string[]
}
