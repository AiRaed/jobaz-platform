import type { AdminCourse } from '@/lib/admin/courses/types'
import { resolveDeliveryModes } from '@/lib/admin/courses/deliveryModes'
import { resolveLocationSummary } from '@/lib/admin/courses/courseLocations'
import { normalizeCoursePurpose } from '@/lib/admin/courses/coursePurpose'
import { resolvePublicOffer } from '@/lib/admin/courses/publicOffer'
import type { CareerHubCourseListing } from '@/lib/career-hub/types'
import {
  formatDeliveryModeLabel,
  formatDeliveryModesLabel,
  formatDurationLabel,
  formatFundingLabel,
  formatLevelLabel,
  formatPriceLabel,
  formatProviderName,
} from './formatters'
import { courseSlugFromTitle } from './slug'
import { getProviderDefaultReferralUrl } from './providers'
import type { MarketplaceCourse } from './types'

const OFFICIAL_UK_SEARCH = 'https://nationalcareers.service.gov.uk/find-a-course'

export function adminCourseToMarketplaceCourse(
  course: AdminCourse,
  primaryPathId: string
): MarketplaceCourse {
  const priceLabel = formatPriceLabel(course.price)
  const durationLabel = formatDurationLabel(course.duration)
  const providerLabel = formatProviderName(course.provider)
  const levelLabel = formatLevelLabel(course.level)
  const fundingLabel = formatFundingLabel(course.fundingType, course.price)

  const deliveryModes = resolveDeliveryModes(course.deliveryModes, course.deliveryMode)
  const publicOffer = resolvePublicOffer(course)
  const locationSummary = resolveLocationSummary(course.locationSummary, course.location)
  const availableLocations = course.availableLocations ?? []

  return {
    id: course.id,
    slug: courseSlugFromTitle(course.title),
    title: course.title,
    shortDescription: course.shortDescription || course.fullDescription || course.title,
    fullDescription: course.fullDescription || course.shortDescription || '',
    providerName: course.provider,
    location: locationSummary,
    locationSummary,
    availableLocations,
    duration: course.duration,
    level: course.level,
    price: course.price,
    fundingType: course.fundingType,
    deliveryMode: deliveryModes[0] ?? course.deliveryMode,
    deliveryModes,
    imageUrl: course.imageUrl || undefined,
    officialUrl: course.officialUrl?.trim() || OFFICIAL_UK_SEARCH,
    referralUrl: course.referralUrl?.trim() || undefined,
    providerDefaultReferralUrl: getProviderDefaultReferralUrl(course.provider),
    isPartner: course.partnerCourse,
    isFeatured: course.featuredCourse,
    routeIds: course.routeIds,
    primaryPathId,
    commissionType: course.commissionType,
    priceLabel,
    durationLabel,
    providerLabel,
    levelLabel,
    fundingLabel,
    deliveryModeLabel: formatDeliveryModesLabel(deliveryModes),
    publicBadges: course.publicBadges ?? [],
    coursePurpose: normalizeCoursePurpose(course.coursePurpose),
    publicOffer,
    reviewsEnabled: false,
  }
}

export function marketplaceCourseToListing(course: MarketplaceCourse): CareerHubCourseListing {
  return {
    slug: course.slug,
    name: course.title,
    pathId: course.primaryPathId,
    description: course.shortDescription,
    location: course.location,
    duration: course.durationLabel,
    entryLevel: 'entry',
    entryLevelLabel: course.levelLabel,
    demand: course.isFeatured || course.isPartner ? 'high' : 'steady',
    demandLabel: course.isFeatured ? 'Featured' : course.isPartner ? 'Partner' : 'Available',
    type: course.deliveryModeLabel,
    funding: course.fundingLabel,
    priceLabel: course.priceLabel,
    officialSearchUrl: course.officialUrl,
    providerPlaceholder: course.providerLabel,
    providerUrl: course.officialUrl,
    affiliateUrl: course.referralUrl,
    referralPartner: course.isPartner ? course.providerName : undefined,
    commissionType: course.commissionType === 'none' ? 'none' : 'cpa',
    providers: [],
    comparisonEnabled: false,
    reviewsEnabled: course.reviewsEnabled,
    referralEnabled: Boolean(course.referralUrl || course.officialUrl),
    adminCourseId: course.id,
    isFeatured: course.isFeatured,
    isPartner: course.isPartner,
    imageUrl: course.imageUrl,
    publicBadges: course.publicBadges,
    coursePurpose: course.coursePurpose,
    publicOffer: course.publicOffer,
    marketplace: course,
  }
}
