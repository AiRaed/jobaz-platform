import type { AssessmentAnswers } from '@/lib/jobaz-ai/types'

export type EngagementSignals = {
  assessmentCount: number
  hasSignupClick: boolean
  hasToolClick: boolean
}

/** Readiness from latest assessment answers (max 100). */
export function computeReadinessScore(answers: AssessmentAnswers): number {
  let score = 0
  if (answers.cv === 'yes') score += 25
  if (answers.english === 'intermediate' || answers.english === 'good') score += 15
  if (answers.experience === 'some' || answers.experience === 'strong') score += 15
  if (answers.helpNext === 'interviews') score += 10
  return Math.min(score, 100)
}

/**
 * Engagement from assessment completions and funnel actions (max 100).
 * +10 per completed assessment, +5 signup click, +5 tool click, +5 per repeat assessment.
 */
export function computeEngagementScore(signals: EngagementSignals): number {
  const { assessmentCount, hasSignupClick, hasToolClick } = signals
  if (assessmentCount <= 0) return 0

  let score = assessmentCount * 10
  if (hasSignupClick) score += 5
  if (hasToolClick) score += 5
  if (assessmentCount > 1) score += (assessmentCount - 1) * 5

  return Math.min(score, 100)
}
