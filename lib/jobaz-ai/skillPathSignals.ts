/**
 * Build Your Path → central AI engine signal helpers.
 */

import { emitAiSignal } from '@/lib/jobaz-ai/emitSignal'

const SOURCE = 'build-your-path'

export function emitSkillPathViewed(): void {
  const day = new Date().toISOString().slice(0, 10)
  void emitAiSignal({
    type: 'skill_path_viewed',
    source: SOURCE,
    impact: { engagement: 2 },
    metadata: {
      dedupeId: `paths-list-${day}`,
      action: 'page_view',
    },
  })
}

export function emitSkillPathStarted(params: {
  pathId: string
  pathName: string
}): void {
  void emitAiSignal({
    type: 'skill_path_started',
    source: SOURCE,
    impact: { readiness: 6, engagement: 5 },
    metadata: {
      dedupeId: params.pathId,
      path_id: params.pathId,
      path_name: params.pathName,
    },
  })
}

export function emitSkillGoalSelected(params: {
  pathId: string
  pathName: string
  goalType: 'path' | 'cv' | 'jobs' | 'course'
  goalLabel?: string
}): void {
  void emitAiSignal({
    type: 'skill_goal_selected',
    source: SOURCE,
    impact: { readiness: 4, engagement: 4 },
    metadata: {
      dedupeId: `${params.pathId}-${params.goalType}-${params.goalLabel ?? 'default'}`,
      path_id: params.pathId,
      path_name: params.pathName,
      goal_type: params.goalType,
      goal_label: params.goalLabel,
    },
  })
}

export function emitLessonCompleted(params: {
  pathId: string
  pathName: string
  lessonId: string
}): void {
  void emitAiSignal({
    type: 'lesson_completed',
    source: SOURCE,
    impact: { readiness: 8, engagement: 6 },
    metadata: {
      dedupeId: `${params.pathId}-${params.lessonId}`,
      path_id: params.pathId,
      path_name: params.pathName,
      lesson_id: params.lessonId,
    },
  })
}
