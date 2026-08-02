/**
 * Universal field alignment — one question, three meanings (yes / no / both).
 */

import { applyBridgeModeToProfile } from './bridgeRoleIntelligence'
import { applyDualPathModeToProfile } from './dualPathMode'
import { applyFlexibleEmploymentModeToProfile } from './flexibleEmploymentMode'
import { getWorkSpeed } from './speedDevelopmentMode'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile } from './types'

export type FieldAlignment = 'yes' | 'no' | 'both'

export const FIELD_ALIGNMENT_QUESTION_ID = 'cb_field_alignment'

const LEGACY_ANSWER_KEYS = [
  'cb_field_alignment',
  'cb_first_job_career_preference',
  'cb_student_work_intent',
  'cb_graduate_field_intent',
  'cb_field_intent',
  'cb_global_education_intent',
  'cb_professional_field_intent',
] as const

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const FIELD_ALIGNMENT_QUESTION = q(
  FIELD_ALIGNMENT_QUESTION_ID,
  'Do you want to work in this field?',
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'both', label: 'Both' },
  ]
)

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

/** Map legacy route-specific answers onto yes / no / both. */
export function normalizeFieldAlignment(raw: string | null | undefined): FieldAlignment | null {
  const v = String(raw ?? '').trim().toLowerCase()
  if (!v) return null

  if (v === 'yes' || v === 'yes_only' || v === 'same_field' || v === 'related_studies') {
    return 'yes'
  }
  if (
    v === 'no' ||
    v === 'open_any' ||
    v === 'no_longer' ||
    v === 'any_job' ||
    v === 'change_field' ||
    v === 'no_different'
  ) {
    return 'no'
  }
  if (
    v === 'both' ||
    v === 'prefer_field' ||
    v === 'open_both' ||
    v === 'related_field' ||
    v === 'unsure' ||
    v === 'maybe_partly'
  ) {
    return 'both'
  }

  if (v.includes('yes') && !v.includes('no')) return 'yes'
  if (v.includes('same_field') || v.includes('study_related') || v.includes('yes_continue')) {
    return 'yes'
  }
  if (v.includes('related') && !v.includes('change') && !v.includes('different')) {
    return 'yes'
  }
  if (v.includes('different') || v.includes('change_field') || v.includes('any_job')) {
    return 'no'
  }
  if (v.includes('open_both') || v.includes('prefer') || v.includes('unsure')) {
    return 'both'
  }

  return null
}

export function getFieldAlignmentRaw(state: CareerBrainState): string | null {
  for (const key of LEGACY_ANSWER_KEYS) {
    const v = answers(state)[key]
    if (v !== undefined && v !== null && String(v).trim()) {
      return String(v)
    }
  }
  return null
}

export function getFieldAlignment(state: CareerBrainState): FieldAlignment | null {
  return normalizeFieldAlignment(getFieldAlignmentRaw(state))
}

export function hasFieldAlignmentAnswer(state: CareerBrainState): boolean {
  return getFieldAlignment(state) !== null
}

export function isFieldAlignmentYes(state: CareerBrainState): boolean {
  return getFieldAlignment(state) === 'yes'
}

export function isFieldAlignmentNo(state: CareerBrainState): boolean {
  return getFieldAlignment(state) === 'no'
}

export function isFieldAlignmentBoth(state: CareerBrainState): boolean {
  return getFieldAlignment(state) === 'both'
}

/** Apply universal YES / NO / BOTH rules to the career profile. */
export function applyFieldAlignmentToProfile(
  profile: CareerProfile,
  state: CareerBrainState,
  alignment?: FieldAlignment | null
): CareerProfile {
  const pref = alignment ?? getFieldAlignment(state)
  if (!pref) return profile

  let next: CareerProfile = {
    ...profile,
    constraints: [...new Set([...profile.constraints, 'field-alignment-set'])],
  }

  if (pref === 'yes') {
    next.wantsSameField = true
    next.wantsCareerChange = false
    next.constraints = [
      ...new Set([...next.constraints, 'field-first-education', 'bridge-role-mode', 'field-aligned-only']),
    ]
    return applyBridgeModeToProfile(next, state)
  }

  if (pref === 'no') {
    next.wantsSameField = false
    next.wantsCareerChange = true
    next.constraints = [
      ...new Set([
        ...next.constraints,
        'flexible-employment-mode',
        'deprioritise-study-alignment',
        'employability-first',
      ]),
    ]
    return applyFlexibleEmploymentModeToProfile(next, state)
  }

  // both — flexible Work Now, field-aligned Build Next / Long-Term
  next.wantsSameField = true
  next.wantsCareerChange = false
  next.constraints = [
    ...new Set([
      ...next.constraints,
      'education-aligned',
      'dual-path-mode',
      'hybrid-path-mode',
      'education-income-balance',
    ]),
  ]
  const urgent = getWorkSpeed(state) === 'urgent' || next.urgencyLevel === 'high'
  if (urgent) {
    return applyDualPathModeToProfile(next, state)
  }
  return applyBridgeModeToProfile(next, state)
}

export function buildFieldAlignmentReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state) return []
  const pref = getFieldAlignment(state)
  if (!pref) return []

  const field = profile.studyField ?? profile.workExperienceField ?? profile.targetField ?? 'your field'
  const lines = [`Field alignment — ${field}.`]

  if (pref === 'yes') {
    lines.push(
      'You want to work in this field — recommendations prioritise field-aligned Work Now, training, and long-term progression.',
    )
  } else if (pref === 'no') {
    lines.push(
      'You are open to work outside this field — we prioritise employability, hiring speed, and realistic entry opportunities.',
    )
  } else {
    lines.push(
      'You would prefer this field but are also open to other opportunities — Work Now may include broader roles; Build Next and Long-Term stay connected to your field where possible.',
    )
  }

  return lines
}
