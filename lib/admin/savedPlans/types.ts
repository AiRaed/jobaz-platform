/** Admin Saved Plans — types (summaries only; no raw assessment/CV JSON). */

export type SavedPlanStatus = 'active' | 'stale' | 'test'

export type SavedPlanInsight =
  | 'High intent'
  | 'Needs CV follow-up'
  | 'Course interest'
  | 'Dormant plan'
  | 'Test/demo'
  | 'Active plan'

export type AdminCvStatus = 'none' | 'started' | 'saved' | 'completed' | 'not_tracked'

export type SavedPlanListItem = {
  id: string
  userId: string | null
  userName: string
  email: string
  goal: string | null
  route: string | null
  targetRole: string | null
  nextUpgrade: string | null
  recommendedCourse: string | null
  readiness: number | null
  readinessTracked: boolean
  savedAt: string | null
  cvStatus: AdminCvStatus
  applyNowClicks: number
  applyNowTracked: boolean
  status: SavedPlanStatus
  insight: SavedPlanInsight
}

export type SavedPlansSummary = {
  totalSavedPlans: number
  savedThisWeek: number
  mostCommonRoute: string | null
  mostCommonTargetRole: string | null
  plansWithRecommendedCourse: number
  plansWithApplyNow: number
  plansWithCv: number
  assessmentsAvailable: boolean
  notes: string[]
}

export type SavedPlanDetail = {
  id: string
  profile: {
    userId: string | null
    name: string
    email: string
  }
  plan: {
    goal: string | null
    route: string | null
    targetRole: string | null
    nextUpgrade: string | null
    recommendedCourse: string | null
    readiness: number | null
    readinessTracked: boolean
    savedAt: string | null
    status: SavedPlanStatus
    workNowRoles: string[]
    optionalAddons: string[]
    cvAction: string | null
  }
  documents: {
    cvTracked: boolean
    cvStatus: AdminCvStatus
    cvUpdatedAt: string | null
  }
  courses: {
    tracked: boolean
    applyNowClicks: number
    clickedCourses: string[]
    clickedProviders: string[]
    relatedProvider: string | null
    latestClickAt: string | null
  }
  insight: SavedPlanInsight
  insightDetail: string
}

export type SavedPlansListResult = {
  ok: boolean
  plans: SavedPlanListItem[]
  summary: SavedPlansSummary
  routes: string[]
  goals: string[]
  error?: string
}
