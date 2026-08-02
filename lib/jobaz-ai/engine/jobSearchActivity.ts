/**
 * Job search activity metric — tracks browsing, saving, and applying behaviour.
 */

import { clampScore } from '@/lib/jobaz-ai/profile/careerStage'
import type { EngineProgressionMeta } from './types'

export function getJobSearchActivityScore(meta: EngineProgressionMeta): number {
  if (typeof meta.jobSearchActivityScore === 'number') {
    return clampScore(meta.jobSearchActivityScore)
  }
  const saved = meta.jobsSavedCount ?? 0
  const applied = meta.jobsAppliedCount ?? 0
  return clampScore(saved * 8 + applied * 12)
}

export function applyJobSearchActivityDelta(
  meta: EngineProgressionMeta,
  delta: number
): EngineProgressionMeta {
  if (!delta) return meta
  const current = getJobSearchActivityScore(meta)
  return {
    ...meta,
    jobSearchActivityScore: clampScore(current + delta),
  }
}

export function hasJobSearchActivity(meta: EngineProgressionMeta | undefined): boolean {
  if (!meta) return false
  return (
    (meta.jobsSavedCount ?? 0) > 0 ||
    (meta.jobsAppliedCount ?? 0) > 0 ||
    getJobSearchActivityScore(meta) >= 8
  )
}

export function isLowJobActivity(meta: EngineProgressionMeta | undefined): boolean {
  if (!meta) return true
  return (meta.jobsSavedCount ?? 0) + (meta.jobsAppliedCount ?? 0) < 2
}

/** User is applying but may need interview prep. */
export function shouldRecommendInterviewAfterApplications(
  meta: EngineProgressionMeta | undefined,
  readiness: number
): boolean {
  if (!meta) return false
  const applied = meta.jobsAppliedCount ?? 0
  const interviews = meta.interviewSessionsCount ?? 0
  return applied >= 1 && (interviews < 2 || readiness < 58)
}
