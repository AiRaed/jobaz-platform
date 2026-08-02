export type CareerStage = 'Beginner' | 'Active' | 'Prepared' | 'Job Ready'

export type ProgressTrend = 'improving' | 'stable' | 'inactive'

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function careerStageFromReadiness(readinessScore: number): CareerStage {
  const score = clampScore(readinessScore)
  if (score <= 25) return 'Beginner'
  if (score <= 50) return 'Active'
  if (score <= 75) return 'Prepared'
  return 'Job Ready'
}

export function computeProgressTrend(
  currentReadiness: number,
  previousReadiness: number | undefined
): ProgressTrend {
  if (previousReadiness === undefined) return 'stable'
  if (currentReadiness > previousReadiness) return 'improving'
  if (currentReadiness < previousReadiness) return 'inactive'
  return 'stable'
}

export const PROGRESS_TREND_LABELS: Record<ProgressTrend, string> = {
  improving: '↑ Improving',
  stable: '→ Stable',
  inactive: '↓ Inactive',
}
