import type { CourseProvider, ProviderCommissionReport } from './types'

export type ProviderQuickFilter =
  | 'all'
  | 'active'
  | 'has-published'
  | 'has-confirmed'
  | 'has-clicks'

export type ProviderFilters = {
  search: string
  accountStatus: string
  affiliateStatus: string
  commissionType: string
  quickFilter: ProviderQuickFilter
}

export function filterProviders(
  providers: Array<CourseProvider & { publishedCoursesCount?: number; confirmedCommission?: number }>,
  filters: ProviderFilters
): typeof providers {
  const q = filters.search.trim().toLowerCase()

  return providers.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.notes.toLowerCase().includes(q)) {
      return false
    }
    if (filters.accountStatus !== 'all' && p.accountStatus !== filters.accountStatus) return false
    if (filters.affiliateStatus !== 'all' && p.affiliateStatus !== filters.affiliateStatus) {
      return false
    }
    if (filters.commissionType !== 'all' && p.defaultCommissionType !== filters.commissionType) {
      return false
    }

    switch (filters.quickFilter) {
      case 'active':
        return p.accountStatus === 'Active' || p.affiliateStatus === 'Active'
      case 'has-published':
        return (p.publishedCoursesCount ?? 0) > 0
      case 'has-confirmed':
        return (p.confirmedCommission ?? 0) > 0
      case 'has-clicks':
        return false // filled by caller with applyClicks if needed
      default:
        return true
    }
  })
}

export function filterProviderMetrics<
  T extends CourseProvider & {
    publishedCoursesCount: number
    applyClicks: number
    confirmedCommission: number
  },
>(providers: T[], filters: ProviderFilters): T[] {
  const q = filters.search.trim().toLowerCase()

  return providers.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.notes.toLowerCase().includes(q)) {
      return false
    }
    if (filters.accountStatus !== 'all' && p.accountStatus !== filters.accountStatus) return false
    if (filters.affiliateStatus !== 'all' && p.affiliateStatus !== filters.affiliateStatus) {
      return false
    }
    if (filters.commissionType !== 'all' && p.defaultCommissionType !== filters.commissionType) {
      return false
    }

    switch (filters.quickFilter) {
      case 'active':
        return p.accountStatus === 'Active' || p.affiliateStatus === 'Active'
      case 'has-published':
        return p.publishedCoursesCount > 0
      case 'has-confirmed':
        return p.confirmedCommission > 0
      case 'has-clicks':
        return p.applyClicks > 0
      default:
        return true
    }
  })
}

export function reportsForProvider(
  reports: ProviderCommissionReport[],
  providerId: string
): ProviderCommissionReport[] {
  return reports
    .filter((r) => r.providerId === providerId)
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate))
}
