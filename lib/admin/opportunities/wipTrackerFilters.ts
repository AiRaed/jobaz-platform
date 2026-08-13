/**
 * Admin Course Opportunity Tracker — Work in My Profession filter helpers.
 * Display/filter only — does not change public Career Assistant matching.
 */

import type { CourseOpportunity } from './types'
import { labelsLooselyMatch } from './wieTrackerFilters'
import { listProfessionFields, listSpecialismsForField, PROFESSIONAL_LEVELS } from '@/lib/career-engine/work-in-profession'
import { WIP_GENERATED_SOURCE, findWipCatalogPack } from '@/lib/career-engine/work-in-profession/course-alignment'
import { matchWipContamination } from '@/lib/career-engine/work-in-profession/course-alignment/contamination'
import { isCourseAffiliateReady } from './affiliateReadiness'
import { isGeneratedWipCourseOpportunity } from './seedWipGeneratedCourseTypes'

export { isGeneratedWipCourseOpportunity } from './seedWipGeneratedCourseTypes'

export const WIP_GOAL_KEY = 'work_in_profession' as const

export const WIP_PROFESSION_FIELD_FILTER_OPTIONS: string[] = listProfessionFields().map((f) => f.name)

export const WIP_PROFESSIONAL_LEVEL_FILTER_OPTIONS = PROFESSIONAL_LEVELS.map((l) => ({
  value: l.key,
  label: l.label,
}))

export function isWorkInProfessionOpportunity(opp: CourseOpportunity): boolean {
  if ((opp.goals ?? []).some((g) => g.goalKey === WIP_GOAL_KEY)) return true
  const notes = `${opp.adminNotes ?? ''} ${opp.notes ?? ''}`
  return notes.includes(WIP_GENERATED_SOURCE) || /goal.?path\s*=\s*work_in_profession/i.test(notes)
}

export function collectOpportunityProfessionLabels(opp: CourseOpportunity): string[] {
  const labels = [...(opp.educationFields ?? [])]
  const notes = `${opp.adminNotes ?? ''} ${opp.notes ?? ''}`
  const professionField = notes.match(/profession_field=([^·\n]+)/i)?.[1]?.trim()
  if (professionField) labels.push(professionField)
  return labels.map((l) => l.trim()).filter(Boolean)
}

export function collectOpportunityWipSpecialismLabels(opp: CourseOpportunity): string[] {
  return (opp.specialisations ?? []).map((s) => s.trim()).filter(Boolean)
}

export function extractProfessionalLevelHints(opp: CourseOpportunity): string[] {
  const notes = `${opp.adminNotes ?? ''} ${opp.notes ?? ''}`
  const raw =
    notes.match(/professional_level=([^·\n]+)/i)?.[1]?.trim() ||
    notes.match(/wip_level=([^·\n]+)/i)?.[1]?.trim()
  if (!raw) return []
  return raw
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function opportunityMatchesGoalPath(opp: CourseOpportunity, goalPath: string): boolean {
  if (!goalPath || goalPath === 'all') return true
  if ((opp.goals ?? []).some((g) => g.goalKey === goalPath)) return true
  if (goalPath === WIP_GOAL_KEY) return isWorkInProfessionOpportunity(opp)
  return false
}

export function opportunityMatchesProfessionField(
  opp: CourseOpportunity,
  fieldFilter: string
): boolean {
  if (!fieldFilter || fieldFilter === 'all') return true

  const candidates = collectOpportunityProfessionLabels(opp)
  if (candidates.some((c) => labelsLooselyMatch(fieldFilter, c))) return true

  const field = listProfessionFields().find((f) => labelsLooselyMatch(fieldFilter, f.name))
  if (field) {
    const pack = findWipCatalogPack(field.slug)
    if (pack?.courses.some((c) => labelsLooselyMatch(c.title, opp.courseName))) return true
  }

  const hay = `${opp.suggestedSearchKeywords ?? ''} ${opp.adminNotes ?? ''} ${opp.notes ?? ''} ${opp.courseName}`
  return labelsLooselyMatch(fieldFilter, hay)
}

export function opportunityMatchesProfessionSpecialism(
  opp: CourseOpportunity,
  specialismFilter: string
): boolean {
  if (!specialismFilter || specialismFilter === 'all') return true
  const specs = collectOpportunityWipSpecialismLabels(opp)
  if (specs.some((s) => labelsLooselyMatch(specialismFilter, s))) return true
  const hay = `${opp.courseName} ${opp.adminNotes ?? ''} ${opp.notes ?? ''} ${opp.suggestedSearchKeywords ?? ''}`
  return labelsLooselyMatch(specialismFilter, hay)
}

export function opportunityMatchesProfessionalLevel(
  opp: CourseOpportunity,
  levelFilter: string
): boolean {
  if (!levelFilter || levelFilter === 'all') return true
  const option = WIP_PROFESSIONAL_LEVEL_FILTER_OPTIONS.find((l) => l.value === levelFilter)
  if (!option) return true

  const hints = extractProfessionalLevelHints(opp)
  if (hints.length) {
    return hints.some(
      (h) =>
        h.toLowerCase() === option.value ||
        labelsLooselyMatch(option.label, h) ||
        labelsLooselyMatch(option.value.replace(/_/g, ' '), h)
    )
  }

  // Unmapped: keep WIP-aligned rows browseable when other path filters are set
  return isWorkInProfessionOpportunity(opp)
}

/**
 * When profession path filters are active, hide contaminated titles
 * unless the selected field/specialism allows them.
 */
export function opportunityPassesWipContaminationGate(
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

  const hit = matchWipContamination(opp.courseName, selectedCtx || 'unspecified')
  if (!hit) return true
  return hit.allowedForField
}

export function collectSpecialismsForProfessionField(
  opportunities: CourseOpportunity[],
  fieldFilter: string
): string[] {
  const values = new Set<string>()

  if (fieldFilter !== 'all') {
    const field = listProfessionFields().find((f) => labelsLooselyMatch(fieldFilter, f.name))
    if (field) {
      for (const spec of listSpecialismsForField(field.slug)) {
        values.add(spec.name)
      }
    }
  }

  for (const opp of opportunities) {
    if (fieldFilter !== 'all' && !opportunityMatchesProfessionField(opp, fieldFilter)) continue
    for (const spec of collectOpportunityWipSpecialismLabels(opp)) {
      values.add(spec)
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

export function collectProfessionFieldFilterOptions(
  opportunities: CourseOpportunity[]
): string[] {
  const values = new Set<string>(WIP_PROFESSION_FIELD_FILTER_OPTIONS)
  for (const opp of opportunities) {
    for (const f of collectOpportunityProfessionLabels(opp)) {
      values.add(f)
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

export function summarizeWipTrackerCounts(opportunities: CourseOpportunity[]): {
  wipAligned: number
  wipNeedsProvider: number
  wipAffiliateReady: number
  wipGenerated: number
} {
  const opportunityNeedsProvider = (opp: CourseOpportunity) => {
    if (opp.publishStatus === 'Published' || Boolean(opp.publishedCourseId)) return false
    return opp.opportunityStatus === 'Need provider' || opp.providers.length === 0
  }
  const wip = opportunities.filter(isWorkInProfessionOpportunity)
  return {
    wipAligned: wip.length,
    wipNeedsProvider: wip.filter(opportunityNeedsProvider).length,
    wipAffiliateReady: wip.filter(isCourseAffiliateReady).length,
    wipGenerated: opportunities.filter(isGeneratedWipCourseOpportunity).length,
  }
}
