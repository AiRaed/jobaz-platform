/**
 * Professional stage / chartership gate (Engineering fully implemented).
 */

import type {
  EffectiveFit,
  KnowledgeRoleRow,
  KnowledgeStageRow,
  NormalisedWorkInEducationProfile,
} from './types'

export type ProfessionalStageGateResult = {
  applies: boolean
  stage_key: string | null
  chartership_required: boolean
  chartership_confirmed: boolean
  stage_implies_professional_status: boolean
  warnings: string[]
  demote_codes: string[]
  force_fit: EffectiveFit | null
  gaps: Array<{
    type: string
    severity: 'info' | 'warning' | 'blocker'
    code: string
    message_key: string
    message: string
    details: Record<string, unknown>
  }>
  scope_gate: string
}

const CHARTERED_STAGE_KEYS = new Set([
  'chartered_professional_engineer',
  'chartered_engineer',
])

const ENTRYISH_TITLE =
  /\b(graduate|assistant|trainee|technician|apprentice|junior|support)\b/i

const EXPLICIT_CHARTERED_TITLE =
  /\b(ceng|ieng|engtech|chartered engineer|incorporated engineer|chartered professional)\b/i

function profileHasCEng(profile: NormalisedWorkInEducationProfile): boolean {
  return profile.professional_registration.some(
    (r) =>
      r.status === 'registered' &&
      /\bceng\b|chartered engineer|engineering council|ice\b|imeche|iet\b/i.test(r.body)
  )
}

export function evaluateProfessionalStageGate(args: {
  profile: NormalisedWorkInEducationProfile
  role: KnowledgeRoleRow
  stage: KnowledgeStageRow | null
  fieldSlug: string
}): ProfessionalStageGateResult {
  const { profile, role, stage, fieldSlug } = args
  const empty: ProfessionalStageGateResult = {
    applies: false,
    stage_key: stage?.stage_key ?? null,
    chartership_required: false,
    chartership_confirmed: false,
    stage_implies_professional_status: false,
    warnings: [],
    demote_codes: [],
    force_fit: null,
    gaps: [],
    scope_gate: 'not_applicable',
  }

  if (fieldSlug !== 'engineering') return empty

  const stageKey = stage?.stage_key ?? null
  const title = role.name
  const note = `${role.eligibility_note ?? ''} ${JSON.stringify(role.metadata ?? {})}`
  const years = profile.years_relevant_experience
  const min = role.minimum_experience_years ?? 0

  const onCharteredStage = Boolean(stageKey && CHARTERED_STAGE_KEYS.has(stageKey))
  const explicitChartered =
    EXPLICIT_CHARTERED_TITLE.test(title) ||
    EXPLICIT_CHARTERED_TITLE.test(note) ||
    (role.professional_registration_requirement === 'required' &&
      /ceng|chartered|ieng/i.test(note + title))

  const chartership_confirmed = profileHasCEng(profile)
  const warnings: string[] = []
  const demote_codes: string[] = []
  const gaps: ProfessionalStageGateResult['gaps'] = []
  let force_fit: EffectiveFit | null = null
  let scope_gate = 'engineering_stage_ok'

  if (explicitChartered && !chartership_confirmed) {
    force_fit = 'blocked_until_requirement'
    demote_codes.push('chartership_required')
    scope_gate = 'chartership_required'
    gaps.push({
      type: 'professional_status',
      severity: 'blocker',
      code: 'chartership_required',
      message_key: 'career.professional_status.chartership_required',
      message: 'Role explicitly requires chartered/incorporated engineering status',
      details: { stage_key: stageKey },
    })
    warnings.push('chartership_required')
  } else if (onCharteredStage && !explicitChartered) {
    // Stage says chartered but title looks like a general practice role
    warnings.push('role_stage_metadata_review_needed')
    warnings.push('stage_professional_status_not_confirmed')
    demote_codes.push('stage_professional_status_not_confirmed')
    scope_gate = 'chartered_stage_metadata_warning'

    if (years < 3 || years < Math.max(min, 2)) {
      // Graduate must not treat chartered stage as realistic_next solely on low min years
      if (ENTRYISH_TITLE.test(title) && years <= 1) {
        // Mis-staged graduate title on chartered stage → treat as immediate/realistic from experience, not chartered claim
        force_fit = years === 0 ? 'immediate' : 'realistic_next'
        gaps.push({
          type: 'professional_status',
          severity: 'warning',
          code: 'role_stage_metadata_review_needed',
          message_key: 'career.professional_status.role_stage_metadata_review_needed',
          message:
            'Role sits on Chartered/Professional stage but title appears entry/graduate — stage metadata may need review',
          details: { stage_key: stageKey, role: title },
        })
      } else {
        force_fit = years < 2 ? 'future_progression' : 'realistic_next'
        gaps.push({
          type: 'professional_status',
          severity: 'warning',
          code: 'stage_professional_status_not_confirmed',
          message_key: 'career.professional_status.stage_professional_status_not_confirmed',
          message:
            'Chartered/Professional Engineer stage does not confirm the user is chartered; competency/experience still required',
          details: { stage_key: stageKey },
        })
      }
    } else if (!chartership_confirmed && years < 5) {
      force_fit = 'realistic_next'
      gaps.push({
        type: 'professional_status',
        severity: 'info',
        code: 'stage_professional_status_not_confirmed',
        message_key: 'career.professional_status.stage_professional_status_not_confirmed',
        message: 'Professional stage present — chartership not confirmed for this profile',
        details: { stage_key: stageKey },
      })
    }
  } else if (
    stageKey === 'experienced_engineer' ||
    stageKey === 'engineering_management' ||
    stageKey === 'executive_leadership'
  ) {
    if (years < 3 && !ENTRYISH_TITLE.test(title)) {
      force_fit = 'future_progression'
      demote_codes.push('experience_below_professional_stage')
      scope_gate = 'professional_stage_experience_gap'
      gaps.push({
        type: 'experience',
        severity: 'warning',
        code: 'experience_below_professional_stage',
        message_key: 'career.experience.below_professional_stage',
        message: `Stage "${stage?.label ?? stageKey}" typically needs more professional experience than ${years} years`,
        details: { stage_key: stageKey, years },
      })
    }
  }

  // Zero-experience graduate: never claim chartered/professional accessibility as realistic_next from stage alone
  if (
    years === 0 &&
    onCharteredStage &&
    !ENTRYISH_TITLE.test(title) &&
    force_fit !== 'blocked_until_requirement'
  ) {
    if (force_fit === 'realistic_next' || force_fit === null) {
      force_fit = 'future_progression'
      demote_codes.push('graduate_chartered_stage_demoted')
    }
  }

  return {
    applies: true,
    stage_key: stageKey,
    chartership_required: explicitChartered,
    chartership_confirmed,
    stage_implies_professional_status: onCharteredStage,
    warnings,
    demote_codes,
    force_fit,
    gaps,
    scope_gate,
  }
}
