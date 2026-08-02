/**
 * Rule-based field hints — bootstrap extraction before / alongside AI.
 */

import { isFieldFirstMode } from './domains'
import type { CareerProfile } from './types'

export type FieldHint = {
  current_field: string | null
  experience_field: string | null
  education_field: string | null
  detected_roles: string[]
  transferable_skills: string[]
  experience_level: 'none' | 'entry' | 'junior' | 'mid' | 'senior' | null
  urgent_income_need: boolean
  wants_career_change: boolean
}

const PATTERNS: Array<{
  field: string
  re: RegExp
  roles: string[]
  skills?: string[]
}> = [
  {
    field: 'animation',
    re: /\b(animat(or|ion)|maya|after\s*effects|blender|motion\s*graphics|3d\s*artist|cinema\s*4d)\b/i,
    roles: ['Junior animator', 'Motion graphics assistant', 'Video editor', '3D artist assistant'],
    skills: ['Animation', 'Motion graphics', 'Visual storytelling'],
  },
  {
    field: 'design',
    re: /\b(graphic\s*design|illustrator|photoshop|ui\/ux|figma|creative\s*design)\b/i,
    roles: ['Junior graphic designer', 'Social media designer', 'Marketing design assistant'],
    skills: ['Design', 'Visual communication'],
  },
  {
    field: 'software',
    re: /\b(developer|software|programmer|coding|javascript|python|react|full[\s-]?stack)\b/i,
    roles: ['Junior developer', 'IT support', 'QA tester', 'Junior web developer'],
    skills: ['Programming', 'Problem solving'],
  },
  {
    field: 'accounting',
    re: /\b(accounting|accountant|bookkeep|finance\s*degree|a-level\s*maths)\b/i,
    roles: ['Accounts assistant', 'Bookkeeping clerk', 'Finance admin'],
    skills: ['Numeracy', 'Attention to detail'],
  },
  {
    field: 'nursing',
    re: /\b(nurse|nursing|healthcare\s*assistant|care\s*worker|hospital)\b/i,
    roles: ['Healthcare assistant', 'Care support worker', 'NHS support roles'],
    skills: ['Care', 'Reliability'],
  },
  {
    field: 'teaching',
    re: /\b(teacher|teaching|tutor|classroom|pgce|education\s*degree)\b/i,
    roles: ['Teaching assistant', 'Learning support assistant', 'Tutor'],
    skills: ['Communication', 'Patience'],
  },
  {
    field: 'engineering',
    re: /\b(engineer|mechanical|electrical|civil|manufacturing)\b/i,
    roles: ['Engineering technician', 'Production operative', 'Quality inspector'],
    skills: ['Technical skills', 'Problem solving'],
  },
  {
    field: 'driving',
    re: /\b(taxi|uber|delivery\s*driver|courier|hgv|van\s*driver|driver)\b/i,
    roles: ['Delivery driver', 'Courier', 'Private hire driver', 'Van driver'],
    skills: ['Driving', 'Navigation', 'Customer service'],
  },
  {
    field: 'hospitality',
    re: /\b(waiter|waitress|chef|kitchen|restaurant|hotel|barista|hospitality)\b/i,
    roles: ['Waiting staff', 'Kitchen porter', 'Hotel front desk', 'Barista'],
    skills: ['Customer service', 'Teamwork'],
  },
  {
    field: 'warehouse',
    re: /\b(warehouse|picker|packer|forklift|logistics)\b/i,
    roles: ['Warehouse operative', 'Picker/packer', 'Goods-in operative'],
    skills: ['Reliability', 'Physical stamina'],
  },
]

export function detectFieldHintsFromText(text: string): FieldHint {
  const blob = text.toLowerCase()
  const hint: FieldHint = {
    current_field: null,
    experience_field: null,
    education_field: null,
    detected_roles: [],
    transferable_skills: [],
    experience_level: null,
    urgent_income_need: /\b(urgent|asap|any\s*job|need\s*money|quick\s*income|immediately)\b/i.test(blob),
    wants_career_change: /\b(change\s*career|different\s*field|new\s*career|switch\s*career)\b/i.test(blob),
  }

  if (/\b(\d+\s*(years?|yrs?)|months?\s+of\s+experience|8\s*months)\b/i.test(blob)) {
    hint.experience_level = /\b(\d+\s*years?|[2-9]\d\s*months)\b/i.test(blob) ? 'junior' : 'entry'
  } else if (/\bno\s+experience|never\s+worked|first\s+job\b/i.test(blob)) {
    hint.experience_level = 'none'
  }

  for (const p of PATTERNS) {
    if (p.re.test(blob)) {
      hint.current_field = hint.current_field ?? p.field
      hint.experience_field = hint.experience_field ?? p.field
      hint.detected_roles.push(...p.roles)
      if (p.skills) hint.transferable_skills.push(...p.skills)
    }
  }

  if (/\b(studied|degree|university|college|graduat)/i.test(blob) && !hint.education_field) {
    hint.education_field = hint.current_field
  }

  hint.detected_roles = [...new Set(hint.detected_roles)]
  hint.transferable_skills = [...new Set(hint.transferable_skills)]

  return hint
}

export function buildNarrativeFromState(state: {
  answers?: Record<string, unknown>
  path_story?: string
  classification?: Record<string, unknown>
}): string {
  const parts: string[] = []
  if (state.path_story?.trim()) {
    parts.push(`User story: ${state.path_story.trim()}`)
  }
  const answers = state.answers ?? {}
  for (const [k, v] of Object.entries(answers)) {
    if (v === undefined || v === null || v === '') continue
    const val = Array.isArray(v) ? v.join(', ') : String(v)
    if (val.length > 0 && val.length < 500) {
      parts.push(`${k}: ${val}`)
    }
  }
  const c = state.classification ?? {}
  if (c.edu) parts.push(`classification edu: ${c.edu}`)
  if (c.exp) parts.push(`classification exp: ${c.exp}`)
  if (c.rel) parts.push(`classification rel: ${c.rel}`)
  return parts.join('\n')
}

/** @deprecated Use isFieldFirstMode from domains */
export function isSpecialistProfile(profile: CareerProfile): boolean {
  return isFieldFirstMode(profile)
}
