import type { AdminCourse } from '@/lib/admin/courses/types'
import { courseSlugFromTitle } from '@/lib/career-hub/marketplace/slug'
import { normalizeProviderNameKey } from './constants'
import {
  estimateCourseRevenue,
  formatGbp,
  isCourseRevenueReady,
  resolveCourseCommissionType,
  resolveCourseCommissionValue,
  resolveCoursePrice,
  sumEstimatedRevenue,
} from './revenue'
import type {
  CourseProvider,
  LinkedPublishedCourse,
  ProviderCommissionReport,
  ProviderDashboardData,
  ProviderDashboardSummary,
  ProviderWithMetrics,
  UnmatchedCourseProvider,
} from './types'

export type CourseClickRow = {
  course_id: string
  action?: string | null
}

export function isActiveProvider(provider: CourseProvider): boolean {
  return provider.accountStatus === 'Active' || provider.affiliateStatus === 'Active'
}

/** Show in dashboard when tied to real published monetization or manual commission data. */
export function isRevenueVisibleProvider(metrics: {
  publishedCoursesCount: number
  confirmedCommission: number
  paidCommission: number
}): boolean {
  return (
    metrics.publishedCoursesCount > 0 ||
    metrics.confirmedCommission > 0 ||
    metrics.paidCommission > 0
  )
}

export function deriveProviderNextAction(
  provider: CourseProvider,
  linkedCourses: LinkedPublishedCourse[]
): string {
  if (provider.affiliateStatus === 'Rejected' || provider.accountStatus === 'Rejected') {
    return 'Reapply later'
  }
  if (provider.accountStatus === 'Paused' || provider.accountStatus === 'Later') {
    return 'Review when ready'
  }
  const published = linkedCourses.filter((c) => c.status === 'published')
  if (!published.length) return 'Link published courses'
  const missingReferral = published.some((c) => !c.referralUrl?.trim() && !c.officialUrl?.trim())
  if (missingReferral) return 'Add referral URLs to published courses'
  if (provider.affiliateDashboardUrl?.trim()) return 'Check affiliate dashboard'
  if (provider.affiliateStatus === 'Need follow-up') return 'Complete affiliate setup'
  return 'Review partner setup'
}

function matchProviderToCourse(provider: CourseProvider, course: AdminCourse): boolean {
  return normalizeProviderNameKey(provider.name) === normalizeProviderNameKey(course.provider)
}

export function buildLinkedCourse(
  course: AdminCourse,
  provider: CourseProvider | undefined,
  applyClicks: number
): LinkedPublishedCourse {
  const commissionType = resolveCourseCommissionType(course, provider)
  const commissionValue = resolveCourseCommissionValue(course, provider)
  const coursePrice = resolveCoursePrice(course, provider)
  const conversionRate = provider?.estimatedConversionRatePercent ?? 5
  const revenue = estimateCourseRevenue({
    applyClicks,
    commissionType,
    commissionValue,
    conversionRatePercent: conversionRate,
    coursePrice,
  })

  return {
    id: course.id,
    title: course.title,
    slug: courseSlugFromTitle(course.title),
    status: course.status,
    referralUrl: course.referralUrl,
    officialUrl: course.officialUrl,
    applyClicks,
    commissionType,
    commissionValue,
    estimatedRevenue: revenue.amount,
    estimatedRevenueLabel: revenue.label,
    publicOfferLabel: course.publicOfferLabel || provider?.defaultPublicOfferLabel || '',
    price: course.price,
    revenueReady: isCourseRevenueReady(course),
  }
}

export function countApplyClicksForCourse(
  courseId: string,
  clickRows: CourseClickRow[],
  courseClicksFallback: number
): number {
  const fromRows = clickRows.filter(
    (r) => r.course_id === courseId && (r.action ?? 'apply_now') === 'apply_now'
  ).length
  return fromRows > 0 ? fromRows : courseClicksFallback
}

export function buildProviderDashboard(
  providers: CourseProvider[],
  courses: AdminCourse[],
  clickRows: CourseClickRow[],
  reports: ProviderCommissionReport[]
): ProviderDashboardData {
  const publishedCourses = courses.filter((c) => c.status === 'published')
  const publishedPartnerCourses = publishedCourses.filter((c) =>
    Boolean(c.provider?.trim() && (c.referralUrl?.trim() || c.officialUrl?.trim()))
  )

  const providerMetrics: ProviderWithMetrics[] = providers.map((provider) => {
    const linked = publishedCourses.filter((c) => matchProviderToCourse(provider, c))
    const linkedCourses = linked.map((course) =>
      buildLinkedCourse(
        course,
        provider,
        countApplyClicksForCourse(course.id, clickRows, course.clicks)
      )
    )

    const providerReports = reports.filter((r) => r.providerId === provider.id)
    const confirmedCommission = providerReports
      .filter((r) => r.status === 'Confirmed' || r.status === 'Paid')
      .reduce((sum, r) => sum + r.confirmedCommission, 0)
    const paidCommission = providerReports
      .filter((r) => r.status === 'Paid')
      .reduce((sum, r) => sum + r.confirmedCommission, 0)

    const estimatedRevenue = sumEstimatedRevenue(linkedCourses.map((c) => c.estimatedRevenue))
    const applyClicks = linkedCourses.reduce((sum, c) => sum + c.applyClicks, 0)

    return {
      ...provider,
      publishedCoursesCount: linked.length,
      applyClicks,
      estimatedRevenue,
      estimatedRevenueLabel: formatGbp(estimatedRevenue),
      confirmedCommission,
      paidCommission,
      nextAction: deriveProviderNextAction(provider, linkedCourses),
      linkedCourses,
    }
  })

  const matchedNames = new Set(providers.map((p) => normalizeProviderNameKey(p.name)))
  const unmatchedMap = new Map<string, UnmatchedCourseProvider>()

  for (const course of publishedCourses) {
    const name = course.provider?.trim()
    if (!name) continue
    const key = normalizeProviderNameKey(name)
    if (matchedNames.has(key)) continue

    const existing = unmatchedMap.get(key)
    const clicks = countApplyClicksForCourse(course.id, clickRows, course.clicks)
    if (existing) {
      existing.publishedCoursesCount += 1
      existing.applyClicks += clicks
    } else {
      unmatchedMap.set(key, {
        providerName: name,
        publishedCoursesCount: 1,
        applyClicks: clicks,
      })
    }
  }

  const totalApplyClicks = clickRows.filter((r) => (r.action ?? 'apply_now') === 'apply_now').length
  const fallbackApplyClicks = publishedCourses.reduce((sum, c) => sum + (c.clicks ?? 0), 0)
  const applyClicks = totalApplyClicks > 0 ? totalApplyClicks : fallbackApplyClicks

  const visibleProviders = providerMetrics.filter(isRevenueVisibleProvider)

  const summary: ProviderDashboardSummary = {
    activeProviders: visibleProviders.filter(isActiveProvider).length,
    publishedPartnerCourses: publishedPartnerCourses.length,
    applyClicks,
    estimatedRevenue: sumEstimatedRevenue(visibleProviders.map((p) => p.estimatedRevenue)),
    confirmedCommission: reports
      .filter((r) => r.status === 'Confirmed' || r.status === 'Paid')
      .reduce((sum, r) => sum + r.confirmedCommission, 0),
    paidCommission: reports
      .filter((r) => r.status === 'Paid')
      .reduce((sum, r) => sum + r.confirmedCommission, 0),
  }

  return {
    summary,
    providers: visibleProviders.sort((a, b) => a.name.localeCompare(b.name)),
    unmatchedCourseProviders: [...unmatchedMap.values()].sort((a, b) =>
      a.providerName.localeCompare(b.providerName)
    ),
    reports,
  }
}

export { buildProviderInputFromPublishedName as createProviderFromCourseName } from './syncFromPublishedCourses'
