/**
 * Career Hub marketplace — scalable course commerce types.
 */

import type { CourseCommissionType } from '@/lib/admin/courses/types'
import type { ResolvedPublicOffer } from '@/lib/admin/courses/publicOffer'

/** Full marketplace course (detail page + cards) */
export type MarketplaceCourse = {
  id: string
  slug: string
  title: string
  shortDescription: string
  fullDescription: string
  providerName: string
  location: string
  locationSummary: string
  availableLocations: string[]
  duration: string
  level: string
  price: string
  fundingType: string
  deliveryMode: string
  deliveryModes: string[]
  imageUrl?: string
  officialUrl: string
  referralUrl?: string
  /** Provider-level fallback when course has no referral_url */
  providerDefaultReferralUrl?: string
  isPartner: boolean
  isFeatured: boolean
  routeIds: string[]
  primaryPathId: string
  commissionType: CourseCommissionType
  /** Formatted display labels */
  priceLabel: string
  durationLabel: string
  providerLabel: string
  levelLabel: string
  fundingLabel: string
  deliveryModeLabel: string
  publicBadges: string[]
  coursePurpose: string
  publicOffer: ResolvedPublicOffer
  /** Future: reviews / ratings */
  reviewsEnabled: boolean
  rating?: number
  reviewCount?: number
}

export type MarketplaceCareerOutcome = {
  title: string
  description?: string
}

export type MarketplaceSalaryInfo = {
  starting: string
  experienced: string
  note?: string
  levels?: { label: string; range: string }[]
}

/** Supabase-ready saved course (local mirror until auth sync) */
export type SavedCourseRecord = {
  id: string
  userId?: string | null
  courseId: string
  courseSlug: string
  courseTitle: string
  pathId?: string
  routeLabel?: string
  providerName?: string
  priceLabel?: string
  imageUrl?: string
  status: 'saved' | 'interested' | 'in_progress' | 'completed'
  source: 'career_hub' | 'course_detail' | 'ai_assessment' | 'manual'
  savedAt: string
  updatedAt: string
}

/** Future: saved career routes */
export type SavedRouteRecord = {
  id: string
  userId?: string | null
  pathId: string
  routeLabel: string
  savedAt: string
}

/** Future: saved jobs */
export type SavedJobRecord = {
  id: string
  userId?: string | null
  jobId: string
  jobTitle: string
  savedAt: string
}

export type SavedCareerPlanStore = {
  version: 1
  courses: SavedCourseRecord[]
  routes: SavedRouteRecord[]
  jobs: SavedJobRecord[]
}
