/**
 * Dynamic AI engagement — activity boosts and inactivity decay.
 */

import { clampScore } from '@/lib/jobaz-ai/profile/careerStage'
import { INACTIVITY_DAYS, INACTIVITY_ENGAGEMENT_PENALTY } from './types'

export function calculateBaseEngagement(params: {
  assessmentCount: number
  jobsSavedCount?: number
  jobsAppliedCount?: number
  interviewSessionsCount?: number
  writingReviewCount?: number
}): number {
  const {
    assessmentCount,
    jobsSavedCount = 0,
    jobsAppliedCount = 0,
    interviewSessionsCount = 0,
    writingReviewCount = 0,
  } = params

  if (assessmentCount <= 0 && jobsAppliedCount === 0) return 0

  let score = assessmentCount * 8
  score += Math.min(jobsSavedCount * 2, 12)
  score += Math.min(jobsAppliedCount * 4, 20)
  score += Math.min(interviewSessionsCount * 3, 15)
  score += Math.min(writingReviewCount * 2, 10)
  if (assessmentCount > 1) score += (assessmentCount - 1) * 4

  return clampScore(score)
}

export function applyEngagementDelta(current: number, delta: number): number {
  return clampScore(current + delta)
}

export function applyInactivityPenalty(
  engagement: number,
  lastActiveAt: string | null | undefined,
  appliedKeys: string[] = []
): { engagement: number; applied: boolean; dedupeKey?: string } {
  if (!lastActiveAt) return { engagement, applied: false }

  const last = new Date(lastActiveAt).getTime()
  const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)
  if (daysSince < INACTIVITY_DAYS) return { engagement, applied: false }

  const monthKey = `inactivity_penalty:${new Date().toISOString().slice(0, 7)}`
  if (appliedKeys.includes(monthKey)) return { engagement, applied: false }

  return {
    engagement: applyEngagementDelta(engagement, -INACTIVITY_ENGAGEMENT_PENALTY),
    applied: true,
    dedupeKey: monthKey,
  }
}

export function deriveEngagementAfterSignal(
  row: { engagement_score: number | null; assessment_count: number | null; progression_meta?: { jobsSavedCount?: number; jobsAppliedCount?: number; interviewSessionsCount?: number; writingReviewCount?: number } | null },
  engagementDelta: number
): number {
  const base = clampScore(
    row.engagement_score ??
      calculateBaseEngagement({
        assessmentCount: row.assessment_count ?? 0,
        jobsSavedCount: row.progression_meta?.jobsSavedCount,
        jobsAppliedCount: row.progression_meta?.jobsAppliedCount,
        interviewSessionsCount: row.progression_meta?.interviewSessionsCount,
        writingReviewCount: row.progression_meta?.writingReviewCount,
      })
  )
  if (engagementDelta === 0) return base
  return applyEngagementDelta(base, engagementDelta)
}
