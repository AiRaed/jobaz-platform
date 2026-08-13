/**
 * Compact builders for Work in My Profession seed rows.
 */

import type {
  ProfessionField,
  ProfessionRole,
  ProfessionSpecialism,
  ProfessionalLevelKey,
  ProfessionSeniority,
} from '../types'
import { WIP_STATUS } from '../types'

export function field(
  slug: string,
  name: string,
  description: string,
  sort_order: number
): ProfessionField {
  return {
    id: `wip-field-${slug}`,
    slug,
    name,
    description,
    sort_order,
    status: WIP_STATUS,
  }
}

export function specialism(
  fieldSlug: string,
  slug: string,
  name: string,
  description: string,
  sort_order: number
): ProfessionSpecialism {
  return {
    id: `wip-spec-${fieldSlug}--${slug}`,
    field_id: `wip-field-${fieldSlug}`,
    slug,
    name,
    description,
    sort_order,
    status: WIP_STATUS,
  }
}

type RoleInput = {
  title: string
  level: ProfessionalLevelKey
  seniority?: ProfessionSeniority
  min_experience_label?: string
  typical_entry_requirement?: string
  licence_or_check_required?: string | null
  uk_role_keywords?: string[]
  realistic_start_now?: boolean
  progression_roles?: string[]
  description?: string
  cv_focus_points?: string[]
}

const DEFAULT_EXP: Record<ProfessionalLevelKey, string> = {
  helper_assistant: '0–6 months relevant experience',
  beginner: '6–18 months relevant experience',
  experienced_worker: '2+ years relevant experience',
  supervisor: '3+ years plus leadership exposure',
  specialist_technician: 'Trade competence / certification preferred',
  self_employed_owner: 'Proven trade skill plus client handling',
}

const DEFAULT_SENIORITY: Record<ProfessionalLevelKey, ProfessionSeniority> = {
  helper_assistant: 'entry',
  beginner: 'junior',
  experienced_worker: 'mid',
  supervisor: 'lead',
  specialist_technician: 'senior',
  self_employed_owner: 'owner',
}

const GENERIC_CV_FOCUS = [
  'Highlight relevant UK workplace experience',
  'List tools, licences, and shift reliability',
  'Show progression and team contribution',
] as const

function experienceRoutePhrase(fieldSlug: string, specialismSlug: string): string {
  const spec = specialismSlug.replace(/-/g, ' ')
  switch (fieldSlug) {
    case 'office-admin':
      return /reception/i.test(specialismSlug) ? 'admin/reception' : 'admin'
    case 'security-facilities':
      return 'security'
    case 'warehouse-logistics':
      return 'warehouse/logistics'
    case 'care-support':
      return 'care/support'
    case 'hospitality':
      return 'hospitality'
    case 'customer-service':
      return 'customer service'
    case 'retail-sales':
      return 'retail/sales'
    case 'driving-transport':
      if (/bus|pcv/.test(specialismSlug)) return 'Bus / PCV passenger transport'
      if (/hgv|lgv/.test(specialismSlug)) return 'HGV / LGV goods vehicle'
      if (/taxi|phv/.test(specialismSlug)) return 'Taxi / PHV'
      if (/van|delivery|courier/.test(specialismSlug)) return 'delivery / van driving'
      return 'driving/transport'
    case 'construction-trades':
      return 'construction/trade'
    case 'electrical-technical':
      return 'electrical/technical'
    case 'plumbing-heating':
      return 'plumbing/heating'
    case 'cleaning-facilities':
      return 'cleaning/facilities'
    case 'manufacturing-engineering':
      return 'manufacturing'
    case 'digital-it-support':
      return 'IT/digital'
    case 'creative-design':
      return 'creative/design'
    case 'beauty-personal':
      return 'beauty/personal services'
    case 'childcare-education-support':
      return 'childcare/education support'
    case 'self-employment-local':
      return 'self-employed/local service'
    default:
      return spec || 'profession'
  }
}

export function defaultCvFocusPoints(fieldSlug: string, _specialismSlug = ''): string[] {
  switch (fieldSlug) {
    case 'office-admin':
      return [
        'Highlight Microsoft Office, email, filing, scheduling, and data entry experience',
        'Show accuracy, organisation, confidentiality, and document handling',
        'Mention customer service, phone handling, and office communication where relevant',
      ]
    case 'security-facilities':
      return [
        'Highlight SIA/security checks if relevant',
        'Mention venue, retail, event, CCTV, or patrol experience',
        'Show reliability, incident awareness, and shift readiness',
      ]
    case 'warehouse-logistics':
      return [
        'Highlight picking, packing, stock, goods-in/out, FLT, and warehouse systems',
        'Show safety awareness, speed, accuracy, and reliability',
      ]
    case 'care-support':
      return [
        'Highlight care/support experience, safeguarding awareness, personal care, moving & handling, and communication',
        'Mention DBS/checks where relevant',
      ]
    case 'hospitality':
      return [
        'Highlight kitchen, food safety, front of house, customer service, cleaning, or bar experience',
        'Mention shift work, hygiene, and teamwork',
      ]
    default:
      return [...GENERIC_CV_FOCUS]
  }
}

function isProgressionLevel(level: ProfessionalLevelKey, startNow: boolean): boolean {
  if (!startNow) return true
  return (
    level === 'supervisor' ||
    level === 'specialist_technician' ||
    level === 'self_employed_owner'
  )
}

export function defaultRoleDescription(
  fieldSlug: string,
  specialismSlug: string,
  level: ProfessionalLevelKey,
  startNow: boolean
): string {
  const route = experienceRoutePhrase(fieldSlug, specialismSlug)
  if (isProgressionLevel(level, startNow)) {
    return `This is a progression role after more UK experience or stronger ${route} skills.`
  }
  return `This role matches your ${route} experience and can be a realistic UK target role.`
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

export function rolesFor(
  fieldSlug: string,
  specialismSlug: string,
  inputs: RoleInput[]
): ProfessionRole[] {
  return inputs.map((r, index) => {
    const level = r.level
    const title = r.title.trim()
    if (!title) {
      throw new Error(
        `WIP role missing role_title for ${fieldSlug}/${specialismSlug}/${level} at index ${index}`
      )
    }
    const titleSlug = slugify(title)
    const startNow = r.realistic_start_now ?? (level === 'helper_assistant' || level === 'beginner')
    return {
      id: `wip-role-${fieldSlug}--${specialismSlug}--${level}--${titleSlug}-${index}`,
      role_title: title,
      profession_field_id: `wip-field-${fieldSlug}`,
      specialism_id: `wip-spec-${fieldSlug}--${specialismSlug}`,
      professional_level: level,
      seniority: r.seniority ?? DEFAULT_SENIORITY[level],
      min_experience_label: r.min_experience_label ?? DEFAULT_EXP[level],
      typical_entry_requirement:
        r.typical_entry_requirement ??
        'Relevant UK work experience or equivalent practical background',
      licence_or_check_required: r.licence_or_check_required ?? null,
      uk_role_keywords: r.uk_role_keywords ?? [title, specialismSlug.replace(/-/g, ' ')],
      realistic_start_now: startNow,
      progression_roles: r.progression_roles ?? [],
      description:
        r.description ?? defaultRoleDescription(fieldSlug, specialismSlug, level, startNow),
      cv_focus_points: r.cv_focus_points ?? defaultCvFocusPoints(fieldSlug, specialismSlug),
      status: WIP_STATUS,
    }
  })
}
