/** Admin Users — types (summaries only; no secrets or raw assessment/CV JSON). */

export type AdminUserEngagement =
  | 'New'
  | 'Active'
  | 'High intent'
  | 'Dormant'
  | 'Test/demo'

export type AdminCvStatus = 'none' | 'started' | 'saved' | 'completed'

export type TrackingFlag = {
  available: boolean
  label: string
  hint?: string
}

export type AdminUsersTracking = {
  authUsers: TrackingFlag
  profiles: TrackingFlag
  assessments: TrackingFlag
  cvs: TrackingFlag
  courseClicks: TrackingFlag
  coverLetters: TrackingFlag
  writingReview: TrackingFlag
  interviewCoach: TrackingFlag
}

export type AdminUserListItem = {
  id: string
  name: string
  email: string
  joinedAt: string | null
  lastActiveAt: string | null
  selectedRoute: string | null
  goal: string | null
  hasSavedPlan: boolean
  savedPlanTracked: boolean
  cvStatus: AdminCvStatus
  cvTracked: boolean
  applyNowClicks: number
  applyNowTracked: boolean
  courseInterest: string | null
  engagement: AdminUserEngagement
  insight: string
}

export type AdminUsersSummary = {
  totalUsers: number
  newUsersThisWeek: number
  usersWithSavedPlans: number
  usersWithCvs: number
  usersWithApplyNow: number
  mostCommonRoute: string | null
  returningUsers: number
  /** True when auth.admin.listUsers worked */
  usersAvailable: boolean
  notes: string[]
}

export type AdminUserDetail = {
  profile: {
    id: string
    name: string
    email: string
    createdAt: string | null
    lastSignInAt: string | null
    accountStatus: string
  }
  career: {
    tracked: boolean
    latestGoal: string | null
    latestRoute: string | null
    currentTargetRole: string | null
    nextUpgrade: string | null
    readinessScore: number | null
    readinessTracked: boolean
    savedPlan: boolean
    assessmentCount: number
    hint?: string
  }
  documents: {
    cvTracked: boolean
    cvExists: boolean
    cvLastUpdated: string | null
    cvStatus: AdminCvStatus
    cvReadinessScore: number | null
    cvReadinessTracked: boolean
    coverLetterTracked: boolean
    coverLetterExists: boolean
    writingReviewTracked: boolean
    writingReviewUsed: boolean
    hint?: string
  }
  courses: {
    tracked: boolean
    applyNowClicks: number
    clickedCourses: string[]
    clickedProviders: string[]
    latestClickAt: string | null
    hint?: string
  }
  aiUsage: {
    careerAssistantSessions: number
    careerAssistantTracked: boolean
    cvBuilderUsage: string
    coverLetterUsage: string
    writingReviewUsage: string
    interviewCoachUsage: string
  }
  adminNotes: {
    available: boolean
    note: string | null
    placeholder: string
  }
  engagement: AdminUserEngagement
  insight: string
  tracking: AdminUsersTracking
}

export type AdminUsersListResult = {
  ok: boolean
  users: AdminUserListItem[]
  summary: AdminUsersSummary
  tracking: AdminUsersTracking
  routes: string[]
  error?: string
}
