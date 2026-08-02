/**
 * Fast Flexible Employment Mode — user chose "No, any job is fine".
 * Income, flexibility, and fit matter NOW; studies stay in profile but do not drive recommendations.
 */

import { buildSurvivalWorkNow } from './dualPathMode'
import { isFieldAlignmentBoth, isFieldAlignmentNo, isFieldAlignmentYes } from './fieldAlignment'
import { getFirstJobCareerPreference } from './firstJobEducationPath'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'
import { rec } from './resultBuilder'

function getWorkIntent(state?: CareerBrainState): string {
  if (state && isFieldAlignmentNo(state)) return 'any_job'
  if (state && isFieldAlignmentBoth(state)) return 'open_both'
  if (state && isFieldAlignmentYes(state)) return 'related_studies'
  return String(state?.answers?.cb_student_work_intent ?? '')
}

export type FlexibleEmploymentResult = {
  recommendations: CareerBrainRecommendation[]
  reason: string
  reasoning: string[]
}

function workStyle(state?: CareerBrainState, profile?: CareerProfile): string {
  return (
    String(state?.answers?.cb_student_work_style ?? '') ||
    String(state?.answers?.cb_entry_work_preference ?? '') ||
    String(profile?.targetField ?? '') ||
    'any'
  ).toLowerCase()
}

function buildFlexibleProgression(
  profile: CareerProfile,
  state?: CareerBrainState
): { buildNext: CareerBrainRecommendation[]; longTerm: CareerBrainRecommendation[] } {
  const style = workStyle(state, profile)
  const domain = profile.domain

  if (/physical|warehouse|quick_income/.test(style)) {
    return {
      buildNext: [
        rec(
          'Warehouse team leader',
          'Build Next — reliability and FLT training open supervisor routes',
          'build_next',
          'retail_customer_service'
        ),
        rec(
          'Shift coordinator (logistics)',
          'Build Next — coordination after proven attendance',
          'build_next',
          'driving_logistics'
        ),
      ],
      longTerm: [
        rec(
          'Logistics coordinator',
          'Long-term — office/logistics progression from warehouse experience',
          'long_term',
          'driving_logistics'
        ),
        rec(
          'Operations supervisor',
          'Long-term — site operations leadership',
          'long_term',
          'retail_customer_service'
        ),
      ],
    }
  }

  if (/office|quiet|computer/.test(style)) {
    return {
      buildNext: [
        rec(
          'Senior admin assistant',
          'Build Next — office progression after proving reliability',
          'build_next',
          'admin_business'
        ),
        rec(
          'Operations support coordinator',
          'Build Next — behind-the-scenes coordination',
          'build_next',
          'admin_business'
        ),
      ],
      longTerm: [
        rec(
          'Business support manager',
          'Long-term — office operations leadership',
          'long_term',
          'admin_business'
        ),
        rec(
          'Customer relations coordinator',
          'Long-term — client-facing operations without degree gatekeeping',
          'long_term',
          'admin_business'
        ),
      ],
    }
  }

  if (/creative|digital|media/.test(style)) {
    return {
      buildNext: [
        rec(
          'Shift supervisor (retail/hospitality)',
          'Build Next — leadership in flexible sectors you already work in',
          'build_next',
          'hospitality'
        ),
        rec(
          'Customer experience team leader',
          'Build Next — people skills progression without portfolio requirements',
          'build_next',
          'retail_customer_service'
        ),
      ],
      longTerm: [
        rec(
          'Hospitality / venue manager',
          'Long-term — management route from flexible customer-facing work',
          'long_term',
          'hospitality'
        ),
        rec(
          'Operations & customer relations',
          'Long-term — business-facing path built from UK work experience',
          'long_term',
          'admin_business'
        ),
      ],
    }
  }

  // Default: people-facing / hospitality / retail progression
  return {
    buildNext: [
      rec(
        'Team supervisor (retail/hospitality)',
        'Build Next — natural step after reliable part-time shifts',
        'build_next',
        'retail_customer_service'
      ),
      rec(
        'Shift coordinator',
        'Build Next — rota and floor coordination',
        'build_next',
        'hospitality'
      ),
      rec(
        'Hospitality team leader',
        'Build Next — leads small teams in cafés, hotels, or events',
        'build_next',
        'hospitality'
      ),
    ],
    longTerm: [
      rec(
        'Hospitality / venue manager',
        'Long-term — management from flexible UK customer-facing experience',
        'long_term',
        'hospitality'
      ),
      rec(
        'Operations support / customer relations',
        'Long-term — business operations path without requiring your degree field',
        'long_term',
        domain === 'admin_business' ? 'admin_business' : 'retail_customer_service'
      ),
    ],
  }
}

function hasProfessionalDirection(profile: CareerProfile): boolean {
  if (profile.studyField?.trim()) return true
  const target = (profile.targetField ?? '').toLowerCase().trim()
  if (!target) return false
  if (target === 'quick_income' || target === 'any' || target === 'exploring') return false
  return true
}

export function wantsFlexibleEmploymentMode(
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  if (profile.constraints.includes('dual-path-mode') || profile.constraints.includes('education-income-balance')) {
    return false
  }

  if (profile.constraints.includes('flexible-employment-mode')) return true
  if (profile.constraints.includes('deprioritise-study-alignment')) return true

  if (state) {
    const intent = getWorkIntent(state)
    if (intent.includes('any_job')) return true
    if (isFieldAlignmentNo(state) || getFirstJobCareerPreference(state) === 'no_longer') return true
    if (String(state?.answers?.cb_global_education_intent) === 'no') return true
    if (String(state.answers?.cb_entry_work_preference) === 'quick_income') return true
    if (String(state.answers?.cb_graduate_urgency) === 'urgent') return true
  }
  if (profile.constraints.includes('any-job-ok') && profile.wantsSameField === false) return true
  if (hasProfessionalDirection(profile)) return false
  return false
}

export function buildFlexibleEmploymentReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const lines = [
    'Fast Flexible Employment Mode: you prioritised income and flexibility over study-aligned roles right now.',
    'What you need today matters more than your academic identity — this is realistic and respected.',
    'Your studies remain in your profile for later, but recommendations focus on immediate UK employability.',
    'Priority: income → schedule fit → English/readiness → personality & comfort → progression inside flexible sectors.',
  ]
  if (profile.studyField) {
    lines.push(`Studies noted (${profile.studyField}) — not used to push degree-specific jobs for this answer.`)
  }
  if (state) {
    const intent = getWorkIntent(state)
    if (intent) lines.push(`Work intent: ${intent.replace(/_/g, ' ')}`)
  }
  return lines
}

export function buildFlexibleEmploymentRecommendations(
  profile: CareerProfile,
  state?: CareerBrainState
): FlexibleEmploymentResult | null {
  if (!wantsFlexibleEmploymentMode(profile, state)) return null

  const workNow = buildSurvivalWorkNow(profile, state)
  const { buildNext, longTerm } = buildFlexibleProgression(profile, state)

  return {
    recommendations: [...workNow, ...buildNext, ...longTerm],
    reason: 'Fast Flexible Employment Mode: immediate UK jobs + progression without study alignment',
    reasoning: buildFlexibleEmploymentReasoning(profile, state),
  }
}

export function applyFlexibleEmploymentModeToProfile(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerProfile {
  if (!wantsFlexibleEmploymentMode(profile, state)) return profile
  return {
    ...profile,
    wantsSameField: false,
    constraints: [
      ...new Set([
        ...profile.constraints,
        'flexible-employment-mode',
        'any-job-ok',
        'deprioritise-study-alignment',
      ]),
    ],
  }
}
