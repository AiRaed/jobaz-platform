/**
 * Work-style preferences — persist across WORK NOW, BUILD NEXT, and LONG-TERM PATH.
 */

import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'
import { rec } from './resultBuilder'

export type WorkStyleKind =
  | 'physical'
  | 'people'
  | 'office'
  | 'technical'
  | 'remote'
  | 'creative'
  | 'flexible_income'
  | 'any'

const OFFICE_PATTERN =
  /admin|reception|data entry|office|clerical|business support officer|operations coordinator|sales executive|marketing assistant|hr admin|paralegal|legal admin|bookkeep|finance admin|digital marketing|excel/i

const PHYSICAL_PATTERN =
  /warehouse|logistics|forklift|picker|packer|kitchen porter|cleaner|delivery|driver|courier|construction|site labour|cscs|sia|security officer|facilities|operations supervisor|shift coordinator|transport|loader/i

const PEOPLE_PATTERN =
  /retail|hospitality|barista|waiter|customer service|care support|host|front of house|team leader|venue manager|events/i

const TECHNICAL_PATTERN =
  /it support|developer|data analyst|qa|digital support|software|helpdesk|comp tia|technical/i

const CREATIVE_PATTERN =
  /animator|motion|video|creative|content|design|production assistant|social media/i

export function resolveWorkStyle(
  profile: CareerProfile,
  state?: CareerBrainState
): WorkStyleKind {
  const answers = state?.answers ?? {}
  const raw = [
    answers.cb_student_work_style,
    answers.cb_discovery_work_setting,
    answers.cb_entry_work_preference,
    profile.targetField,
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase())
    .join(' ')

  if (profile.constraints.includes('non-physical')) return 'office'
  if (profile.constraints.includes('physical-work')) return 'physical'
  if (profile.constraints.includes('customer-facing-pref')) return 'people'
  if (/physical|warehouse|quick_income|physical_practical|lifting|practical/.test(raw)) return 'physical'
  if (/people|hospitality|customer|retail|barista|café|cafe/.test(raw)) return 'people'
  if (/office|admin|computer|clerical|office_computer|quiet/.test(raw)) return 'office'
  if (/technical|it\b|comput|software|tech/.test(raw)) return 'technical'
  if (/remote|work from home|wfh/.test(raw)) return 'remote'
  if (/creative|digital|media|animation|design/.test(raw)) return 'creative'
  if (/any|flexible|quick_income/.test(raw)) return 'flexible_income'
  return 'any'
}

export function workStyleLabel(style: WorkStyleKind): string {
  const labels: Record<WorkStyleKind, string> = {
    physical: 'Physical / active work',
    people: 'Working with people',
    office: 'Office / admin work',
    technical: 'Technical work',
    remote: 'Remote work',
    creative: 'Creative work',
    flexible_income: 'Flexible quick income',
    any: 'General fit',
  }
  return labels[style]
}

function matchesStyle(title: string, style: WorkStyleKind): boolean {
  const t = title.toLowerCase()
  switch (style) {
    case 'physical':
      return PHYSICAL_PATTERN.test(t) || PEOPLE_PATTERN.test(t)
    case 'people':
      return PEOPLE_PATTERN.test(t) || !OFFICE_PATTERN.test(t)
    case 'office':
      return OFFICE_PATTERN.test(t) || /customer service advisor/i.test(t)
    case 'technical':
      return TECHNICAL_PATTERN.test(t)
    case 'remote':
      return /remote|digital support|customer service|admin|data entry/i.test(t)
    case 'creative':
      return CREATIVE_PATTERN.test(t)
    case 'flexible_income':
      return PEOPLE_PATTERN.test(t) || PHYSICAL_PATTERN.test(t)
    default:
      return true
  }
}

function conflictsWithStyle(title: string, style: WorkStyleKind): boolean {
  if (style === 'any' || style === 'flexible_income') return false
  const t = title.toLowerCase()
  if (style === 'physical') {
    return OFFICE_PATTERN.test(t) && !PHYSICAL_PATTERN.test(t) && !PEOPLE_PATTERN.test(t)
  }
  if (style === 'people') {
    return /data entry clerk|warehouse operative|kitchen porter|forklift operator/i.test(t)
  }
  if (style === 'office') {
    return (
      /warehouse operative|kitchen porter|picker|packer|forklift operator|site labourer|construction labour|delivery driver|courier driver/i.test(
        t
      )
    )
  }
  if (style === 'technical') {
    return /warehouse operative|kitchen porter|barista|waiter/i.test(t) && !TECHNICAL_PATTERN.test(t)
  }
  if (style === 'creative') {
    return /warehouse operative|forklift|security officer/i.test(t) && !CREATIVE_PATTERN.test(t)
  }
  return false
}

export function filterRecommendationsByWorkStyle(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState,
  opts?: { studyAlignedLongTerm?: boolean }
): CareerBrainRecommendation[] {
  const style = resolveWorkStyle(profile, state)
  if (style === 'any') return recs

  const studyAligned = opts?.studyAlignedLongTerm ?? false

  return recs.filter((r) => {
    if (conflictsWithStyle(r.title, style)) {
      if (studyAligned && r.track === 'long_term') return true
      return false
    }
    if (r.track === 'long_term' && !studyAligned) {
      return matchesStyle(r.title, style) || !conflictsWithStyle(r.title, style)
    }
    return true
  })
}

export function getStyleAlignedFastUpgradeNames(style: WorkStyleKind): string[] {
  switch (style) {
    case 'physical':
      return ['Forklift licence (FLT)', 'CSCS construction card', 'SIA security licence', 'First Aid Certificate']
    case 'people':
      return [
        'Hospitality supervisor course',
        'Food Safety Certificate (Level 2)',
        'First Aid Certificate',
        'Customer Service Certificate',
      ]
    case 'office':
      return ['Excel for Business', 'Business Administration Certificate', 'Digital support / admin basics']
    case 'technical':
      return ['IT Support Fundamentals', 'CompTIA A+ preparation', 'Digital Skills Training']
    case 'remote':
      return ['Digital support / admin basics', 'Digital Skills Training', 'Customer Service Certificate']
    case 'creative':
      return ['Video editing short course', 'Motion graphics fundamentals', 'Social Media Marketing Certificate']
    default:
      return []
  }
}

export function buildStyleAlignedLongTermRoles(
  style: WorkStyleKind
): CareerBrainRecommendation[] {
  switch (style) {
    case 'physical':
      return [
        rec('Forklift operator', 'Long-Term Path — higher-pay warehouse role after FLT training', 'long_term', 'driving_logistics'),
        rec('Logistics coordinator', 'Long-Term Path — coordination from warehouse and transport experience', 'long_term', 'driving_logistics'),
        rec('Operations supervisor', 'Long-Term Path — site and warehouse leadership', 'long_term', 'retail_customer_service'),
        rec('Security officer', 'Long-Term Path — stable role after SIA licence', 'long_term', 'retail_customer_service'),
      ]
    case 'people':
      return [
        rec('Hospitality / venue manager', 'Long-Term Path — management from customer-facing UK experience', 'long_term', 'hospitality'),
        rec('Customer experience team leader', 'Long-Term Path — people-focused leadership progression', 'long_term', 'retail_customer_service'),
        rec('Events coordinator', 'Long-Term Path — hospitality and events career route', 'long_term', 'hospitality'),
      ]
    case 'office':
      return [
        rec('Office Administrator', 'Long-Term Path — professional admin career progression', 'long_term', 'admin_business'),
        rec('Operations Coordinator', 'Long-Term Path — coordinates teams and business processes', 'long_term', 'admin_business'),
        rec('Business Support Officer', 'Long-Term Path — office operations and client support', 'long_term', 'admin_business'),
      ]
    case 'technical':
      return [
        rec('IT Support Specialist', 'Long-Term Path — helpdesk and systems support career', 'long_term', 'IT_digital'),
        rec('Digital Support Assistant', 'Long-Term Path — remote and office tech support roles', 'long_term', 'IT_digital'),
        rec('Junior Developer', 'Long-Term Path — software development with portfolio growth', 'long_term', 'IT_digital'),
      ]
    case 'remote':
      return [
        rec('Digital Support Assistant', 'Long-Term Path — remote-friendly support and admin roles', 'long_term', 'IT_digital'),
        rec('Customer Service Advisor (remote)', 'Long-Term Path — phone/email roles with flexible location', 'long_term', 'retail_customer_service'),
      ]
    case 'creative':
      return [
        rec('Motion Designer', 'Long-Term Path — creative career with portfolio growth', 'long_term', 'animation_design'),
        rec('Content Producer', 'Long-Term Path — digital media and creative production', 'long_term', 'creative_media'),
      ]
    default:
      return []
  }
}

export function buildWorkStyleReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const style = resolveWorkStyle(profile, state)
  if (style === 'any') return []
  const intent = String(state?.answers?.cb_student_work_intent ?? '')
  const openBoth = intent.includes('open_both')
  return [
    `Work-style preference (${workStyleLabel(style)}) shapes Work Now and fast upgrades in Build Next.`,
    openBoth
      ? 'Career direction from your studies shapes Long-Term Path destinations — work style and career direction are kept separate.'
      : style === 'physical'
        ? 'Progression stays in logistics, warehousing, transport, operations, facilities, and security — not office pivots unless you choose them.'
        : `Recommendations stay aligned with your ${workStyleLabel(style).toLowerCase()} preference across stages.`,
  ]
}
