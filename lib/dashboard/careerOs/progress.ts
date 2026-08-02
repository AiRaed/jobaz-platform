import type { CareerMilestone } from './types'

/** Progress = completed milestones / total milestones (no partial credit). */
export function calculateMilestoneProgress(milestones: CareerMilestone[]): number {
  if (!milestones.length) return 0
  const complete = milestones.filter((m) => m.status === 'complete').length
  return Math.round((complete / milestones.length) * 100)
}
