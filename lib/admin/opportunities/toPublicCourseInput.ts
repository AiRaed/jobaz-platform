import type { AdminCourseInput, CourseCommissionType } from '@/lib/admin/courses/types'
import { categoryIdsForPathIds } from '@/lib/admin/courses/routeTargets'
import type { CourseOpportunity } from './types'
import { getPreferredProvider } from './query'
import { routeKeysToPathIds } from './seedOpportunities'
import { OPPORTUNITY_ROUTE_OPTIONS } from './constants'

function mapCommissionType(value: string): CourseCommissionType {
  const v = value.trim().toLowerCase()
  if (v === 'fixed') return 'fixed'
  if (v === 'percentage') return 'percentage'
  if (v === 'per lead') return 'lead'
  return 'none'
}

function resolveCategory(routeKeys: string[]): string {
  const pathIds = routeKeysToPathIds(routeKeys)
  const categoryIds = categoryIdsForPathIds(pathIds)
  if (categoryIds.length) return categoryIds[0]
  const first = OPPORTUNITY_ROUTE_OPTIONS.find((o) => routeKeys.includes(o.routeKey))
  return first?.categoryId ?? routeKeys[0] ?? ''
}

/** Build a draft public course input from an internal opportunity. */
export function opportunityToAdminCourseInput(opp: CourseOpportunity): AdminCourseInput {
  const preferred = getPreferredProvider(opp)
  const routeKeys = opp.routes.map((r) => r.routeKey)
  const routeIds = routeKeysToPathIds(routeKeys)
  const offerLabel = preferred?.publicOfferLabel?.trim() ?? ''

  return {
    title: opp.courseName,
    shortDescription: opp.shortLabel || `${opp.courseName} — add a short description`,
    fullDescription: '',
    category: resolveCategory(routeKeys),
    routeIds,
    provider: preferred?.providerName ?? '',
    location: '',
    locationSummary: '',
    availableLocations: [],
    deliveryMode: 'online',
    deliveryModes: ['online'],
    duration: '',
    level: 'Entry',
    price: '',
    fundingType: '',
    imageUrl: '',
    publicBadges: [],
    coursePurpose: opp.coursePurpose,
    publicOfferEnabled: Boolean(offerLabel),
    publicOfferLabel: offerLabel,
    publicOfferDescription: '',
    publicOfferCode: '',
    publicOfferTerms: '',
    publicOfferExpiresAt: '',
    officialUrl: preferred?.officialUrl ?? '',
    referralUrl: preferred?.referralUrl ?? '',
    commissionType: mapCommissionType(preferred?.commissionType ?? ''),
    commissionValue: preferred?.commissionValue ?? '',
    partnerCourse: Boolean(preferred?.providerName),
    featuredCourse: false,
    priorityOrder: opp.priority,
    status: 'draft',
    showInCareerHub: false,
    internalNotes: [
      opp.notes ? `Opportunity notes: ${opp.notes}` : '',
      opp.nextAction ? `Next action: ${opp.nextAction}` : '',
      `Created from Course Opportunity Tracker (${opp.id})`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}
