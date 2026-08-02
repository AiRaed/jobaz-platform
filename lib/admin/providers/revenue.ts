import type { AdminCourse } from '@/lib/admin/courses/types'
import type { CourseProvider, ProviderCommissionType } from './types'
import { courseCommissionToProviderType } from './mappers'

export function parseMoneyAmount(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const cleaned = value.replace(/[£$€,\s]/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

export function parseCommissionPercent(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const cleaned = value.replace(/%/g, '').trim()
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n / 100 : null
}

export function parseFixedCommission(value: string | null | undefined): number | null {
  return parseMoneyAmount(value)
}

export function isCourseRevenueReady(course: AdminCourse): boolean {
  if (course.status !== 'published') return false
  return Boolean(course.referralUrl?.trim() || course.officialUrl?.trim())
}

export function resolveCourseCommissionType(
  course: AdminCourse,
  provider?: Pick<CourseProvider, 'defaultCommissionType'>
): ProviderCommissionType {
  const fromCourse = courseCommissionToProviderType(course.commissionType)
  if (fromCourse !== 'Unknown' && fromCourse !== 'None') return fromCourse
  return provider?.defaultCommissionType ?? 'Unknown'
}

export function resolveCourseCommissionValue(
  course: AdminCourse,
  provider?: Pick<CourseProvider, 'defaultCommissionValue'>
): string {
  if (course.commissionValue?.trim()) return course.commissionValue.trim()
  return provider?.defaultCommissionValue?.trim() ?? ''
}

export function resolveCoursePrice(
  course: AdminCourse,
  provider?: Pick<CourseProvider, 'averageOrderValue'>
): number | null {
  const fromCourse = parseMoneyAmount(course.price)
  if (fromCourse !== null) return fromCourse
  return provider?.averageOrderValue ?? null
}

export function estimateCourseRevenue(input: {
  applyClicks: number
  commissionType: ProviderCommissionType
  commissionValue: string
  conversionRatePercent: number
  coursePrice: number | null
}): { amount: number | null; label: string } {
  const { applyClicks, commissionType, commissionValue, conversionRatePercent, coursePrice } = input
  if (applyClicks <= 0) return { amount: 0, label: '£0.00' }

  const rate = conversionRatePercent / 100
  const conversions = applyClicks * rate

  if (commissionType === 'Fixed') {
    const fixed = parseFixedCommission(commissionValue)
    if (fixed === null) return { amount: null, label: 'Unknown' }
    const amount = conversions * fixed
    return { amount, label: formatGbp(amount) }
  }

  if (commissionType === 'Percentage') {
    const pct = parseCommissionPercent(commissionValue)
    if (pct === null || coursePrice === null) return { amount: null, label: 'Unknown' }
    const amount = conversions * coursePrice * pct
    return { amount, label: formatGbp(amount) }
  }

  if (commissionType === 'Per lead' || commissionType === 'Per booking') {
    const per = parseFixedCommission(commissionValue)
    if (per === null) return { amount: null, label: 'Unknown' }
    const amount = conversions * per
    return { amount, label: formatGbp(amount) }
  }

  return { amount: null, label: 'Unknown' }
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function sumEstimatedRevenue(amounts: Array<number | null>): number {
  return amounts.reduce<number>((sum, n) => sum + (n ?? 0), 0)
}
