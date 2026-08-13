/**
 * Work in My Education — stage semantics.
 *
 * Library-path wizard stage selection is the user's TARGET career stage
 * (where they want to progress). Current readiness is estimated separately
 * from experience / training signals — never treated as the same field.
 */

import { classifyStageBand, type StageBand } from './match-safety/stage-bands'

export type WieStageMeaning = 'target' | 'current'

/** Library-path selection means target stage (progression goal). */
export const WIE_LIBRARY_PATH_STAGE_MEANING: WieStageMeaning = 'target'

export type WieReadinessBand =
  | 'early_career'
  | 'graduate_entry'
  | 'developing_professional'
  | 'experienced'
  | 'leadership_ready'

export type WieStageContext = {
  stage_meaning: WieStageMeaning
  /** Selected ladder stage from the wizard (target when meaning=target). */
  selected_stage_label: string
  selected_stage_key: string
  target_stage_label: string | null
  current_stage_label: string | null
  estimated_current_readiness: string
  estimated_current_readiness_band: WieReadinessBand
  years_relevant_experience: number
  readiness_note: string
}

export function readinessBandLabel(band: WieReadinessBand): string {
  switch (band) {
    case 'early_career':
      return 'Early career'
    case 'graduate_entry':
      return 'Graduate entry'
    case 'developing_professional':
      return 'Developing professional'
    case 'experienced':
      return 'Experienced'
    case 'leadership_ready':
      return 'Leadership-ready'
    default:
      return 'Early career'
  }
}

/**
 * Cautious readiness estimate — do not claim a precise library stage.
 */
export function estimateCurrentReadiness(input: {
  yearsRelevantExperience?: number | null
  completedTrainingCount?: number
  targetStageKey?: string | null
  targetStageLabel?: string | null
}): {
  band: WieReadinessBand
  label: string
  note: string
  /** Synthetic stage band used for immediate-route classification */
  matchingStageBand: StageBand
} {
  const years = Math.max(0, Number(input.yearsRelevantExperience ?? 0) || 0)
  const completed = input.completedTrainingCount ?? 0

  if (years >= 8) {
    return {
      band: 'leadership_ready',
      label: readinessBandLabel('leadership_ready'),
      note: 'Estimated from substantial reported experience — confirm against role requirements.',
      matchingStageBand: 'leadership',
    }
  }
  if (years >= 4) {
    return {
      band: 'experienced',
      label: readinessBandLabel('experienced'),
      note: 'Estimated from several years of relevant experience.',
      matchingStageBand: 'specialist',
    }
  }
  if (years >= 2) {
    return {
      band: 'developing_professional',
      label: readinessBandLabel('developing_professional'),
      note: 'Estimated from early professional experience.',
      matchingStageBand: 'officer',
    }
  }
  if (years >= 1 || completed >= 3) {
    return {
      band: 'graduate_entry',
      label: readinessBandLabel('graduate_entry'),
      note: 'Estimated graduate / early-career readiness from limited experience or completed training.',
      matchingStageBand: 'graduate',
    }
  }

  return {
    band: 'early_career',
    label: readinessBandLabel('early_career'),
    note: 'Estimated early-career readiness — little or no relevant experience reported.',
    matchingStageBand: 'graduate',
  }
}

export function buildWieStageContext(input: {
  selectedStageLabel: string
  selectedStageKey: string
  yearsRelevantExperience?: number | null
  completedTrainingCount?: number
  stageMeaning?: WieStageMeaning
}): WieStageContext {
  const meaning = input.stageMeaning ?? WIE_LIBRARY_PATH_STAGE_MEANING
  const years = Math.max(0, Number(input.yearsRelevantExperience ?? 0) || 0)
  const readiness = estimateCurrentReadiness({
    yearsRelevantExperience: years,
    completedTrainingCount: input.completedTrainingCount,
    targetStageKey: input.selectedStageKey,
    targetStageLabel: input.selectedStageLabel,
  })

  if (meaning === 'target') {
    return {
      stage_meaning: 'target',
      selected_stage_label: input.selectedStageLabel,
      selected_stage_key: input.selectedStageKey,
      target_stage_label: input.selectedStageLabel,
      current_stage_label: null,
      estimated_current_readiness: readiness.label,
      estimated_current_readiness_band: readiness.band,
      years_relevant_experience: years,
      readiness_note: readiness.note,
    }
  }

  return {
    stage_meaning: 'current',
    selected_stage_label: input.selectedStageLabel,
    selected_stage_key: input.selectedStageKey,
    target_stage_label: null,
    current_stage_label: input.selectedStageLabel,
    estimated_current_readiness: readiness.label,
    estimated_current_readiness_band: readiness.band,
    years_relevant_experience: years,
    readiness_note: readiness.note,
  }
}

/** Matching keys/labels when stage selection is a TARGET (use readiness, not target, for immediate). */
export function matchingStageForImmediateRoutes(ctx: WieStageContext): {
  stageKey: string
  stageLabel: string
} {
  if (ctx.stage_meaning !== 'target') {
    return { stageKey: ctx.selected_stage_key, stageLabel: ctx.selected_stage_label }
  }
  const readiness = estimateCurrentReadiness({
    yearsRelevantExperience: ctx.years_relevant_experience,
  })
  // Synthetic keys — classifyStageBand understands graduate / foundation / leadership
  if (readiness.matchingStageBand === 'leadership') {
    return { stageKey: 'leadership', stageLabel: 'Leadership' }
  }
  if (readiness.matchingStageBand === 'specialist' || readiness.matchingStageBand === 'officer') {
    return { stageKey: 'professional_practitioner', stageLabel: 'Professional Practitioner' }
  }
  if (readiness.matchingStageBand === 'foundation') {
    return { stageKey: 'foundation_social_support', stageLabel: 'Foundation / Entry' }
  }
  return { stageKey: 'graduate_social_sciences_entry', stageLabel: 'Graduate Entry' }
}

export function targetStageBand(ctx: WieStageContext): StageBand {
  const label = ctx.target_stage_label ?? ctx.selected_stage_label
  const key = ctx.selected_stage_key
  return classifyStageBand(key, label)
}

export function towardTargetNote(ctx: WieStageContext | null | undefined): string | null {
  if (!ctx || ctx.stage_meaning !== 'target' || !ctx.target_stage_label) return null
  return `This role is a practical starting point toward your ${ctx.target_stage_label} target.`
}
