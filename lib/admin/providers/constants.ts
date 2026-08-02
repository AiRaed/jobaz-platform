import type {
  CommissionReportStatus,
  CommissionReportType,
  ProviderAccountStatus,
  ProviderAffiliateStatus,
  ProviderCommissionType,
  ProviderTrackingMethod,
} from './types'

export const PROVIDER_AFFILIATE_STATUS_OPTIONS: ProviderAffiliateStatus[] = [
  'Unknown',
  'Not affiliate',
  'Applied',
  'Pending',
  'Approved',
  'Rejected',
  'Active',
  'Need follow-up',
]

export const PROVIDER_ACCOUNT_STATUS_OPTIONS: ProviderAccountStatus[] = [
  'Unknown',
  'Active',
  'Pending',
  'Rejected',
  'Problem',
  'Paused',
  'Later',
]

export const PROVIDER_COMMISSION_TYPE_OPTIONS: ProviderCommissionType[] = [
  'Unknown',
  'Fixed',
  'Percentage',
  'Per lead',
  'Per booking',
  'None',
]

export const PROVIDER_TRACKING_METHOD_OPTIONS: ProviderTrackingMethod[] = [
  'Unknown',
  'Main referral link',
  'Course custom link',
  'Dashboard only',
  'Sub ID supported',
  'Manual check',
  'API / webhook later',
]

export const COMMISSION_REPORT_TYPE_OPTIONS: CommissionReportType[] = [
  'Manual',
  'Dashboard check',
  'Provider email',
  'API / webhook later',
]

export const COMMISSION_REPORT_STATUS_OPTIONS: CommissionReportStatus[] = [
  'Pending',
  'Confirmed',
  'Paid',
  'Disputed',
  'Cancelled',
]

export const ESTIMATED_REVENUE_DISCLAIMER =
  'Estimated revenue is based on Apply Now clicks and assumptions. Confirmed revenue should be entered manually from provider dashboards.'

export const SUMMARY_CARD_HINTS: Record<string, string> = {
  activeProviders: 'Partners with Active account or affiliate status',
  publishedPartnerCourses: 'Real public courses from Published Courses tab',
  applyClicks: 'Total Apply Now clicks on published partner courses',
  estimatedRevenue: 'Based on Apply Now clicks and commission assumptions',
  confirmedCommission: 'Entered manually from provider dashboard',
  paidCommission: 'Confirmed paid income from commission reports',
}

export const PROVIDERS_TAB_INTRO =
  'This tab reads live data from Published Courses. Use Sync to create partner records from course provider names, then add dashboard URLs and confirmed commission manually.'

export function providerSlugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeProviderNameKey(name: string): string {
  return name.trim().toLowerCase()
}
