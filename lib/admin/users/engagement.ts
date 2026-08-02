import type { AdminCvStatus, AdminUserEngagement } from './types'

const TEST_EMAIL_RE = /(test|demo|example\.com|jobaz\.test|localhost)/i
const DORMANT_DAYS = 21
const NEW_DAYS = 7
const ACTIVE_DAYS = 14

export function isLikelyTestEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return TEST_EMAIL_RE.test(email)
}

export function daysSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return (now - t) / (24 * 60 * 60 * 1000)
}

export function computeEngagement(params: {
  email: string
  joinedAt: string | null
  lastActiveAt: string | null
  hasSavedPlan: boolean
  hasCv: boolean
  applyNowClicks: number
  hasCourseInterest: boolean
  assessmentCount: number
  forceTest?: boolean
}): AdminUserEngagement {
  if (params.forceTest || isLikelyTestEmail(params.email)) return 'Test/demo'

  const highIntent =
    params.hasSavedPlan &&
    (params.applyNowClicks > 0 || params.hasCourseInterest)

  if (highIntent) return 'High intent'

  const joinedDays = daysSince(params.joinedAt)
  const activeDays = daysSince(params.lastActiveAt)
  const littleActivity =
    !params.hasSavedPlan &&
    !params.hasCv &&
    params.applyNowClicks === 0 &&
    params.assessmentCount === 0

  if (joinedDays != null && joinedDays <= NEW_DAYS && littleActivity) return 'New'
  if (littleActivity && (joinedDays == null || joinedDays <= NEW_DAYS)) return 'New'

  const recentlyActive =
    (activeDays != null && activeDays <= ACTIVE_DAYS) ||
    params.hasSavedPlan ||
    params.hasCv ||
    params.assessmentCount > 0

  if (
    !recentlyActive &&
    activeDays != null &&
    activeDays > DORMANT_DAYS
  ) {
    return 'Dormant'
  }

  if (
    littleActivity &&
    joinedDays != null &&
    joinedDays > DORMANT_DAYS
  ) {
    return 'Dormant'
  }

  if (recentlyActive) return 'Active'

  if (joinedDays != null && joinedDays > DORMANT_DAYS) return 'Dormant'
  return 'New'
}

export function buildInsight(params: {
  engagement: AdminUserEngagement
  hasSavedPlan: boolean
  hasCv: boolean
  applyNowClicks: number
  courseInterest: string | null
  assessmentCount: number
}): string {
  if (params.engagement === 'Test/demo') {
    return 'Possible test/demo account — exclude from launch metrics unless verified.'
  }
  if (params.hasSavedPlan && params.applyNowClicks > 0) {
    return 'High intent user: saved plan + clicked Apply Now'
  }
  if (params.hasSavedPlan && params.courseInterest) {
    return `Course interest: ${params.courseInterest}`
  }
  if (params.hasSavedPlan && !params.hasCv) {
    return 'Needs follow-up: started/saved plan but no CV'
  }
  if (params.assessmentCount > 0 && !params.hasSavedPlan) {
    return 'Started Career Assistant but plan not clearly saved'
  }
  if (params.engagement === 'Dormant') {
    return 'Dormant: signed up but little recent activity'
  }
  if (params.engagement === 'New') {
    return 'New: signed up with little activity so far'
  }
  if (params.hasCv && params.hasSavedPlan) {
    return 'Active journey: plan + CV present'
  }
  if (params.applyNowClicks > 0) {
    return 'Clicked Apply Now — check course/affiliate follow-up'
  }
  return 'Active user with some platform engagement'
}

export function deriveCvStatus(params: {
  exists: boolean
  meaningful: boolean | null
  updatedAt: string | null
}): AdminCvStatus {
  if (!params.exists) return 'none'
  if (params.meaningful === true) return 'completed'
  if (params.updatedAt) return 'saved'
  return 'started'
}
