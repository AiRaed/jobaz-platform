import type { CourseOpportunity } from './types'
import {
  isCourseAffiliateReady,
  needsCustomLink,
} from './affiliateReadiness'
import {
  normalizeCommercialStatus,
  normalizeVisibilityStatus,
  resolveCommercialStatusForOpportunity,
  resolveVisibilityForOpportunity,
} from '@/lib/recommendations/visibility'
import {
  classifyOpportunityLike,
  type WieAdminBadge,
} from '@/lib/career-engine/work-in-education/course-alignment'
import { isGeneratedWieCourseOpportunity } from './seedWieGeneratedCourseTypes'
import {
  opportunityMatchesEducationField,
  opportunityMatchesSpecialism,
  opportunityMatchesStage,
  opportunityPassesWieContaminationGate,
} from './wieTrackerFilters'
import {
  isGeneratedWipCourseOpportunity,
  isWorkInProfessionOpportunity,
  opportunityMatchesGoalPath,
  opportunityMatchesProfessionField,
  opportunityMatchesProfessionSpecialism,
  opportunityMatchesProfessionalLevel,
  opportunityPassesWipContaminationGate,
} from './wipTrackerFilters'

export type OpportunityQuickView =
  | 'all'
  | 'high-priority'
  | 'need-provider'
  | 'affiliate-ready'
  | 'needs-custom-link'
  | 'ready-to-add'
  | 'published'
  | 'later'
  | 'recommendation-cards'
  | 'wie-aligned'
  | 'wie-not-aligned'
  | 'wie-needs-mapping'
  | 'wie-contamination'
  | 'wie-needs-provider'
  | 'wie-generated'
  | 'wie-affiliate-ready'
  | 'wip-aligned'
  | 'wip-generated'
  | 'wip-needs-provider'
  | 'wip-affiliate-ready'

export type OpportunityFilters = {
  search: string
  routeKey: string
  coursePurpose: string
  opportunityStatus: string
  affiliateStatus: string
  publishStatus: string
  provider: string
  visibilityStatus: string
  commercialStatus: string
  canBeCourseCard: string
  educationField: string
  specialisation: string
  /** WIE stage filter value from WIE_STAGE_FILTER_OPTIONS, or 'all' */
  stage?: string
  wieBadge?: string
  /** Goal path key, e.g. work_in_profession */
  goalPath?: string
  /** Profession library field label for WIP filters */
  professionField?: string
  /** Profession specialism label for WIP filters */
  professionSpecialism?: string
  /** Professional level key for WIP filters */
  professionalLevel?: string
  quickView?: OpportunityQuickView
}

export type OpportunitySummary = {
  total: number
  highPriority: number
  needProvider: number
  courseAffiliateReady: number
  readyToAdd: number
  published: number
  duplicatePublishedLinks: number
}

export function isLinkedToPublishedCourse(opp: CourseOpportunity): boolean {
  return Boolean(opp.publishedCourseId)
}

export function isHighPriority(opp: CourseOpportunity): boolean {
  return opp.priority >= 70
}

export function isPublishedOpportunity(opp: CourseOpportunity): boolean {
  return opp.publishStatus === 'Published' || Boolean(opp.publishedCourseId)
}

export function needsProvider(opp: CourseOpportunity): boolean {
  if (isPublishedOpportunity(opp)) return false
  return opp.opportunityStatus === 'Need provider' || opp.providers.length === 0
}

export function isReadyToAdd(opp: CourseOpportunity): boolean {
  if (isPublishedOpportunity(opp)) return false
  return opp.opportunityStatus === 'Ready to add' || opp.publishStatus === 'Ready to publish'
}

export function isLaterOpportunity(opp: CourseOpportunity): boolean {
  return opp.opportunityStatus === 'Later' || opp.publishStatus === 'Later'
}

export function isRecommendationCardOpportunity(opp: CourseOpportunity): boolean {
  return normalizeVisibilityStatus(opp.visibilityStatus) === 'recommendation_only'
}

/** Unique published courses linked + unlinked rows marked Published. */
export function countPublishedSummary(opportunities: CourseOpportunity[]): number {
  const linkedCourseIds = new Set<string>()
  let standalonePublished = 0

  for (const opp of opportunities) {
    if (opp.publishedCourseId) {
      linkedCourseIds.add(opp.publishedCourseId)
    } else if (opp.publishStatus === 'Published') {
      standalonePublished += 1
    }
  }

  return linkedCourseIds.size + standalonePublished
}

export function findDuplicatePublishedLinks(
  opportunities: CourseOpportunity[]
): Array<{ publishedCourseId: string; opportunityIds: string[] }> {
  const byCourse = new Map<string, string[]>()

  for (const opp of opportunities) {
    if (!opp.publishedCourseId) continue
    const list = byCourse.get(opp.publishedCourseId) ?? []
    list.push(opp.id)
    byCourse.set(opp.publishedCourseId, list)
  }

  return [...byCourse.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([publishedCourseId, opportunityIds]) => ({ publishedCourseId, opportunityIds }))
}

export function matchesQuickView(opp: CourseOpportunity, view: OpportunityQuickView): boolean {
  const wie = view.startsWith('wie-') ? classifyOpportunityLike(opp) : null
  switch (view) {
    case 'all':
      return true
    case 'high-priority':
      return isHighPriority(opp)
    case 'need-provider':
      return needsProvider(opp)
    case 'affiliate-ready':
      return isCourseAffiliateReady(opp)
    case 'needs-custom-link':
      return needsCustomLink(opp)
    case 'ready-to-add':
      return isReadyToAdd(opp)
    case 'published':
      return isPublishedOpportunity(opp)
    case 'later':
      return isLaterOpportunity(opp)
    case 'recommendation-cards':
      return isRecommendationCardOpportunity(opp)
    case 'wie-aligned':
      return Boolean(wie?.admin_badges.includes('work_in_education_aligned'))
    case 'wie-not-aligned':
      return Boolean(wie?.admin_badges.includes('not_for_work_in_education'))
    case 'wie-needs-mapping':
      return Boolean(
        wie?.admin_badges.some((b) =>
          [
            'needs_education_field_mapping',
            'needs_specialism_mapping',
            'needs_stage_mapping',
          ].includes(b)
        )
      )
    case 'wie-contamination':
      return Boolean(wie?.contamination_risk)
    case 'wie-needs-provider':
      return (
        Boolean(wie?.admin_badges.includes('work_in_education_aligned')) && needsProvider(opp)
      )
    case 'wie-generated':
      return isGeneratedWieCourseOpportunity(opp)
    case 'wie-affiliate-ready':
      return (
        Boolean(wie?.admin_badges.includes('work_in_education_aligned')) &&
        isCourseAffiliateReady(opp)
      )
    case 'wip-aligned':
      return isWorkInProfessionOpportunity(opp)
    case 'wip-generated':
      return isGeneratedWipCourseOpportunity(opp)
    case 'wip-needs-provider':
      return isWorkInProfessionOpportunity(opp) && needsProvider(opp)
    case 'wip-affiliate-ready':
      return isWorkInProfessionOpportunity(opp) && isCourseAffiliateReady(opp)
    default:
      return true
  }
}

export function computeOpportunitySummary(opportunities: CourseOpportunity[]): OpportunitySummary {
  const duplicatePublishedLinks = findDuplicatePublishedLinks(opportunities).length

  return {
    total: opportunities.length,
    highPriority: opportunities.filter(isHighPriority).length,
    needProvider: opportunities.filter(needsProvider).length,
    courseAffiliateReady: opportunities.filter(isCourseAffiliateReady).length,
    readyToAdd: opportunities.filter(isReadyToAdd).length,
    published: countPublishedSummary(opportunities),
    duplicatePublishedLinks,
  }
}

export function filterOpportunities(
  opportunities: CourseOpportunity[],
  filters: OpportunityFilters
): CourseOpportunity[] {
  const q = filters.search.trim().toLowerCase()
  const quickView = filters.quickView ?? 'all'
  const stageFilter = filters.stage ?? 'all'
  const educationField = filters.educationField ?? 'all'
  const specialisation = filters.specialisation ?? 'all'
  const goalPath = filters.goalPath ?? 'all'
  const professionField = filters.professionField ?? 'all'
  const professionSpecialism = filters.professionSpecialism ?? 'all'
  const professionalLevel = filters.professionalLevel ?? 'all'

  return opportunities.filter((opp) => {
    if (quickView !== 'all' && !matchesQuickView(opp, quickView)) return false

    if (q) {
      const hay = [
        opp.courseName,
        opp.shortLabel,
        opp.notes,
        opp.adminNotes,
        opp.nextAction,
        opp.linkedPublishedCourseTitle,
        ...(opp.educationFields ?? []),
        ...(opp.specialisations ?? []),
        ...opp.routes.map((r) => r.routeLabel),
        ...(opp.goals ?? []).map((g) => g.goalLabel),
        ...opp.providers.map((p) => p.providerName),
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }

    if (filters.routeKey !== 'all' && !opp.routes.some((r) => r.routeKey === filters.routeKey)) {
      return false
    }

    if (filters.coursePurpose !== 'all' && opp.coursePurpose !== filters.coursePurpose) return false
    if (filters.opportunityStatus !== 'all' && opp.opportunityStatus !== filters.opportunityStatus) {
      return false
    }
    if (filters.publishStatus !== 'all' && opp.publishStatus !== filters.publishStatus) {
      return false
    }

    if (filters.affiliateStatus !== 'all') {
      const hasAffiliate = opp.providers.some((p) => p.affiliateStatus === filters.affiliateStatus)
      if (!hasAffiliate) return false
    }

    if (filters.provider !== 'all') {
      const hasProvider = opp.providers.some(
        (p) => p.providerName.toLowerCase() === filters.provider.toLowerCase()
      )
      if (!hasProvider) return false
    }

    if (filters.visibilityStatus !== 'all') {
      const stored = normalizeVisibilityStatus(opp.visibilityStatus)
      if (stored !== normalizeVisibilityStatus(filters.visibilityStatus)) return false
    }

    if (filters.commercialStatus !== 'all') {
      const commercial = resolveCommercialStatusForOpportunity(opp)
      if (commercial !== normalizeCommercialStatus(filters.commercialStatus)) return false
    }

    if (filters.canBeCourseCard !== 'all') {
      const wantsCard = filters.canBeCourseCard === 'yes'
      if (Boolean(opp.canBeCourseCard) !== wantsCard) return false
    }

    if (!opportunityMatchesGoalPath(opp, goalPath)) return false

    if (!opportunityMatchesEducationField(opp, educationField)) return false
    if (!opportunityMatchesSpecialism(opp, specialisation)) return false
    if (!opportunityMatchesStage(opp, stageFilter)) return false

    // When WIE path filters are active, hide SIA/Forklift/Taxi etc. unless allowed
    if (!opportunityPassesWieContaminationGate(opp, educationField, specialisation)) return false

    if (!opportunityMatchesProfessionField(opp, professionField)) return false
    if (!opportunityMatchesProfessionSpecialism(opp, professionSpecialism)) return false
    if (!opportunityMatchesProfessionalLevel(opp, professionalLevel)) return false
    if (!opportunityPassesWipContaminationGate(opp, professionField, professionSpecialism)) return false

    if (filters.wieBadge && filters.wieBadge !== 'all') {
      const alignment = classifyOpportunityLike(opp)
      if (!alignment.admin_badges.includes(filters.wieBadge as WieAdminBadge)) return false
    }

    return true
  })
}

export function getPreferredProvider(opp: CourseOpportunity) {
  return opp.providers.find((p) => p.isPreferred) ?? opp.providers[0] ?? null
}

export function summarizeProviderStatus(opp: CourseOpportunity): string {
  const preferred = getPreferredProvider(opp)
  if (preferred) return preferred.providerStatus
  if (!opp.providers.length) return 'Need check'
  return opp.providers[0].providerStatus
}

export { summarizeCourseAffiliateReadiness as summarizeAffiliateStatus } from './affiliateReadiness'
