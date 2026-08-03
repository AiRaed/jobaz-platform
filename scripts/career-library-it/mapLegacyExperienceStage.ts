/**
 * Map legacy experience_level stage assignments onto it_skill_experience.
 * Used by Fix Batch 1 remap — does not create roles.
 */

import type { ItSkillStageKey } from './shared'

export type LegacyExperienceKey =
  | 'entry'
  | 'junior'
  | 'mid_level'
  | 'senior'
  | 'lead'
  | 'architect'
  | 'manager'
  | 'director'
  | 'academic_research'

export type ItRoleForMap = {
  name: string
  seniority_level: string | null
  minimum_experience_years: number | null
  role_category: string | null
  fit_classification: string | null
  is_research_role?: boolean | null
  is_academic_role?: boolean | null
  metadata: Record<string, unknown> | null
  legacyStageKey: string
}

export type ItStageMapResult = {
  stageKey: ItSkillStageKey
  reason: string
  ambiguous: boolean
  ambiguityNotes: string[]
  legacyKey: string
}

const LEGACY_KEYS = new Set<string>([
  'entry',
  'junior',
  'mid_level',
  'senior',
  'lead',
  'architect',
  'manager',
  'director',
  'academic_research',
])

const DIRECT: Record<string, ItSkillStageKey> = {
  entry: 'entry_trainee',
  junior: 'junior',
  senior: 'senior',
  lead: 'lead_principal',
  architect: 'architect_specialist',
  manager: 'manager_head',
  director: 'director_executive',
  academic_research: 'academic_research',
}

function resolveLegacyKey(role: ItRoleForMap): string {
  const fromMeta = String(
    role.metadata?.stage_key ?? role.metadata?.experience_level ?? ''
  ).toLowerCase()
  if (LEGACY_KEYS.has(fromMeta)) return fromMeta
  const fromStage = role.legacyStageKey.toLowerCase()
  if (LEGACY_KEYS.has(fromStage)) return fromStage
  return fromStage || 'unknown'
}

function mapMidLevel(years: number, title: string): {
  stageKey: ItSkillStageKey
  reason: string
  ambiguous: boolean
  note?: string
} {
  if (/\bexperienced\b/i.test(title) || years >= 4) {
    return {
      stageKey: 'experienced',
      reason: 'Legacy mid_level with experienced signal or 4+ years → experienced',
      ambiguous: years === 3 && !/\bexperienced\b/i.test(title),
      note:
        years === 3 && !/\bexperienced\b/i.test(title)
          ? 'mid_level at 3 years could be practitioner or experienced'
          : undefined,
    }
  }
  if (years <= 2) {
    return {
      stageKey: 'practitioner',
      reason: 'Legacy mid_level with ≤2 years → practitioner',
      ambiguous: false,
    }
  }
  // Default for typical mid (≈3y) independent delivery roles
  return {
    stageKey: 'practitioner',
    reason: 'Legacy mid_level independent delivery → practitioner',
    ambiguous: years === 3,
    note: years === 3 ? 'mid_level at ~3 years mapped to practitioner (closest independent delivery stage)' : undefined,
  }
}

/**
 * Choose the closest it_skill_experience stage for a role still on experience_level.
 */
export function mapItRoleFromLegacyExperience(role: ItRoleForMap): ItStageMapResult {
  const legacyKey = resolveLegacyKey(role)
  const name = role.name.trim()
  const n = name.toLowerCase()
  const years = role.minimum_experience_years ?? 0
  const seniority = (role.seniority_level ?? '').toLowerCase()
  const category = (role.role_category ?? '').toLowerCase()
  const fit = (role.fit_classification ?? '').toLowerCase()
  const notes: string[] = []
  let ambiguous = false

  // Strong title / metadata overrides (order matters)
  if (
    role.is_academic_role ||
    category === 'academic' ||
    fit === 'academic_or_research' ||
    /professor|lecturer|postdoctoral|postdoc|phd researcher|research fellow|research associate|doctoral/i.test(
      n
    ) ||
    (role.is_research_role &&
      (legacyKey === 'academic_research' || /research scientist|research engineer/i.test(n)))
  ) {
    if (legacyKey !== 'academic_research' && !role.is_academic_role && category !== 'academic') {
      ambiguous = true
      notes.push(`Title/research signals academic_research but legacy stage was ${legacyKey}`)
    }
    return {
      stageKey: 'academic_research',
      reason: 'Academic/research title, category, or fit',
      ambiguous,
      ambiguityNotes: notes,
      legacyKey,
    }
  }

  if (
    /\b(cto|chief technology officer|vp engineering|vice president|technology director|it director|head of engineering|head of technology|chief information officer|\bcio\b)\b/i.test(
      n
    ) ||
    (seniority === 'leadership' && years >= 12 && /director|chief|head of|vp\b/i.test(n))
  ) {
    return {
      stageKey: 'director_executive',
      reason: 'Director / executive leadership title',
      ambiguous: legacyKey !== 'director' && legacyKey !== 'manager',
      ambiguityNotes:
        legacyKey !== 'director' && legacyKey !== 'manager'
          ? [`Director-level title but legacy stage was ${legacyKey}`]
          : [],
      legacyKey,
    }
  }

  if (
    /\b(engineering manager|engineering managers|delivery manager|programme manager|program manager|product engineering manager|head of|team manager|people manager)\b/i.test(
      n
    ) ||
    (category === 'leadership' && /manager|head\b/i.test(n) && !/director|chief|cto|cio/i.test(n))
  ) {
    return {
      stageKey: 'manager_head',
      reason: 'People / delivery management responsibility',
      ambiguous: legacyKey === 'lead' || legacyKey === 'architect',
      ambiguityNotes:
        legacyKey === 'lead' || legacyKey === 'architect'
          ? [`Management title but legacy stage was ${legacyKey}`]
          : [],
      legacyKey,
    }
  }

  if (
    /\b(solutions architect|software architect|enterprise architect|security architect|cloud architect|data architect|platform architect|principal architect|system architect)\b/i.test(
      n
    ) ||
    (/\barchitect\b/i.test(n) && !/architecture student|architectural/i.test(n))
  ) {
    // Only promote to architect_specialist when seniority/legacy already indicate advanced depth
    if (
      legacyKey === 'architect' ||
      legacyKey === 'lead' ||
      legacyKey === 'senior' ||
      years >= 6 ||
      seniority === 'principal' ||
      seniority === 'leadership'
    ) {
      return {
        stageKey: 'architect_specialist',
        reason: 'Architect / deep specialist title at advanced seniority',
        ambiguous: legacyKey !== 'architect' && legacyKey !== 'lead' && legacyKey !== 'senior',
        ambiguityNotes:
          legacyKey !== 'architect' && legacyKey !== 'lead' && legacyKey !== 'senior'
            ? [`Architect title but legacy stage was ${legacyKey}`]
            : [],
        legacyKey,
      }
    }
    notes.push(`Title contains architect but legacy=${legacyKey}; keeping ladder map`)
    ambiguous = true
  }

  if (
    /\b(principal|staff engineer|staff developer|tech lead|technical lead|team lead|team leader|lead developer|lead engineer|lead programmer)\b/i.test(
      n
    ) ||
    seniority === 'principal'
  ) {
    if (
      legacyKey === 'lead' ||
      legacyKey === 'senior' ||
      legacyKey === 'architect' ||
      legacyKey === 'manager' ||
      years >= 5 ||
      seniority === 'principal' ||
      seniority === 'leadership'
    ) {
      return {
        stageKey: 'lead_principal',
        reason: 'Lead / principal / staff technical ownership',
        ambiguous: legacyKey === 'manager' || legacyKey === 'senior',
        ambiguityNotes:
          legacyKey === 'manager' || legacyKey === 'senior'
            ? [`Lead/principal title but legacy stage was ${legacyKey}`]
            : [],
        legacyKey,
      }
    }
    notes.push(`Lead/principal title but early legacy=${legacyKey}; keeping ladder map`)
    ambiguous = true
  }

  if (
    /\b(apprentice|trainee|bootcamp|graduate (software|web|data|it|developer|engineer)|entry[- ]level|internship|intern\b)\b/i.test(
      n
    ) ||
    (seniority === 'entry' && years <= 0 && legacyKey === 'entry')
  ) {
    return {
      stageKey: 'entry_trainee',
      reason: 'Entry / trainee / graduate starter title',
      ambiguous,
      ambiguityNotes: notes,
      legacyKey,
    }
  }

  if (/\bjunior\b/i.test(n) || (seniority === 'early_career' && years <= 2 && legacyKey === 'junior')) {
    return {
      stageKey: 'junior',
      reason: 'Junior / early-career title',
      ambiguous,
      ambiguityNotes: notes,
      legacyKey,
    }
  }

  if (/\bsenior\b/i.test(n) && years >= 4) {
    const seniorAmbiguous = legacyKey === 'lead' || legacyKey === 'mid_level' || ambiguous
    if (legacyKey === 'lead' || legacyKey === 'mid_level') {
      notes.push(`Senior title but legacy stage was ${legacyKey}`)
    }
    return {
      stageKey: 'senior',
      reason: 'Senior title with 4+ years',
      ambiguous: seniorAmbiguous,
      ambiguityNotes: notes,
      legacyKey,
    }
  }

  if (legacyKey === 'mid_level') {
    const mid = mapMidLevel(years, name)
    if (mid.note) {
      ambiguous = true
      notes.push(mid.note)
    }
    return {
      stageKey: mid.stageKey,
      reason: mid.reason,
      ambiguous: ambiguous || mid.ambiguous,
      ambiguityNotes: notes,
      legacyKey,
    }
  }

  if (DIRECT[legacyKey]) {
    return {
      stageKey: DIRECT[legacyKey],
      reason: `Direct legacy experience_level '${legacyKey}' → ${DIRECT[legacyKey]}`,
      ambiguous,
      ambiguityNotes: notes,
      legacyKey,
    }
  }

  // Fallback from seniority / years when legacy key unknown
  ambiguous = true
  notes.push(`Unknown legacy stage '${legacyKey}' — inferred from seniority/years`)
  let stageKey: ItSkillStageKey = 'practitioner'
  if (seniority === 'entry' || years <= 0) stageKey = 'entry_trainee'
  else if (seniority === 'early_career' || years <= 2) stageKey = 'junior'
  else if (seniority === 'senior' || years >= 5) stageKey = 'senior'
  else if (seniority === 'principal' || years >= 7) stageKey = 'lead_principal'
  else if (seniority === 'leadership') stageKey = years >= 12 ? 'director_executive' : 'manager_head'
  else if (years >= 3) stageKey = 'experienced'
  else stageKey = 'practitioner'

  return {
    stageKey,
    reason: `Fallback inference → ${stageKey}`,
    ambiguous: true,
    ambiguityNotes: notes,
    legacyKey,
  }
}
