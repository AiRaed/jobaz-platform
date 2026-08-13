/**
 * Admin Course Opportunity Tracker — WIE metadata matching helpers.
 * Display/filter only — does not change public Career Assistant matching.
 */

import type { CourseOpportunity } from './types'
import { normMatchLabel } from '@/lib/recommendations/educationFieldLabels'
import { matchContamination } from '@/lib/career-engine/work-in-education/course-alignment/contamination'
import { findCatalogPacksForFieldName } from '@/lib/career-engine/work-in-education/course-alignment/gap-course-catalog'

/** Career Knowledge Library–aligned education field filter labels. */
export const WIE_EDUCATION_FIELD_FILTER_OPTIONS = [
  'Engineering',
  'IT & Technology',
  'Healthcare & Medicine',
  'Natural Sciences & Research',
  'Business & Management',
  'Accounting, Finance & Banking',
  'Law, Legal & Justice',
  'Education & Teaching',
  'Arts, Media & Creative Industries',
  'Languages & Literature',
  'Humanities & Social Sciences',
  'Environment, Agriculture & Food',
  'Government, Public Policy & International Development',
  'Architecture, Urban & Planning',
  'Psychology & Behavioural Science',
  'Public Health & Social Care',
  'Hospitality, Tourism & Events',
  'Logistics, Supply Chain & Operations',
  'Human Resources & People',
  'Marketing, Communications & Media',
  // Legacy / bank short labels still present on older rows
  'Healthcare',
  'Business & Finance',
  'Construction',
  'Manufacturing',
  'Science',
  'Creative & Design',
  'Social Care',
  'Logistics',
  'Media & Communications',
  'Public Sector',
  'Property & Real Estate',
  'Facilities',
] as const

export type WieStageFilterOption = {
  value: string
  label: string
  /** Match against stage_hints, notes, adminNotes, course purpose */
  matchRe: RegExp
}

export const WIE_STAGE_FILTER_OPTIONS: WieStageFilterOption[] = [
  {
    value: 'foundation_support',
    label: 'Foundation / Support',
    matchRe: /foundation|support|trainee|apprentice|level\s*[12]|fe\b|college|assistant\s*entry/i,
  },
  {
    value: 'technician_assistant',
    label: 'Technician / Assistant',
    matchRe: /technician|assistant|operative|support\s*worker|hca|ta\b/i,
  },
  {
    value: 'graduate_entry',
    label: 'Graduate Entry',
    matchRe: /graduate\s*entry|entry.?level|early.?career|newly.?qualified|graduate(?!\s*engineer)/i,
  },
  {
    value: 'graduate_engineer',
    label: 'Graduate Engineer',
    matchRe: /graduate\s*engineer|junior\s*engineer|graduate.?eng/i,
  },
  {
    value: 'professional_chartered',
    label: 'Professional / Chartered',
    matchRe: /professional|charter|regulat|qualified\s*practi|registration|practising/i,
  },
  {
    value: 'experienced_senior',
    label: 'Experienced / Senior',
    matchRe: /experienced|senior|mid.?career|lead\b/i,
  },
  {
    value: 'academic_research',
    label: 'Academic / Research',
    matchRe: /academic|research|phd|postdoc|doctoral|lab\s*scientist/i,
  },
  {
    value: 'management_leadership',
    label: 'Management / Leadership',
    matchRe: /management|leadership|manager|supervisor|director/i,
  },
]

/** Purpose keywords that map loosely to stage bands when stage_hints are missing. */
const PURPOSE_STAGE_HINTS: Array<{ stageValue: string; purposeRe: RegExp }> = [
  { stageValue: 'foundation_support', purposeRe: /career.?bridge|career starter|entry/i },
  { stageValue: 'technician_assistant', purposeRe: /career.?bridge|career starter|technician/i },
  { stageValue: 'graduate_entry', purposeRe: /technical|skill|cv booster|uk.?workplace|portfolio|career.?bridge/i },
  { stageValue: 'graduate_engineer', purposeRe: /technical|skill|cv booster|portfolio|site|cad|bim/i },
  { stageValue: 'professional_chartered', purposeRe: /professional|cpd|advanced|regulat/i },
  { stageValue: 'experienced_senior', purposeRe: /professional|leadership|management|cpd/i },
  { stageValue: 'academic_research', purposeRe: /research|data|method|lab|academic|writing/i },
  { stageValue: 'management_leadership', purposeRe: /management|leadership|project management/i },
]

function significantTokens(label: string): string[] {
  return normMatchLabel(label)
    .split(' ')
    .filter((t) => t.length > 2 && !['and', 'the', 'for', 'with'].includes(t))
}

export function labelsLooselyMatch(filterLabel: string, candidate: string): boolean {
  const f = normMatchLabel(filterLabel)
  const c = normMatchLabel(candidate)
  if (!f || !c) return false
  if (f === c) return true
  if (f.includes(c) || c.includes(f)) return true
  const fTokens = significantTokens(filterLabel)
  const cTokens = new Set(significantTokens(candidate))
  if (!fTokens.length) return false
  const hit = fTokens.filter((t) => cTokens.has(t) || [...cTokens].some((ct) => ct.includes(t) || t.includes(ct)))
  // Require at least one strong token, or 2+ for multi-word fields
  if (fTokens.length >= 3) return hit.length >= 2
  return hit.length >= 1
}

export function collectOpportunityEducationLabels(opp: CourseOpportunity): string[] {
  const labels = [...(opp.educationFields ?? [])]
  const notes = `${opp.adminNotes ?? ''} ${opp.notes ?? ''}`
  const libraryField = notes.match(/library_field=([^·\n]+)/i)?.[1]?.trim()
  if (libraryField) labels.push(libraryField)
  return labels.map((l) => l.trim()).filter(Boolean)
}

export function collectOpportunitySpecialismLabels(opp: CourseOpportunity): string[] {
  return (opp.specialisations ?? []).map((s) => s.trim()).filter(Boolean)
}

export function extractStageHintsFromOpportunity(opp: CourseOpportunity): string[] {
  const notes = `${opp.adminNotes ?? ''} ${opp.notes ?? ''}`
  const raw = notes.match(/stage_hints=([^·\n]+)/i)?.[1]?.trim()
  if (!raw) return []
  return raw
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function opportunityMatchesEducationField(
  opp: CourseOpportunity,
  fieldFilter: string
): boolean {
  if (!fieldFilter || fieldFilter === 'all') return true

  const candidates = collectOpportunityEducationLabels(opp)
  if (candidates.some((c) => labelsLooselyMatch(fieldFilter, c))) return true

  // Catalog pack: field name matches pack → accept if course title is in pack or education labels overlap pack
  const packs = findCatalogPacksForFieldName(fieldFilter)
  for (const pack of packs) {
    if (pack.educationFieldLabels.some((l) => candidates.some((c) => labelsLooselyMatch(l, c)))) {
      return true
    }
    if (pack.courses.some((c) => labelsLooselyMatch(c.title, opp.courseName))) {
      return true
    }
  }

  // Fallback: search keywords / admin notes mention the field
  const hay = `${opp.suggestedSearchKeywords ?? ''} ${opp.adminNotes ?? ''} ${opp.notes ?? ''} ${opp.courseName}`
  if (labelsLooselyMatch(fieldFilter, hay)) return true

  return false
}

export function opportunityMatchesSpecialism(
  opp: CourseOpportunity,
  specialismFilter: string
): boolean {
  if (!specialismFilter || specialismFilter === 'all') return true
  const specs = collectOpportunitySpecialismLabels(opp)
  if (specs.some((s) => labelsLooselyMatch(specialismFilter, s))) return true

  // Title / notes sometimes carry the specialism (e.g. Civil 3D for Civil Engineering)
  const hay = `${opp.courseName} ${opp.adminNotes ?? ''} ${opp.notes ?? ''} ${opp.suggestedSearchKeywords ?? ''}`
  if (labelsLooselyMatch(specialismFilter, hay)) return true

  return false
}

export function opportunityMatchesStage(
  opp: CourseOpportunity,
  stageFilter: string
): boolean {
  if (!stageFilter || stageFilter === 'all') return true
  const option = WIE_STAGE_FILTER_OPTIONS.find((s) => s.value === stageFilter)
  if (!option) return true

  const hints = extractStageHintsFromOpportunity(opp)
  const hintBlob = hints.join(' ')
  if (hintBlob && option.matchRe.test(hintBlob)) return true

  // Explicit stage_hints that don't match → exclude
  if (hints.length > 0) return false

  // No stage_hints: use purpose / course purpose heuristics
  const purposeBlob = `${opp.coursePurpose ?? ''} ${opp.adminNotes ?? ''} ${opp.notes ?? ''}`
  const purposeHint = PURPOSE_STAGE_HINTS.find((p) => p.stageValue === stageFilter)
  if (purposeHint && purposeHint.purposeRe.test(purposeBlob)) return true

  // wie_purpose= from generated notes
  const wiePurpose = purposeBlob.match(/wie_purpose=([a-z_]+)/i)?.[1] ?? ''
  if (wiePurpose) {
    if (stageFilter === 'foundation_support' || stageFilter === 'technician_assistant') {
      return /career_bridge|uk_workplace/i.test(wiePurpose)
    }
    if (stageFilter === 'graduate_entry' || stageFilter === 'graduate_engineer') {
      return /technical_skill|career_bridge|uk_workplace/i.test(wiePurpose)
    }
    if (stageFilter === 'professional_chartered' || stageFilter === 'experienced_senior') {
      return /professional|cpd/i.test(wiePurpose)
    }
    if (stageFilter === 'academic_research') {
      return /technical_skill|cpd|professional/i.test(wiePurpose)
    }
    if (stageFilter === 'management_leadership') {
      return /professional|cpd/i.test(wiePurpose)
    }
  }

  // Unmapped stage: allow when field/spec already constrained (caller ANDs those)
  // Prefer hiding contaminated junk only — include unmapped WIE course types for browseability
  return isGeneratedOrWieGoal(opp)
}

function isGeneratedOrWieGoal(opp: CourseOpportunity): boolean {
  const goals = (opp.goals ?? []).map((g) => g.goalKey)
  if (goals.includes('work_in_education')) return true
  const notes = `${opp.adminNotes ?? ''} ${opp.notes ?? ''}`
  return /generated_from_work_in_education_course_gap|work_in_education/i.test(notes)
}

/**
 * When WIE path filters are active, hide contamination defaults (SIA/Forklift/Taxi/…)
 * unless the selected field/specialism explicitly allows them.
 * Uses selected filters only — not the row's own (possibly wrong) education tags.
 */
export function opportunityPassesWieContaminationGate(
  opp: CourseOpportunity,
  fieldFilter: string,
  specialismFilter: string
): boolean {
  const pathActive = fieldFilter !== 'all' || specialismFilter !== 'all'
  if (!pathActive) return true

  const selectedCtx = [
    fieldFilter !== 'all' ? fieldFilter : '',
    specialismFilter !== 'all' ? specialismFilter : '',
  ]
    .filter(Boolean)
    .join(' ')

  const hit = matchContamination(opp.courseName, selectedCtx || 'unspecified')
  if (!hit) {
    if (/\b(sia|forklift|taxi|phv|private\s*hire)\b/i.test(opp.courseName)) {
      if (!/security|logistics|warehouse|transport|taxi|phv/i.test(selectedCtx)) return false
    }
    return true
  }
  return hit.allowedForField
}

/** Specialisms present on opportunities that match the selected education field. */
export function collectSpecialismsForEducationField(
  opportunities: CourseOpportunity[],
  fieldFilter: string
): string[] {
  const values = new Set<string>()
  for (const opp of opportunities) {
    if (fieldFilter !== 'all' && !opportunityMatchesEducationField(opp, fieldFilter)) continue
    for (const spec of collectOpportunitySpecialismLabels(opp)) {
      values.add(spec)
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

/** Education field options = curated list ∪ values found on loaded rows. */
export function collectEducationFieldFilterOptions(
  opportunities: CourseOpportunity[]
): string[] {
  const values = new Set<string>([...WIE_EDUCATION_FIELD_FILTER_OPTIONS])
  for (const opp of opportunities) {
    for (const f of collectOpportunityEducationLabels(opp)) {
      values.add(f)
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}
