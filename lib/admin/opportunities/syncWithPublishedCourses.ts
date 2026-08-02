import type { AdminCourse } from '@/lib/admin/courses/types'
import { courseSlugFromTitle } from '@/lib/career-hub/marketplace/slug'
import type { CourseOpportunity, CourseOpportunityInput, OpportunityProviderInput } from './types'
import {
  buildPublishedCourseIndex,
  findBestPublishedCourseMatch,
} from './nameMatching'

export type PublishedLinkDuplicate = {
  publishedCourseId: string
  courseTitle: string
  opportunityIds: string[]
  opportunityNames: string[]
}

export type SyncWithPublishedCoursesResult = {
  synced: number
  alreadyLinked: number
  unmatchedOpportunities: number
  duplicatePublishedLinks: PublishedLinkDuplicate[]
}

function isBlank(value: string | null | undefined): boolean {
  return !(value ?? '').trim()
}

function providerToInput(p: CourseOpportunity['providers'][number]): OpportunityProviderInput {
  return {
    id: p.id,
    providerName: p.providerName,
    providerStatus: p.providerStatus,
    affiliateStatus: p.affiliateStatus,
    officialUrl: p.officialUrl,
    referralUrl: p.referralUrl,
    dashboardUrl: p.dashboardUrl,
    commissionType: p.commissionType,
    commissionValue: p.commissionValue,
    publicOfferLabel: p.publicOfferLabel,
    trackingMethod: p.trackingMethod,
    notes: p.notes,
    isPreferred: p.isPreferred,
  }
}

function courseHasApplyLink(course: AdminCourse): boolean {
  return Boolean(course.referralUrl?.trim() || course.officialUrl?.trim())
}

/** Merge published course referral data into providers without overwriting manual values. */
export function mergeProvidersFromPublishedCourse(
  providers: OpportunityProviderInput[],
  course: AdminCourse
): OpportunityProviderInput[] {
  if (!providers.length) return providers

  const hasLink = courseHasApplyLink(course)
  let touchedPreferred = false

  return providers.map((p, index) => {
    const isPreferred = p.isPreferred || (index === 0 && !providers.some((x) => x.isPreferred))
    const next: OpportunityProviderInput = { ...p, isPreferred: isPreferred && !touchedPreferred }

    if (next.isPreferred) touchedPreferred = true

    if (isBlank(next.referralUrl) && course.referralUrl?.trim()) {
      next.referralUrl = course.referralUrl.trim()
    }
    if (isBlank(next.officialUrl) && course.officialUrl?.trim()) {
      next.officialUrl = course.officialUrl.trim()
    }
    if (isBlank(next.providerName) && course.provider?.trim()) {
      next.providerName = course.provider.trim()
    }

    if (hasLink && (next.affiliateStatus === 'Unknown' || next.affiliateStatus === 'Need follow-up')) {
      next.affiliateStatus = 'Active'
      if (next.providerStatus === 'Need check' || next.providerStatus === 'Provider found') {
        next.providerStatus = 'Active'
      }
    }

    return next
  })
}

export function opportunityToInput(opp: CourseOpportunity): CourseOpportunityInput {
  return {
    courseName: opp.courseName,
    shortLabel: opp.shortLabel,
    coursePurpose: opp.coursePurpose,
    priority: opp.priority,
    opportunityStatus: opp.opportunityStatus,
    publishStatus: opp.publishStatus,
    importance: opp.importance,
    notes: opp.notes,
    nextAction: opp.nextAction,
    publishedCourseId: opp.publishedCourseId ?? null,
    routes: opp.routes.map((r) => ({ routeKey: r.routeKey, routeLabel: r.routeLabel })),
    goals: (opp.goals ?? []).map((g) => ({ goalKey: g.goalKey, goalLabel: g.goalLabel })),
    providers: opp.providers.map(providerToInput),
  }
}

export function buildSyncedOpportunityInput(
  opp: CourseOpportunity,
  course: AdminCourse
): CourseOpportunityInput {
  const input = opportunityToInput(opp)

  input.publishedCourseId = course.id
  input.publishStatus = 'Published'
  input.opportunityStatus = 'Published'
  input.providers = mergeProvidersFromPublishedCourse(input.providers, course)

  if (isBlank(input.nextAction)) {
    input.nextAction = 'Live on Published Courses — monitor clicks and commission'
  }

  return input
}

export function planSyncWithPublishedCourses(
  opportunities: CourseOpportunity[],
  courses: AdminCourse[]
): {
  updates: Array<{ opportunityId: string; input: CourseOpportunityInput }>
  result: SyncWithPublishedCoursesResult
} {
  const { published, byId } = buildPublishedCourseIndex(courses)
  const updates: Array<{ opportunityId: string; input: CourseOpportunityInput }> = []
  let synced = 0
  let alreadyLinked = 0

  for (const opp of opportunities) {
    const existingLink = opp.publishedCourseId
      ? byId.get(opp.publishedCourseId)
      : null

    if (existingLink) {
      if (opp.publishStatus === 'Published' && opp.opportunityStatus === 'Published') {
        alreadyLinked += 1
        continue
      }
      updates.push({
        opportunityId: opp.id,
        input: buildSyncedOpportunityInput(opp, existingLink),
      })
      synced += 1
      continue
    }

    const match = findBestPublishedCourseMatch(opp, published, byId)
    if (!match) continue

    updates.push({
      opportunityId: opp.id,
      input: buildSyncedOpportunityInput(opp, match),
    })
    synced += 1
  }

  const linkedByCourse = new Map<string, { ids: string[]; names: string[] }>()

  for (const opp of opportunities) {
    const update = updates.find((u) => u.opportunityId === opp.id)
    const courseId = update?.input.publishedCourseId ?? opp.publishedCourseId
    if (!courseId) continue
    const entry = linkedByCourse.get(courseId) ?? { ids: [], names: [] }
    entry.ids.push(opp.id)
    entry.names.push(opp.courseName)
    linkedByCourse.set(courseId, entry)
  }

  const duplicatePublishedLinks: PublishedLinkDuplicate[] = []
  for (const [courseId, entry] of linkedByCourse) {
    if (entry.ids.length <= 1) continue
    const course = byId.get(courseId)
    duplicatePublishedLinks.push({
      publishedCourseId: courseId,
      courseTitle: course?.title ?? courseId,
      opportunityIds: entry.ids,
      opportunityNames: entry.names,
    })
  }

  const matchedIds = new Set(updates.map((u) => u.opportunityId))
  const unmatchedOpportunities = opportunities.filter((o) => !matchedIds.has(o.id) && !o.publishedCourseId).length

  return {
    updates,
    result: {
      synced,
      alreadyLinked,
      unmatchedOpportunities,
      duplicatePublishedLinks,
    },
  }
}

export function enrichOpportunitiesWithPublishedCourses(
  opportunities: CourseOpportunity[],
  courses: AdminCourse[]
): CourseOpportunity[] {
  const { byId } = buildPublishedCourseIndex(courses)

  return opportunities.map((opp) => {
    if (!opp.publishedCourseId) return opp
    const course = byId.get(opp.publishedCourseId)
    if (!course) return opp

    return {
      ...opp,
      linkedPublishedCourseTitle: course.title,
      linkedPublishedCourseSlug: courseSlugFromTitle(course.title),
      linkedPublishedCourseReferralUrl: course.referralUrl,
      linkedPublishedCourseOfficialUrl: course.officialUrl,
    }
  })
}

/** Alias for planSyncWithPublishedCourses — matches product naming. */
export const syncOpportunitiesWithPublishedCourses = planSyncWithPublishedCourses
