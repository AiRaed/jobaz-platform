import type { SavedPlanInsight, SavedPlanStatus } from './types'

const STALE_DAYS = 30
const TEST_EMAIL_RE = /(test|demo|example\.com|jobaz\.test|localhost)/i

export function isLikelyTestEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return TEST_EMAIL_RE.test(email)
}

export function classifyPlanStatus(params: {
  savedAt: string | null
  isTest: boolean
  email?: string | null
  now?: number
}): SavedPlanStatus {
  if (params.isTest || isLikelyTestEmail(params.email)) return 'test'
  if (!params.savedAt) return 'stale'
  const t = new Date(params.savedAt).getTime()
  if (Number.isNaN(t)) return 'stale'
  const days = ((params.now ?? Date.now()) - t) / (24 * 60 * 60 * 1000)
  if (days > STALE_DAYS) return 'stale'
  return 'active'
}

export function buildPlanInsight(params: {
  status: SavedPlanStatus
  hasCv: boolean
  applyNowClicks: number
  recommendedCourse: string | null
  courseInterest: boolean
}): { insight: SavedPlanInsight; detail: string } {
  if (params.status === 'test') {
    return {
      insight: 'Test/demo',
      detail: 'Possible test/demo plan — exclude from launch demand metrics unless verified.',
    }
  }
  if (params.applyNowClicks > 0) {
    return {
      insight: 'High intent',
      detail: 'Saved plan + Apply Now click — strong course/affiliate interest.',
    }
  }
  if (params.recommendedCourse && params.courseInterest) {
    return {
      insight: 'Course interest',
      detail: `Course interest around: ${params.recommendedCourse}`,
    }
  }
  if (params.recommendedCourse && !params.hasCv) {
    return {
      insight: 'Needs CV follow-up',
      detail: 'Has recommended course / plan but no CV yet.',
    }
  }
  if (!params.hasCv) {
    return {
      insight: 'Needs CV follow-up',
      detail: 'Saved plan without a CV — good follow-up candidate.',
    }
  }
  if (params.status === 'stale') {
    return {
      insight: 'Dormant plan',
      detail: 'Plan saved more than 30 days ago with little recent signal.',
    }
  }
  if (params.recommendedCourse) {
    return {
      insight: 'Course interest',
      detail: `Recommended course: ${params.recommendedCourse}`,
    }
  }
  return {
    insight: 'Active plan',
    detail: 'Recent saved plan with platform engagement.',
  }
}
