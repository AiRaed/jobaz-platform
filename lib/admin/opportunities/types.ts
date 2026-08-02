export type OpportunityRoute = {
  id: string
  opportunityId: string
  routeKey: string
  routeLabel: string
}

export type OpportunityGoal = {
  id: string
  opportunityId: string
  goalKey: string
  goalLabel: string
}

export type OpportunityProvider = {
  id: string
  opportunityId: string
  providerName: string
  providerStatus: string
  affiliateStatus: string
  officialUrl: string
  referralUrl: string
  dashboardUrl: string
  commissionType: string
  commissionValue: string
  publicOfferLabel: string
  trackingMethod: string
  notes: string
  isPreferred: boolean
  createdAt: string
  updatedAt: string
}

export type VisibilityStatus = 'internal' | 'recommendation_only' | 'public_listed'

export type CourseOpportunity = {
  id: string
  courseName: string
  shortLabel: string
  coursePurpose: string
  priority: number
  opportunityStatus: string
  publishStatus: string
  importance: string
  notes: string
  nextAction: string
  publishedCourseId: string | null
  visibilityStatus?: VisibilityStatus
  educationFields: string[]
  specialisations: string[]
  commercialStatus: string
  suggestedSearchKeywords: string
  adminNotes: string
  canBeCourseCard: boolean
  recommendationType: string
  /** Enriched from linked published course (read-only) */
  linkedPublishedCourseTitle?: string
  linkedPublishedCourseSlug?: string
  linkedPublishedCourseReferralUrl?: string
  linkedPublishedCourseOfficialUrl?: string
  createdAt: string
  updatedAt: string
  routes: OpportunityRoute[]
  goals: OpportunityGoal[]
  providers: OpportunityProvider[]
}

export type OpportunityRouteInput = {
  routeKey: string
  routeLabel: string
}

export type OpportunityGoalInput = {
  goalKey: string
  goalLabel: string
}

export type OpportunityProviderInput = {
  id?: string
  providerName: string
  providerStatus: string
  affiliateStatus: string
  officialUrl: string
  referralUrl: string
  dashboardUrl: string
  commissionType: string
  commissionValue: string
  publicOfferLabel: string
  trackingMethod: string
  notes: string
  isPreferred: boolean
}

export type CourseOpportunityInput = {
  courseName: string
  shortLabel: string
  coursePurpose: string
  priority: number
  opportunityStatus: string
  publishStatus: string
  importance: string
  notes: string
  nextAction: string
  publishedCourseId?: string | null
  visibilityStatus?: VisibilityStatus
  educationFields?: string[]
  specialisations?: string[]
  commercialStatus?: string
  suggestedSearchKeywords?: string
  adminNotes?: string
  canBeCourseCard?: boolean
  recommendationType?: string
  routes: OpportunityRouteInput[]
  goals: OpportunityGoalInput[]
  providers: OpportunityProviderInput[]
}

export type CourseOpportunityStore = {
  version: 1
  opportunities: CourseOpportunity[]
}

export function emptyOpportunityProviderInput(): OpportunityProviderInput {
  return {
    providerName: '',
    providerStatus: 'Need check',
    affiliateStatus: 'Unknown',
    officialUrl: '',
    referralUrl: '',
    dashboardUrl: '',
    commissionType: 'Unknown',
    commissionValue: '',
    publicOfferLabel: '',
    trackingMethod: 'Unknown',
    notes: '',
    isPreferred: false,
  }
}

export function emptyCourseOpportunityInput(): CourseOpportunityInput {
  return {
    courseName: '',
    shortLabel: '',
    coursePurpose: '',
    priority: 50,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: '',
    notes: '',
    nextAction: '',
    publishedCourseId: null,
    visibilityStatus: 'internal',
    educationFields: [],
    specialisations: [],
    commercialStatus: '',
    suggestedSearchKeywords: '',
    adminNotes: '',
    canBeCourseCard: true,
    recommendationType: '',
    routes: [],
    goals: [],
    providers: [],
  }
}
