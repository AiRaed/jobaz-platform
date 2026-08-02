import type { CourseCommissionType } from '@/lib/admin/courses/types'
import type {
  CommissionReportStatus,
  CommissionReportType,
  CourseProvider,
  CourseProviderInput,
  ProviderAccountStatus,
  ProviderAffiliateStatus,
  ProviderCommissionReport,
  ProviderCommissionReportInput,
  ProviderCommissionType,
  ProviderTrackingMethod,
} from './types'

export type ProviderRow = {
  id: string
  name: string
  slug: string
  website_url: string | null
  affiliate_dashboard_url: string | null
  affiliate_status: string | null
  account_status: string | null
  default_commission_type: string | null
  default_commission_value: string | null
  default_public_offer_label: string | null
  tracking_method: string | null
  notes: string | null
  contact_email: string | null
  login_notes: string | null
  payout_notes: string | null
  estimated_conversion_rate_percent: number | null
  average_order_value: number | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export type CommissionReportRow = {
  id: string
  provider_id: string
  course_id: string | null
  report_date: string
  report_type: string | null
  clicks: number | null
  referrals: number | null
  confirmed_sales: number | null
  confirmed_commission: number | null
  currency: string | null
  status: string | null
  notes: string | null
  created_at: string
}

function asAffiliateStatus(value: string | null | undefined): ProviderAffiliateStatus {
  const v = (value ?? 'Unknown').trim() as ProviderAffiliateStatus
  return v || 'Unknown'
}

function asAccountStatus(value: string | null | undefined): ProviderAccountStatus {
  const v = (value ?? 'Unknown').trim() as ProviderAccountStatus
  return v || 'Unknown'
}

function asCommissionType(value: string | null | undefined): ProviderCommissionType {
  const v = (value ?? 'Unknown').trim() as ProviderCommissionType
  return v || 'Unknown'
}

function asTrackingMethod(value: string | null | undefined): ProviderTrackingMethod {
  const v = (value ?? 'Unknown').trim() as ProviderTrackingMethod
  return v || 'Unknown'
}

function asReportType(value: string | null | undefined): CommissionReportType {
  const v = (value ?? 'Manual').trim() as CommissionReportType
  return v || 'Manual'
}

function asReportStatus(value: string | null | undefined): CommissionReportStatus {
  const v = (value ?? 'Pending').trim() as CommissionReportStatus
  return v || 'Pending'
}

export function providerRowToCourseProvider(row: ProviderRow): CourseProvider {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    websiteUrl: row.website_url ?? '',
    affiliateDashboardUrl: row.affiliate_dashboard_url ?? '',
    affiliateStatus: asAffiliateStatus(row.affiliate_status),
    accountStatus: asAccountStatus(row.account_status),
    defaultCommissionType: asCommissionType(row.default_commission_type),
    defaultCommissionValue: row.default_commission_value ?? '',
    defaultPublicOfferLabel: row.default_public_offer_label ?? '',
    trackingMethod: asTrackingMethod(row.tracking_method),
    notes: row.notes ?? '',
    contactEmail: row.contact_email ?? '',
    loginNotes: row.login_notes ?? '',
    payoutNotes: row.payout_notes ?? '',
    estimatedConversionRatePercent: Number(row.estimated_conversion_rate_percent ?? 5),
    averageOrderValue:
      row.average_order_value === null || row.average_order_value === undefined
        ? null
        : Number(row.average_order_value),
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function courseProviderInputToInsertRow(input: CourseProviderInput) {
  const now = new Date().toISOString()
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    website_url: input.websiteUrl.trim() || null,
    affiliate_dashboard_url: input.affiliateDashboardUrl.trim() || null,
    affiliate_status: input.affiliateStatus,
    account_status: input.accountStatus,
    default_commission_type: input.defaultCommissionType,
    default_commission_value: input.defaultCommissionValue.trim() || null,
    default_public_offer_label: input.defaultPublicOfferLabel.trim() || null,
    tracking_method: input.trackingMethod,
    notes: input.notes.trim() || null,
    contact_email: input.contactEmail.trim() || null,
    login_notes: input.loginNotes.trim() || null,
    payout_notes: input.payoutNotes.trim() || null,
    estimated_conversion_rate_percent: input.estimatedConversionRatePercent,
    average_order_value: input.averageOrderValue,
    is_active: input.isActive,
    created_at: now,
    updated_at: now,
  }
}

export function courseProviderInputToUpdateRow(input: CourseProviderInput) {
  return {
    ...courseProviderInputToInsertRow(input),
    created_at: undefined,
    updated_at: new Date().toISOString(),
  }
}

export function commissionReportRowToReport(row: CommissionReportRow): ProviderCommissionReport {
  return {
    id: row.id,
    providerId: row.provider_id,
    courseId: row.course_id,
    reportDate: row.report_date,
    reportType: asReportType(row.report_type),
    clicks: row.clicks ?? 0,
    referrals: row.referrals ?? 0,
    confirmedSales: row.confirmed_sales ?? 0,
    confirmedCommission: Number(row.confirmed_commission ?? 0),
    currency: row.currency ?? 'GBP',
    status: asReportStatus(row.status),
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }
}

export function commissionReportInputToInsertRow(input: ProviderCommissionReportInput) {
  return {
    provider_id: input.providerId,
    course_id: input.courseId || null,
    report_date: input.reportDate,
    report_type: input.reportType,
    clicks: input.clicks,
    referrals: input.referrals,
    confirmed_sales: input.confirmedSales,
    confirmed_commission: input.confirmedCommission,
    currency: input.currency || 'GBP',
    status: input.status,
    notes: input.notes.trim() || null,
  }
}

/** Map published course commission type to provider commission type. */
export function courseCommissionToProviderType(
  value: CourseCommissionType | string | null | undefined
): ProviderCommissionType {
  const v = (value ?? '').toLowerCase()
  if (v === 'fixed') return 'Fixed'
  if (v === 'percentage') return 'Percentage'
  if (v === 'lead') return 'Per lead'
  if (v === 'none') return 'None'
  return 'Unknown'
}

export function providerCommissionToCourseType(
  value: ProviderCommissionType | string | null | undefined
): CourseCommissionType {
  const v = (value ?? '').toLowerCase()
  if (v === 'fixed') return 'fixed'
  if (v === 'percentage') return 'percentage'
  if (v === 'per lead') return 'lead'
  if (v === 'none') return 'none'
  return 'none'
}
