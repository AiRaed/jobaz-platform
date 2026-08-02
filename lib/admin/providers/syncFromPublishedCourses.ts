import type { AdminCourse } from '@/lib/admin/courses/types'
import { normalizeProviderNameKey, providerSlugFromName } from './constants'
import type { CourseProvider, CourseProviderInput } from './types'

export type ProviderSyncResult = {
  created: number
  reused: number
  providerNames: string[]
}

const AUTO_CREATE_NOTE = 'Created automatically from published course provider name.'

/** Defaults when syncing a known partner from published courses. */
export function buildProviderInputFromPublishedName(providerName: string): CourseProviderInput {
  const name = providerName.trim()
  const key = normalizeProviderNameKey(name)

  if (key === 'get licensed') {
    return {
      name,
      slug: providerSlugFromName(name),
      websiteUrl: 'https://www.get-licensed.co.uk',
      affiliateDashboardUrl: '',
      accountStatus: 'Active',
      affiliateStatus: 'Active',
      defaultCommissionType: 'Fixed',
      defaultCommissionValue: '£30',
      defaultPublicOfferLabel: '20% OFF',
      trackingMethod: 'Main referral link',
      notes: 'Approved security/SIA affiliate provider. Main referral link used for Get Licensed courses.',
      contactEmail: '',
      loginNotes: '',
      payoutNotes: '',
      estimatedConversionRatePercent: 5,
      averageOrderValue: null,
      isActive: true,
    }
  }

  if (
    key === 'uk professional development academy' ||
    key.includes('uk professional development') ||
    key === 'ukpda'
  ) {
    return {
      name,
      slug: providerSlugFromName(name),
      websiteUrl: 'https://ukpdacademy.co.uk',
      affiliateDashboardUrl: 'https://ukpdacademy.co.uk/affiliate-area/',
      accountStatus: 'Active',
      affiliateStatus: 'Active',
      defaultCommissionType: 'Percentage',
      defaultCommissionValue: '20%',
      defaultPublicOfferLabel: '30% OFF',
      trackingMethod: 'Course custom link',
      notes: 'Approved affiliate provider. Use custom affiliate links per course where possible.',
      contactEmail: '',
      loginNotes: '',
      payoutNotes: '',
      estimatedConversionRatePercent: 5,
      averageOrderValue: 299,
      isActive: true,
    }
  }

  return {
    name,
    slug: providerSlugFromName(name),
    websiteUrl: '',
    affiliateDashboardUrl: '',
    accountStatus: 'Unknown',
    affiliateStatus: 'Unknown',
    defaultCommissionType: 'Unknown',
    defaultCommissionValue: '',
    defaultPublicOfferLabel: '',
    trackingMethod: 'Unknown',
    notes: AUTO_CREATE_NOTE,
    contactEmail: '',
    loginNotes: '',
    payoutNotes: '',
    estimatedConversionRatePercent: 5,
    averageOrderValue: null,
    isActive: true,
  }
}

/** Unique provider names from published courses (normalized key → display name). */
export function collectPublishedProviderNames(
  courses: AdminCourse[]
): Map<string, string> {
  const map = new Map<string, string>()
  for (const course of courses) {
    if (course.status !== 'published') continue
    const name = course.provider?.trim()
    if (!name) continue
    const key = normalizeProviderNameKey(name)
    if (!map.has(key)) map.set(key, name)
  }
  return map
}

export function planSyncFromPublishedCourses(
  courses: AdminCourse[],
  existingProviders: CourseProvider[]
): { toCreate: CourseProviderInput[]; reused: number; providerNames: string[] } {
  const publishedNames = collectPublishedProviderNames(courses)
  const existingByKey = new Map(
    existingProviders.map((p) => [normalizeProviderNameKey(p.name), p])
  )

  const toCreate: CourseProviderInput[] = []
  let reused = 0
  const providerNames: string[] = []

  for (const [key, displayName] of publishedNames) {
    providerNames.push(displayName)
    if (existingByKey.has(key)) {
      reused += 1
      continue
    }
    toCreate.push(buildProviderInputFromPublishedName(displayName))
  }

  return { toCreate, reused, providerNames }
}

export function findExistingProviderByName(
  providers: CourseProvider[],
  providerName: string
): CourseProvider | undefined {
  const key = normalizeProviderNameKey(providerName)
  return providers.find((p) => normalizeProviderNameKey(p.name) === key)
}
