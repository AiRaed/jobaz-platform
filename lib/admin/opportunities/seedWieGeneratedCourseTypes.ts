/**
 * Plan + apply generated WIE course-type opportunities (recommendation-only, need provider).
 * Catalog-driven: inserts missing titles into the real course_opportunities table.
 * No fake providers, referral URLs, or published courses.
 */

import { resolveGoalsFromKeys, resolveRoutesFromLabels } from './planningTemplate'
import type { CourseOpportunity, CourseOpportunityInput, OpportunityGoalInput } from './types'
import { findExistingOpportunityByTitle } from './titleNormalization'
import {
  WIE_GAP_COURSE_CATALOG,
  WIE_GENERATED_SOURCE,
  type WieGapCourseType,
  type WieGapCatalogPack,
} from '@/lib/career-engine/work-in-education/course-alignment/gap-course-catalog'

export const WIE_GENERATED_SEED_MESSAGE =
  'Generated Work in My Education course types imported as recommendation-only / need-provider rows. No providers or referral links were created.'

export type WieGeneratedSeedSummary = {
  /** Planned creates before DB (legacy) */
  added_count: number
  updated_count: number
  skipped_duplicate_count: number
  fields_touched: number
  packs_matched: number
  contamination_avoided: string[]
  /** Actual DB results — prefer these in UI */
  inserted_count?: number
  skipped_duplicates?: number
  total_before?: number
  total_after?: number
  library_fields_loaded?: number
  catalog_titles_considered?: number
}

export type WieGeneratedSeedOperation = {
  action: 'create' | 'update' | 'skip'
  reason: string
  input: CourseOpportunityInput
  packId: string
  fieldName: string
}

const CONTAMINATION_DEFAULT_BLOCK =
  /\b(sia|door\s*supervisor|security\s*guard|forklift|taxi|phv|private\s*hire|warehouse\s*operative|bar\s*work|generic\s*hospitality)\b/i

function mergeUniqueStrings(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((v) => v.trim().toLowerCase()).filter(Boolean))
  const merged = [...existing]
  for (const item of incoming) {
    const trimmed = item.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(trimmed)
  }
  return merged
}

function isBlank(value: string | null | undefined): boolean {
  return !(value ?? '').trim()
}

function goalsToInput(goals: CourseOpportunity['goals']): OpportunityGoalInput[] {
  return (goals ?? []).map((g) => ({ goalKey: g.goalKey, goalLabel: g.goalLabel }))
}

function wieGoalsOnly(): OpportunityGoalInput[] {
  return resolveGoalsFromKeys(['work_in_education'])
}

function buildAdminNotes(course: WieGapCourseType, fieldName: string, packId: string): string {
  const bits = [
    `source=${WIE_GENERATED_SOURCE}`,
    `pack=${packId}`,
    `wie_purpose=${course.purpose}`,
    `library_field=${fieldName}`,
    'created_from_gap=true',
    'provider_status=need_provider',
    'affiliate_status=need_provider',
    'No provider or referral URL — recommendation-only course type.',
  ]
  if (course.notes) bits.push(course.notes)
  if (course.stageHints?.length) bits.push(`stage_hints=${course.stageHints.join('|')}`)
  return bits.join(' · ')
}

function buildCreateInput(
  course: WieGapCourseType,
  pack: WieGapCatalogPack,
  fieldLabels: string[],
  specialismNames: string[]
): CourseOpportunityInput {
  const primaryField = fieldLabels[0] || pack.educationFieldLabels[0] || pack.id
  const educationFields = mergeUniqueStrings(pack.educationFieldLabels, fieldLabels)
  const specs = mergeUniqueStrings(course.specialisations, specialismNames)

  return {
    courseName: course.title.trim(),
    shortLabel: '',
    coursePurpose: course.coursePurpose,
    priority: course.priority,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: course.priority >= 74 ? 'High' : 'Medium',
    notes: `Generated WIE course type (${WIE_GENERATED_SOURCE}). Do not publish without a real provider.`,
    nextAction: 'Research UK provider — do not add fake referral links',
    publishedCourseId: null,
    visibilityStatus: 'recommendation_only',
    educationFields,
    specialisations: specs,
    commercialStatus: 'no_link',
    suggestedSearchKeywords: `${course.title} course UK ${primaryField}`,
    adminNotes: buildAdminNotes(course, primaryField, pack.id),
    canBeCourseCard: true,
    recommendationType: 'course_type',
    routes: resolveRoutesFromLabels(pack.routeLabels),
    goals: wieGoalsOnly(),
    providers: [],
  }
}

function buildUpdateInput(
  existing: CourseOpportunity,
  course: WieGapCourseType,
  pack: WieGapCatalogPack,
  fieldLabels: string[],
  specialismNames: string[]
): CourseOpportunityInput {
  const primaryField = fieldLabels[0] || pack.educationFieldLabels[0] || pack.id
  const educationFields = mergeUniqueStrings(
    existing.educationFields ?? [],
    mergeUniqueStrings(pack.educationFieldLabels, fieldLabels)
  )
  const specialisations = mergeUniqueStrings(
    existing.specialisations ?? [],
    mergeUniqueStrings(course.specialisations, specialismNames)
  )

  const existingGoalKeys = new Set((existing.goals ?? []).map((g) => g.goalKey))
  const goals = [...goalsToInput(existing.goals ?? [])]
  if (!existingGoalKeys.has('work_in_education')) {
    goals.push(...wieGoalsOnly())
  }

  const existingRouteKeys = new Set(existing.routes.map((r) => r.routeKey))
  const templateRoutes = resolveRoutesFromLabels(pack.routeLabels)
  const routes = [
    ...existing.routes.map((r) => ({ routeKey: r.routeKey, routeLabel: r.routeLabel })),
    ...templateRoutes.filter((r) => !existingRouteKeys.has(r.routeKey)),
  ]

  const commercialStatus =
    existing.commercialStatus === 'affiliate_ready' || existing.commercialStatus === 'official_link'
      ? existing.commercialStatus
      : 'no_link'

  const visibilityStatus =
    existing.visibilityStatus === 'public_listed'
      ? existing.visibilityStatus
      : existing.visibilityStatus || 'recommendation_only'

  return {
    courseName: existing.courseName,
    shortLabel: existing.shortLabel,
    coursePurpose: isBlank(existing.coursePurpose) ? course.coursePurpose : existing.coursePurpose,
    priority: existing.priority,
    opportunityStatus: existing.opportunityStatus,
    publishStatus: existing.publishStatus,
    importance: existing.importance,
    notes: isBlank(existing.notes)
      ? `Mapped to WIE gap catalog (${WIE_GENERATED_SOURCE}).`
      : existing.notes,
    nextAction: isBlank(existing.nextAction)
      ? 'Research UK provider — do not add fake referral links'
      : existing.nextAction,
    publishedCourseId: existing.publishedCourseId ?? null,
    visibilityStatus,
    educationFields,
    specialisations,
    commercialStatus,
    suggestedSearchKeywords: isBlank(existing.suggestedSearchKeywords)
      ? `${course.title} course UK ${primaryField}`
      : existing.suggestedSearchKeywords,
    adminNotes: isBlank(existing.adminNotes)
      ? buildAdminNotes(course, primaryField, pack.id)
      : existing.adminNotes.includes(WIE_GENERATED_SOURCE)
        ? existing.adminNotes
        : `${existing.adminNotes} · mapped_from=${WIE_GENERATED_SOURCE} · library_field=${primaryField}`,
    canBeCourseCard: existing.canBeCourseCard ?? true,
    recommendationType: isBlank(existing.recommendationType)
      ? 'course_type'
      : existing.recommendationType,
    routes,
    goals,
    providers: existing.providers.map((p) => ({
      id: p.id,
      providerName: p.providerName,
      providerStatus: p.providerStatus,
      affiliateStatus: p.affiliateStatus,
      officialUrl: p.officialUrl,
      referralUrl: p.referralUrl,
      dashboardUrl: p.dashboardUrl,
      commissionType: p.commissionType,
      commissionValue: p.commissionValue,
      publicOfferLabel: p.publicOfferLabel,
      trackingMethod: p.trackingMethod,
      notes: p.notes,
      isPreferred: p.isPreferred,
    })),
  }
}

/**
 * Catalog-driven planner: every unique catalog title is considered once.
 * Library fields enrich mapping when their names match a pack; generation does
 * not require library fields to succeed (avoids 0 inserts when names differ).
 */
export function planWieGeneratedCourseTypeOperations(input: {
  fields: Array<{ id: string; name: string }>
  specialisms: Array<{ id: string; field_id: string; name: string }>
  opportunities: CourseOpportunity[]
}): {
  operations: WieGeneratedSeedOperation[]
  summary: WieGeneratedSeedSummary
} {
  const { fields, specialisms, opportunities } = input
  const operations: WieGeneratedSeedOperation[] = []
  const contaminationAvoided: string[] = []
  const fieldsTouched = new Set<string>()
  const packsMatched = new Set<string>()

  let added = 0
  let updated = 0
  let skipped = 0
  let catalogTitles = 0

  for (const pack of WIE_GAP_COURSE_CATALOG) {
    packsMatched.add(pack.id)

    const matchedLibraryFields = fields.filter((f) => pack.fieldMatch.test(f.name))
    const fieldLabels =
      matchedLibraryFields.length > 0
        ? matchedLibraryFields.map((f) => f.name)
        : [...pack.educationFieldLabels]

    for (const f of fieldLabels) fieldsTouched.add(f)

    const matchedFieldIds = new Set(matchedLibraryFields.map((f) => f.id))
    const specs = specialisms
      .filter((s) => matchedFieldIds.size === 0 || matchedFieldIds.has(s.field_id))
      .map((s) => s.name)
      .slice(0, 16)

    for (const course of pack.courses) {
      catalogTitles += 1

      if (CONTAMINATION_DEFAULT_BLOCK.test(course.title)) {
        contaminationAvoided.push(course.title)
        skipped += 1
        operations.push({
          action: 'skip',
          reason: 'contamination_default_blocked',
          packId: pack.id,
          fieldName: fieldLabels[0] || pack.id,
          input: buildCreateInput(course, pack, fieldLabels, specs),
        })
        continue
      }

      // Already planned this exact course title in an earlier pack this run?
      const alreadyPlanned = operations.find(
        (op) =>
          op.action !== 'skip' &&
          op.input.courseName.trim().toLowerCase() === course.title.trim().toLowerCase()
      )
      if (alreadyPlanned && alreadyPlanned.action !== 'skip') {
        alreadyPlanned.input.educationFields = mergeUniqueStrings(
          alreadyPlanned.input.educationFields ?? [],
          fieldLabels
        )
        alreadyPlanned.input.specialisations = mergeUniqueStrings(
          alreadyPlanned.input.specialisations ?? [],
          [...course.specialisations, ...specs]
        )
        skipped += 1
        continue
      }

      const existing = findExistingOpportunityByTitle(opportunities, course.title)
      if (existing) {
        const updateInput = buildUpdateInput(existing, course, pack, fieldLabels, specs)
        const fieldsGrew =
          (updateInput.educationFields ?? []).length > (existing.educationFields ?? []).length
        const specsGrew =
          (updateInput.specialisations ?? []).length > (existing.specialisations ?? []).length
        const needsWieGoal = !(existing.goals ?? []).some((g) => g.goalKey === 'work_in_education')
        const needsSourceTag = !(existing.adminNotes ?? '').includes(WIE_GENERATED_SOURCE)

        if (!fieldsGrew && !specsGrew && !needsWieGoal && !needsSourceTag) {
          skipped += 1
          operations.push({
            action: 'skip',
            reason: 'duplicate_already_mapped',
            packId: pack.id,
            fieldName: fieldLabels[0] || pack.id,
            input: updateInput,
          })
          continue
        }

        updated += 1
        operations.push({
          action: 'update',
          reason: 'merge_wie_mapping',
          packId: pack.id,
          fieldName: fieldLabels[0] || pack.id,
          input: updateInput,
        })
        continue
      }

      added += 1
      operations.push({
        action: 'create',
        reason: 'missing_wie_course_type',
        packId: pack.id,
        fieldName: fieldLabels[0] || pack.id,
        input: buildCreateInput(course, pack, fieldLabels, specs),
      })
    }
  }

  return {
    operations,
    summary: {
      added_count: added,
      updated_count: updated,
      skipped_duplicate_count: skipped,
      fields_touched: fieldsTouched.size,
      packs_matched: packsMatched.size,
      contamination_avoided: [...new Set(contaminationAvoided)],
      library_fields_loaded: fields.length,
      catalog_titles_considered: catalogTitles,
    },
  }
}

export function isGeneratedWieCourseOpportunity(opp: CourseOpportunity): boolean {
  const hay = `${opp.notes ?? ''} ${opp.adminNotes ?? ''}`
  return hay.includes(WIE_GENERATED_SOURCE)
}

export function summarizeWieGeneratedOperations(
  operations: WieGeneratedSeedOperation[]
): WieGeneratedSeedSummary {
  return {
    added_count: operations.filter((o) => o.action === 'create').length,
    updated_count: operations.filter((o) => o.action === 'update').length,
    skipped_duplicate_count: operations.filter((o) => o.action === 'skip').length,
    fields_touched: new Set(operations.map((o) => o.fieldName)).size,
    packs_matched: new Set(operations.map((o) => o.packId)).size,
    contamination_avoided: operations
      .filter((o) => o.reason === 'contamination_default_blocked')
      .map((o) => o.input.courseName),
  }
}
