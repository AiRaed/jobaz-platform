/**
 * AI career evolution stages — rule-based progress over time.
 */

import type { EngineProgressionMeta } from './types'

export type AiEvolutionStage =
  | 'beginner'
  | 'active'
  | 'improving'
  | 'job_ready'
  | 'interview_ready'

export const EVOLUTION_STAGE_LABELS: Record<AiEvolutionStage, string> = {
  beginner: 'Beginner',
  active: 'Active',
  improving: 'Improving',
  job_ready: 'Job Ready',
  interview_ready: 'Interview Ready',
}

export function parseEvolutionStage(raw: string | null | undefined): AiEvolutionStage | null {
  const allowed: AiEvolutionStage[] = [
    'beginner',
    'active',
    'improving',
    'job_ready',
    'interview_ready',
  ]
  if (raw && allowed.includes(raw as AiEvolutionStage)) {
    return raw as AiEvolutionStage
  }
  return null
}

/**
 * Derives the user's AI evolution stage from scores, activity, and profile signals.
 */
export function evolveAiStage(params: {
  readiness: number
  engagement: number
  cvStatus: string | null
  dominantGoal: string | null
  meta: EngineProgressionMeta
  readinessBefore: number
}): AiEvolutionStage {
  const { readiness, engagement, cvStatus, dominantGoal, meta, readinessBefore } = params
  const interviews = meta.interviewSessionsCount ?? 0
  const applications = meta.jobsAppliedCount ?? 0
  const writing = meta.writingReviewCount ?? 0
  const improving = readiness > readinessBefore

  if (readiness >= 72 && interviews >= 2) return 'interview_ready'
  if (
    readiness >= 58 &&
    (applications >= 1 || cvStatus === 'yes') &&
    interviews >= 1
  ) {
    return 'interview_ready'
  }
  if (readiness >= 55 && (applications >= 2 || cvStatus === 'yes')) {
    return 'job_ready'
  }
  if (dominantGoal === 'interviews' && readiness >= 45 && interviews >= 1) {
    return 'improving'
  }
  if (readiness >= 38 || improving || writing >= 2) return 'improving'
  if (readiness >= 12 || engagement >= 10 || meta.lessonsCompleted) return 'active'
  return 'beginner'
}

/** Maps evolution stage to legacy career_stage column for admin compatibility. */
export function legacyCareerStageFromEvolution(stage: AiEvolutionStage): string {
  switch (stage) {
    case 'beginner':
      return 'Beginner'
    case 'active':
      return 'Active'
    case 'improving':
      return 'Prepared'
    case 'job_ready':
    case 'interview_ready':
      return 'Job Ready'
    default:
      return 'Beginner'
  }
}
