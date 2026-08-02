/**
 * Skill / learning activity helpers for the AI engine.
 */

import type { EngineProgressionMeta } from './types'

export function hasActiveSkillLearning(meta: EngineProgressionMeta | undefined): boolean {
  if (!meta) return false
  return (meta.lessonsCompleted ?? 0) >= 1
}

export function isImproveSkillsGoal(dominantGoal: string | null | undefined): boolean {
  if (!dominantGoal) return false
  const normalized = dominantGoal.toLowerCase().replace(/-/g, '_')
  return normalized === 'improve_skills' || normalized === 'improve skills'
}
