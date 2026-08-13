/**
 * Plan + apply generated WIP course-type opportunities (recommendation-only, need provider).
 * No fake providers, referral URLs, or published courses.
 */

import { resolveGoalsFromKeys, resolveRoutesFromLabels } from './planningTemplate'
import type { CourseOpportunity, CourseOpportunityInput, OpportunityGoalInput } from './types'
import { findExistingOpportunityByTitle } from './titleNormalization'
import {
  WIP_GAP_COURSE_CATALOG,
  WIP_GENERATED_SOURCE,
  type WipGapCatalogPack,
  type WipGapCourseType,
} from '@/lib/career-engine/work-in-profession/course-alignment/gap-course-catalog'
import { listProfessionFields, listSpecialismsForField } from '@/lib/career-engine/work-in-profession'

export const WIP_GENERATED_SEED_MESSAGE =
  'Generated Work in My Profession course types imported as recommendation-only / need-provider rows. No providers or referral links were created.'

export type WipGeneratedSeedSummary = {
  added_count: number
  updated_count: number
  skipped_duplicate_count: number
  fields_touched: number
  packs_matched: number
  contamination_avoided: string[]
  inserted_count?: number
  skipped_duplicates?: number
  total_before?: number
  total_after?: number
  catalog_titles_considered?: number
}

export type WipGeneratedSeedOperation = {
  action: 'create' | 'update' | 'skip'
  reason: string
  input: CourseOpportunityInput
  packId: string
  fieldName: string
}

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

function wipGoalsOnly(): OpportunityGoalInput[] {
  return resolveGoalsFromKeys(['work_in_profession'])
}

function buildAdminNotes(course: WipGapCourseType, fieldName: string, packId: string): string {
  return [
    `source=${WIP_GENERATED_SOURCE}`,
    `pack=${packId}`,
    `wip_group=${course.group}`,
    `wip_purpose=${course.purpose}`,
    `profession_field=${fieldName}`,
    'created_from_gap=true',
    'provider_status=need_provider',
    'affiliate_status=need_provider',
    'No provider or referral URL — recommendation-only course type.',
    course.notes || '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function buildCreateInput(
  course: WipGapCourseType,
  pack: WipGapCatalogPack,
  specialismNames: string[]
): CourseOpportunityInput {
  const primaryField = pack.fieldLabels[0] || pack.id
  return {
    courseName: course.title.trim(),
    shortLabel: '',
    coursePurpose: course.purpose,
    priority: course.priority,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: course.priority >= 85 ? 'High' : 'Medium',
    notes: `Generated WIP course type (${WIP_GENERATED_SOURCE}). Do not publish without a real provider.`,
    nextAction: 'Research UK provider — do not add fake referral links',
    publishedCourseId: null,
    visibilityStatus: 'recommendation_only',
    educationFields: pack.fieldLabels,
    specialisations: mergeUniqueStrings(course.specialismHints ?? [], specialismNames),
    commercialStatus: 'no_link',
    suggestedSearchKeywords: `${course.title} course UK ${primaryField}`,
    adminNotes: buildAdminNotes(course, primaryField, pack.id),
    canBeCourseCard: true,
    recommendationType: 'course_type',
    routes: resolveRoutesFromLabels(pack.fieldLabels),
    goals: wipGoalsOnly(),
    providers: [],
  }
}

export function isGeneratedWipCourseOpportunity(opp: CourseOpportunity): boolean {
  return (opp.adminNotes || '').includes(WIP_GENERATED_SOURCE)
}

export function planWipGeneratedCourseTypeOperations(input: {
  opportunities: CourseOpportunity[]
}): {
  operations: WipGeneratedSeedOperation[]
  summary: WipGeneratedSeedSummary
} {
  const { opportunities } = input
  const operations: WipGeneratedSeedOperation[] = []
  const contamination_avoided: string[] = []
  let skipped = 0
  let packs_matched = 0
  const fieldsTouched = new Set<string>()

  for (const pack of WIP_GAP_COURSE_CATALOG) {
    packs_matched += 1
    fieldsTouched.add(pack.fieldSlug)
    const specs = listSpecialismsForField(pack.fieldSlug).map((s) => s.name)
    const fieldMeta = listProfessionFields().find((f) => f.slug === pack.fieldSlug)

    for (const course of pack.courses) {
      if (course.isCheckNotCourse) continue

      const existing = findExistingOpportunityByTitle(opportunities, course.title)
      if (existing) {
        skipped += 1
        operations.push({
          action: 'skip',
          reason: 'duplicate_title',
          input: buildCreateInput(course, pack, specs),
          packId: pack.id,
          fieldName: fieldMeta?.name || pack.fieldLabels[0],
        })
        continue
      }

      operations.push({
        action: 'create',
        reason: 'missing_profession_course_type',
        input: buildCreateInput(course, pack, specs),
        packId: pack.id,
        fieldName: fieldMeta?.name || pack.fieldLabels[0],
      })
    }
  }

  const creates = operations.filter((o) => o.action === 'create')
  return {
    operations,
    summary: {
      added_count: creates.length,
      updated_count: 0,
      skipped_duplicate_count: skipped,
      fields_touched: fieldsTouched.size,
      packs_matched,
      contamination_avoided,
      catalog_titles_considered: creates.length + skipped,
    },
  }
}

export function assertSafeWipGeneratedInput(input: CourseOpportunityInput): void {
  if (input.providers?.length) {
    throw new Error('WIP generated course types must not include providers')
  }
  if (input.publishStatus === 'Published') {
    throw new Error('WIP generated course types must not be published')
  }
  if (input.commercialStatus !== 'no_link') {
    throw new Error('WIP generated course types must be commercialStatus=no_link')
  }
  if (input.publishedCourseId) {
    throw new Error('WIP generated course types must not link a published course')
  }
}
