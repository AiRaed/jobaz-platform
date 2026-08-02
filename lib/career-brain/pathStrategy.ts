/**
 * Path strategy — how Career Brain frames WORK NOW / BUILD NEXT / LONG-TERM by user intent.
 */

import { inferBridgeField, type BridgeField } from './bridgeRoleIntelligence'
import { wantsDualPathMode } from './dualPathMode'
import { wantsFlexibleEmploymentMode } from './flexibleEmploymentMode'
import { wantsBridgeRoleDiscovery } from './bridgeRoleIntelligence'
import type { CareerBrainState, CareerProfile } from './types'

export type PathStrategyMode =
  | 'bridge'
  | 'hybrid_dual_path'
  | 'flexible_employment'
  | 'standard'

export function detectPathStrategyMode(
  profile: CareerProfile,
  state?: CareerBrainState
): PathStrategyMode {
  if (profile.constraints.includes('flexible-employment-mode')) return 'flexible_employment'
  if (wantsDualPathMode(profile, state)) return 'hybrid_dual_path'
  if (wantsFlexibleEmploymentMode(profile, state)) return 'flexible_employment'
  if (wantsBridgeRoleDiscovery(profile, state)) return 'bridge'
  return 'standard'
}

export function buildPathStrategyReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const mode = detectPathStrategyMode(profile, state)
  const study = profile.studyField?.trim()
  const field = study ? inferBridgeField(study, profile.targetField) : null

  const lines: string[] = [
    'Priority order: survival/income → work readiness → English → personality & schedule → degree alignment → long-term growth.',
  ]

  if (mode === 'hybrid_dual_path') {
    lines.push(
      'Dual Path Mode: you need flexible income now while keeping a long-term direction — survival work and professional growth are separate, both valid.',
      'WORK NOW = fast-hiring flexible UK jobs (retail, café, hospitality, warehouse) — not your degree.',
      study
        ? `BUILD NEXT = career-aligned courses + fast upgrades when open to training; LONG-TERM PATH = ${study} professional direction (not tomorrow's job).`
        : 'BUILD NEXT and LONG-TERM PATH reflect realistic progression from flexible work.',
      'Survival work is practical, confidence-building, and income-generating — a normal part of the journey.'
    )
    if (field) appendHighBarrierAck(lines, field)
    return lines
  }

  if (mode === 'flexible_employment') {
    lines.push(
      'Fast Flexible Employment: you prioritised income, flexibility, and immediate employability over study-aligned roles right now.',
      'WORK NOW = hospitality, retail, warehouse, delivery, and similar — based on personality, English, hours, and comfort.',
      study
        ? `Your studies (${study}) are saved for later — they do not drive these recommendations because you chose "any job is fine".`
        : 'Recommendations focus on what you can start quickly in the UK.',
      'What you need today matters more than your academic identity — that is realistic and respected.'
    )
    if (profile.constraints.includes('skill-unlock-mode') || profile.constraints.includes('open-to-certifications')) {
      lines.push(
        'Rule 7 — Employability growth: open to training — BUILD NEXT adds licences and courses (SIA, care cert, FLT, CSCS) without pushing degree-specific roles.',
        'LONG-TERM PATH shows flexible-sector progression — not paralegal or study-aligned jobs.'
      )
    } else {
      lines.push(
        'BUILD NEXT / LONG-TERM = progression inside flexible sectors (supervisor, team leader, operations) — not degree-matched jobs.'
      )
    }
    return lines
  }

  if (mode === 'bridge') {
    lines.push(
      'Study-aligned path: WORK NOW = career-connected entry roles; BUILD NEXT = courses/certificates when open to training; LONG-TERM PATH = your professional direction.',
      study ? `Field detected: ${study}.` : 'Bridge roles move you toward your professional direction step by step.'
    )
    if (field) appendHighBarrierAck(lines, field)
    return lines
  }

  lines.push('Standard UK employability path based on your experience, domain, and urgency.')
  return lines
}

function appendHighBarrierAck(lines: string[], field: BridgeField): void {
  const acks: Partial<Record<BridgeField, string>> = {
    law: 'Direct entry into legal roles may take time — flexible customer-facing work builds UK communication while you progress toward paralegal opportunities.',
    medicine:
      'Clinical roles need qualifications — care and support roles build patient-facing hours while you study.',
    psychology:
      'Chartered routes take time — support and education roles build relevant UK experience.',
    nursing: 'Registration takes time — healthcare assistant roles are the standard UK bridge.',
  }
  const ack = acks[field]
  if (ack) lines.push(ack)
}

export function buildPathStrategySummary(profile: CareerProfile, state?: CareerBrainState): string {
  const mode = detectPathStrategyMode(profile, state)
  const study = profile.studyField?.trim()

  if (mode === 'hybrid_dual_path') {
    return study
      ? `You need flexible income now while keeping ${study} as your long-term direction — here is a realistic dual path for the UK.`
      : 'You need flexible income now with room to grow — here are practical UK paths for work today and progression tomorrow.'
  }
  if (mode === 'flexible_employment') {
    return 'You prioritised quick, flexible work — these roles focus on income and fit right now, not your degree field.'
  }
  if (mode === 'bridge') {
    return study
      ? `You want work connected to ${study} — here are realistic UK bridge roles that move you closer to that career.`
      : 'Here are career-connected entry roles matched to your direction.'
  }
  return `Based on your situation, here are practical UK job paths.`
}

export function readinessForTrack(
  track: 'work_now' | 'build_next' | 'long_term',
  profile: CareerProfile,
  mode: PathStrategyMode
): string {
  if (track === 'work_now') {
    if (profile.englishLevel === 'basic') return 'Readiness: high for practical/back-of-house roles; build English for front-of-house.'
    if (mode === 'flexible_employment' || mode === 'hybrid_dual_path') {
      return 'Readiness: high — these roles hire quickly with minimal UK experience.'
    }
    return 'Readiness: entry-level — start applications while building CV and references.'
  }
  if (track === 'build_next') {
    if (mode === 'flexible_employment') {
      return 'Readiness: medium — after 3–6 months reliable work in flexible sectors.'
    }
    if (profile.yearsOfExperience === 0) {
      return 'Readiness: medium — after UK work history and study progress.'
    }
    return 'Readiness: medium — bridge step after initial UK experience.'
  }
  return 'Readiness: long-term — requires qualifications, experience, or registration over time.'
}
