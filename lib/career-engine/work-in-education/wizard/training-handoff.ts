/**
 * Persist WIE completed / recommended training for CV Builder + My Plan handoff.
 * sessionStorage only — self-reported, never invent certificates.
 */

import type { WieTrainingRecommendations } from '@/lib/career-engine/work-in-education/course-alignment'

export const WIE_TRAINING_CV_HANDOFF_KEY = 'jobaz.wie.training_cv_handoff.v1'
export const WIE_TRAINING_PLAN_HANDOFF_KEY = 'jobaz.wie.training_plan_handoff.v1'

export type WieTrainingCvHandoff = {
  completed_course_types: string[]
  completed_course_notes?: string
  field?: string
  specialism?: string
  stage?: string
  updated_at: string
  note: string
}

export type WieTrainingPlanHandoff = {
  next_course_titles: string[]
  skip_course_titles: string[]
  field?: string
  specialism?: string
  stage?: string
  updated_at: string
}

export function saveWieTrainingHandoffs(input: {
  training: WieTrainingRecommendations | null | undefined
  field?: string
  specialism?: string
  stage?: string
}): void {
  if (typeof window === 'undefined') return
  const training = input.training
  try {
    const cv: WieTrainingCvHandoff = {
      completed_course_types: training?.completed_course_types ?? [],
      completed_course_notes: training?.completed_course_notes,
      field: input.field,
      specialism: input.specialism,
      stage: input.stage,
      updated_at: new Date().toISOString(),
      note: 'Self-reported training from Work in My Education — only include if the user selected it.',
    }
    window.sessionStorage.setItem(WIE_TRAINING_CV_HANDOFF_KEY, JSON.stringify(cv))

    const next = [
      ...(training?.recommended_next ?? []),
      ...(training?.optional_boosters ?? []),
      ...(training?.professional_regulated ?? []),
    ]
      .filter((c) => !c.already_completed)
      .map((c) => c.title)

    const plan: WieTrainingPlanHandoff = {
      next_course_titles: [...new Set(next)].slice(0, 8),
      skip_course_titles: [...new Set(training?.completed_course_types ?? [])],
      field: input.field,
      specialism: input.specialism,
      stage: input.stage,
      updated_at: new Date().toISOString(),
    }
    window.sessionStorage.setItem(WIE_TRAINING_PLAN_HANDOFF_KEY, JSON.stringify(plan))
  } catch {
    // ignore
  }
}

export function loadWieTrainingCvHandoff(): WieTrainingCvHandoff | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(WIE_TRAINING_CV_HANDOFF_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WieTrainingCvHandoff
  } catch {
    return null
  }
}

export function loadWieTrainingPlanHandoff(): WieTrainingPlanHandoff | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(WIE_TRAINING_PLAN_HANDOFF_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WieTrainingPlanHandoff
  } catch {
    return null
  }
}
