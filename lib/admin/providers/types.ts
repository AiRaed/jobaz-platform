export type ProviderAffiliateStatus =
  | 'Unknown'
  | 'Not affiliate'
  | 'Applied'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Active'
  | 'Need follow-up'

export type ProviderAccountStatus =
  | 'Unknown'
  | 'Active'
  | 'Pending'
  | 'Rejected'
  | 'Problem'
  | 'Paused'
  | 'Later'

export type ProviderCommissionType =
  | 'Unknown'
  | 'Fixed'
  | 'Percentage'
  | 'Per lead'
  | 'Per booking'
  | 'None'

export type ProviderTrackingMethod =
  | 'Unknown'
  | 'Main referral link'
  | 'Course custom link'
  | 'Dashboard only'
  | 'Sub ID supported'
  | 'Manual check'
  | 'API / webhook later'

export type CommissionReportType = 'Manual' | 'Dashboard check' | 'Provider email' | 'API / webhook later'

export type CommissionReportStatus = 'Pending' | 'Confirmed' | 'Paid' | 'Disputed' | 'Cancelled'

export type CourseProvider = {
  id: string
  name: string
  slug: string
  websiteUrl: string
  affiliateDashboardUrl: string
  affiliateStatus: ProviderAffiliateStatus
  accountStatus: ProviderAccountStatus
  defaultCommissionType: ProviderCommissionType
  defaultCommissionValue: string
  defaultPublicOfferLabel: string
  trackingMethod: ProviderTrackingMethod
  notes: string
  contactEmail: string
  loginNotes: string
  payoutNotes: string
  estimatedConversionRatePercent: number
  averageOrderValue: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CourseProviderInput = Omit<CourseProvider, 'id' | 'createdAt' | 'updatedAt'>

export type ProviderCommissionReport = {
  id: string
  providerId: string
  courseId: string | null
  reportDate: string
  reportType: CommissionReportType
  clicks: number
  referrals: number
  confirmedSales: number
  confirmedCommission: number
  currency: string
  status: CommissionReportStatus
  notes: string
  createdAt: string
}

export type ProviderCommissionReportInput = Omit<ProviderCommissionReport, 'id' | 'createdAt'>

export type LinkedPublishedCourse = {
  id: string
  title: string
  slug: string
  status: string
  referralUrl: string
  officialUrl: string
  applyClicks: number
  commissionType: string
  commissionValue: string
  estimatedRevenue: number | null
  estimatedRevenueLabel: string
  publicOfferLabel: string
  price: string
  revenueReady: boolean
}

export type ProviderWithMetrics = CourseProvider & {
  publishedCoursesCount: number
  applyClicks: number
  estimatedRevenue: number
  estimatedRevenueLabel: string
  confirmedCommission: number
  paidCommission: number
  nextAction: string
  linkedCourses: LinkedPublishedCourse[]
}

export type UnmatchedCourseProvider = {
  providerName: string
  publishedCoursesCount: number
  applyClicks: number
}

export type ProviderDashboardSummary = {
  activeProviders: number
  publishedPartnerCourses: number
  applyClicks: number
  estimatedRevenue: number
  confirmedCommission: number
  paidCommission: number
}

export type ProviderDashboardData = {
  summary: ProviderDashboardSummary
  providers: ProviderWithMetrics[]
  unmatchedCourseProviders: UnmatchedCourseProvider[]
  reports: ProviderCommissionReport[]
}
