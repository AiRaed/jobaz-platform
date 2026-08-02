/**
 * Dual Path Mode — survival/flexible WORK NOW + degree-aligned BUILD NEXT / LONG-TERM.
 * For users who need income now while progressing toward their professional direction.
 */

import { getFieldIncomeStrategy } from './careerTrackLock'
import {
  buildBridgeRoleRecommendations,
  type BridgeField,
  buildBridgeRoleReasoning,
  getBridgeProfessionalTracks,
  inferBridgeField,
} from './bridgeRoleIntelligence'
import { getStudentStudyField, getStudentWorkIntent } from './studentPath'
import { getFieldAlignment } from './fieldAlignment'
import { hasItTechnologyExperience } from './itExperiencePath'
import { isCertOpen, isFastIncomeMode, getWorkSpeed } from './speedDevelopmentMode'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'
import { rec } from './resultBuilder'

export type DualPathResult = {
  recommendations: CareerBrainRecommendation[]
  reason: string
  dualPathReasoning: string[]
  field: BridgeField
}

const HIGH_BARRIER_FIELDS: BridgeField[] = [
  'medicine',
  'nursing',
  'law',
  'psychology',
  'engineering',
  'finance',
]

const HIGH_BARRIER_ACK: Partial<Record<BridgeField, string>> = {
  law:
    'Direct entry into legal roles may take time while you study or build UK experience. Flexible customer-facing work is a normal, practical way to earn income and strengthen UK communication while you progress toward paralegal and legal support roles.',
  medicine:
    'Clinical roles require qualifications and registration. Flexible work in care or customer-facing settings is a respected UK path to build experience and income while you progress toward healthcare and clinical opportunities.',
  nursing:
    'Registered nursing requires UK registration. Care support and healthcare assistant roles are realistic bridges that build patient-facing hours while you study.',
  psychology:
    'Chartered psychology routes take time. Support work and education roles build relevant UK experience while you complete your studies.',
  engineering:
    'Graduate engineer roles often need UK projects or placements. Technician and site assistant routes build industry exposure while you study.',
  finance:
    'Finance roles may need UK qualifications or references. Admin finance and bookkeeping assistant routes are realistic bridges while you build UK work history.',
  animation:
    'Creative roles often need a portfolio. Flexible retail or hospitality work funds your studies while content and production assistant roles build your showreel.',
}

export function isHighBarrierField(field: BridgeField): boolean {
  return HIGH_BARRIER_FIELDS.includes(field)
}

function hasProfessionalDirection(profile: CareerProfile): boolean {
  if (profile.studyField?.trim()) return true
  const target = (profile.targetField ?? '').toLowerCase().trim()
  if (!target) return false
  if (target === 'quick_income' || target === 'any' || target === 'exploring') return false
  return true
}

export function getHighBarrierAcknowledgement(field: BridgeField): string | null {
  return HIGH_BARRIER_ACK[field] ?? null
}

/** Dual Path Mode — flexible income now + study-aligned BUILD NEXT / LONG-TERM when user has a direction. */
export function wantsDualPathMode(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (state && getFieldIncomeStrategy(state) === 'field_with_backup') return true
  if (state && getFieldIncomeStrategy(state) === 'field_only') return false
  if (state && getFieldIncomeStrategy(state) === 'any_work_ok') return false

  if (!hasProfessionalDirection(profile)) return false

  if (profile.constraints.includes('hybrid-path-mode') || profile.constraints.includes('dual-path-mode')) {
    return true
  }

  if (profile.constraints.includes('flexible-employment-mode')) return false

  if (state) {
    const strategy = getFieldIncomeStrategy(state)
    if (strategy === 'any_work_ok') return false
    if (strategy === 'field_only') return false
    if (strategy === 'field_with_backup') return true

    const alignment = getFieldAlignment(state)
    if (alignment === 'no') return false
    if (alignment === 'both') return true
    if (String(state.answers?.cb_entry_work_preference) === 'quick_income') return true
    if (String(state.answers?.cb_graduate_urgency) === 'urgent') return true
  }

  if (
    profile.urgencyLevel === 'high' &&
    profile.constraints.includes('student') &&
    !profile.constraints.includes('flexible-employment-mode')
  ) {
    return true
  }

  return false
}

function survivalStyle(state?: CareerBrainState, profile?: CareerProfile): string {
  const style =
    String(state?.answers?.cb_student_work_style ?? '') ||
    String(state?.answers?.cb_entry_work_preference ?? '') ||
    String(profile?.targetField ?? '') ||
    ''
  return style.toLowerCase()
}

function hasRetailExperience(profile: CareerProfile): boolean {
  return /retail|shop|store|sales assistant/i.test(profile.workExperienceField ?? '')
}

function hasHospitalityExperience(profile: CareerProfile): boolean {
  return /hospitality|barista|waiter|waitress|kitchen|hotel|café|cafe|restaurant/i.test(
    profile.workExperienceField ?? ''
  )
}

/** WORK NOW — immediate flexible UK survival roles (priority: income, readiness, English). */
export function buildSurvivalWorkNow(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const english = profile.englishLevel ?? 'functional'
  const style = survivalStyle(state, profile)
  const roles: CareerBrainRecommendation[] = []
  const seen = new Set<string>()

  const push = (title: string, why: string, domain: CareerProfile['domain']) => {
    const key = title.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    roles.push(
      rec(
        title,
        `Work Now — ${why} Practical, flexible income — a normal part of your UK journey, not a step backwards.`,
        'work_now',
        domain
      )
    )
  }

  if (hasRetailExperience(profile)) {
    push(
      'Retail assistant (part-time)',
      'you already have retail experience — fastest path to part-time income.',
      'retail_customer_service'
    )
  }
  if (hasHospitalityExperience(profile)) {
    push(
      'Barista / hospitality staff (part-time)',
      'your hospitality background helps you start quickly.',
      'hospitality'
    )
  }
  if (hasItTechnologyExperience(profile, state)) {
    const style = survivalStyle(state, profile)
    if (
      /office|admin|quiet|creative|digital|any/.test(style) ||
      profile.constraints.includes('student-continue-exp')
    ) {
      push(
        'IT Support Assistant (part-time)',
        'your IT/technology experience suits helpdesk-style part-time roles.',
        'IT_digital'
      )
      push(
        'Technical Support Assistant (part-time)',
        'troubleshooting experience helps you start in support teams.',
        'IT_digital'
      )
      push(
        'Helpdesk Assistant (part-time)',
        'ticket-based support while you earn and study.',
        'IT_digital'
      )
      if (roles.length >= 3) return roles.slice(0, 3)
    }
  }

  if (english === 'basic') {
    if (roles.length < 3) {
      push(
        'Kitchen porter',
        'back-of-house work with lighter spoken English pressure while you build confidence.',
        'hospitality'
      )
    }
    if (roles.length < 3) {
      push(
        'Warehouse operative',
        'clear tasks and fast hiring — common first UK jobs for new arrivals.',
        'retail_customer_service'
      )
    }
    if (roles.length < 3) {
      push(
        'Cleaner (commercial)',
        'steady demand; practical work while you improve English at your own pace.',
        'retail_customer_service'
      )
    }
    return roles.slice(0, 3)
  }

  if (/^people$|people|hospitality|food|bar|hotel|café|cafe/.test(style)) {
    push(
      'Café assistant',
      'friendly, flexible shifts — strong fit when you like working with people.',
      'hospitality'
    )
    push(
      'Barista',
      'flexible shifts; builds confidence speaking with customers in the UK.',
      'hospitality'
    )
    push(
      'Waiter / waitress (part-time)',
      'tips and evening shifts often suit student schedules.',
      'hospitality'
    )
    push(
      'Hotel front desk (part-time)',
      'professional environment; good for confident communicators.',
      'hospitality'
    )
    return roles.slice(0, 3)
  }

  if (/physical|warehouse|driving|delivery|quick_income/.test(style)) {
    push(
      'Retail assistant (part-time)',
      'fast hiring alongside warehouse options — practical income while you study.',
      'retail_customer_service'
    )
    push('Warehouse operative', 'high-volume hiring; team-based shifts.', 'retail_customer_service')
    push('Picker/packer', 'distribution centres often hire quickly.', 'retail_customer_service')
    if (profile.licences.length > 0) {
      push('Delivery driver (part-time)', 'uses your licence for flexible income.', 'driving_logistics')
    } else {
      push('Kitchen porter', 'physical entry role with quick starts.', 'hospitality')
    }
    return roles.slice(0, 3)
  }

  if (/office|admin|quiet/.test(style)) {
    push(
      'Receptionist (part-time)',
      'office exposure; suits organised communicators.',
      'admin_business'
    )
    push(
      'Office admin assistant (part-time)',
      'email and admin tasks — builds UK office experience.',
      'admin_business'
    )
    push(
      'Data entry clerk (part-time)',
      'structured tasks; good if you prefer less customer pressure.',
      'admin_business'
    )
    return roles.slice(0, 3)
  }

  if (/creative|digital|media/.test(style) && english !== 'basic') {
    if (profile.constraints.includes('deprioritise-study-alignment')) {
      push(
        'Café assistant',
        'flexible people-facing work — matches your comfort preference.',
        'hospitality'
      )
      push(
        'Retail assistant (part-time)',
        'fast hiring; evenings and weekends often available.',
        'retail_customer_service'
      )
      push(
        'Customer service advisor (part-time)',
        'uses communication strengths without requiring a degree-linked role.',
        'retail_customer_service'
      )
      return roles.slice(0, 3)
    }
    push(
      'Retail assistant (part-time)',
      'reliable student income while you build creative work on the side.',
      'retail_customer_service'
    )
    push(
      'Social media content assistant (part-time)',
      'flexible digital work that can grow your portfolio.',
      'creative_media'
    )
    push(
      'Café assistant',
      'friendly environment; flexible hours around study.',
      'hospitality'
    )
    return roles.slice(0, 3)
  }

  if (roles.length < 1) {
    push(
      'Retail assistant (part-time)',
      'widely available; flexible hours for students and newcomers.',
      'retail_customer_service'
    )
  }
  if (roles.length < 2) {
    push(
      'Café / bar staff (part-time)',
      'fast hiring in UK towns and cities; builds customer confidence.',
      'hospitality'
    )
  }
  if (roles.length < 3) {
    push(
      'Customer service advisor (part-time)',
      'phone/email roles build UK communication for your long-term career.',
      'retail_customer_service'
    )
  }

  return roles.slice(0, 3)
}

export function buildDualPathReasoning(
  profile: CareerProfile,
  field: BridgeField,
  state?: CareerBrainState
): string[] {
  const lines: string[] = [
    'Rule 3 — True dual path ("open to both"): immediate income NOW + study-connected BUILD NEXT and LONG-TERM PATH.',
    'This is NOT "any job is fine" — you balance short-term income with long-term career growth.',
    'WORK NOW = flexible survival jobs matched to your work-style preference.',
    'BUILD NEXT = career-aligned courses and upgrades when open to training; otherwise realistic bridge steps.',
    'LONG-TERM PATH = professional destinations connected to your studies — not repeated training titles.',
  ]
  if (profile.studyField) lines.push(`Studies / direction: ${profile.studyField}`)
  if (state) {
    const intent = getStudentWorkIntent(state)
    if (intent) lines.push(`Work intent: ${intent.replace(/_/g, ' ')}`)
  }
  const ack = getHighBarrierAcknowledgement(field)
  if (ack) lines.push(ack)
  lines.push(
    'Path A — Career-aligned: field Work Now where possible, matched Build Next training, and Long-Term progression in your professional domain.',
    'Path B — Faster employment: flexible retail, hospitality, or logistics roles for immediate income while you build UK experience.',
    'Survival roles are presented as practical, confidence-building UK experience — not as a lesser choice.'
  )
  lines.push(...buildBridgeRoleReasoning(profile, field, state).slice(1))
  return lines
}

export function buildDualPathRecommendations(
  profile: CareerProfile,
  state?: CareerBrainState
): DualPathResult | null {
  if (!wantsDualPathMode(profile, state)) return null

  const study = profile.studyField ?? (state ? getStudentStudyField(state) : '') ?? ''
  const field = inferBridgeField(study, profile.targetField)

  const survival = buildSurvivalWorkNow(profile, state)
  const { buildNext, longTerm } = getBridgeProfessionalTracks(field, profile)
  const trainingOpen = isCertOpen(profile, state) && !isFastIncomeMode(profile, state)

  const strategy = state ? getFieldIncomeStrategy(state) : null
  if (strategy === 'field_with_backup') {
    const bridge = buildBridgeRoleRecommendations(profile, state)
    const fieldWorkNow =
      bridge?.recommendations.filter((r) => r.track === 'work_now').slice(0, 3) ?? []
    const itWorkNow =
      profile.constraints.includes('student') && hasItTechnologyExperience(profile, state)
        ? survival.filter((r) => /it support|technical support|helpdesk/i.test(r.title)).slice(0, 3)
        : []
    const primaryWorkNow =
      itWorkNow.length > 0 ? itWorkNow : fieldWorkNow.length ? fieldWorkNow : survival.slice(0, 2)
    const backupIncome = survival
      .filter((r) => !primaryWorkNow.some((p) => p.title === r.title))
      .map((r) => ({
      ...r,
      track: 'backup_income' as const,
      why: `Backup income option — ${r.why.replace(/^Work Now — /i, '')}`,
    }))
    const recommendations = [
      ...primaryWorkNow,
      ...backupIncome.slice(0, 2),
      ...(trainingOpen ? [] : buildNext),
      ...longTerm,
    ]
    return {
      recommendations,
      reason: `Field-first hybrid: ${field.replace(/_/g, ' ')} entry roles + separate backup income options`,
      dualPathReasoning: buildDualPathReasoning(profile, field, state),
      field,
    }
  }

  const workNow = survival
  const recommendations = [
    ...workNow,
    ...(trainingOpen ? [] : buildNext),
    ...longTerm,
  ]

  return {
    recommendations,
    reason: `Hybrid Path: flexible UK income now + ${field.replace(/_/g, ' ')} progression`,
    dualPathReasoning: buildDualPathReasoning(profile, field, state),
    field,
  }
}

export function applyDualPathModeToProfile(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerProfile {
  if (!wantsDualPathMode(profile, state)) return profile
  const field = inferBridgeField(profile.studyField, profile.targetField)
  return {
    ...profile,
    constraints: [
      ...new Set([
        ...profile.constraints,
        'hybrid-path-mode',
        'dual-path-mode',
        `bridge-field-${field}`,
      ]),
    ],
  }
}
