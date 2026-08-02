import { resolveGoalsFromKeys } from './planningTemplate'
import type { CourseOpportunity, CourseOpportunityInput, OpportunityGoalInput } from './types'
import { findExistingOpportunityByTitle } from './titleNormalization'
import {
  WORK_IN_EDUCATION_BANK_SEED_NOTES,
  WORK_IN_EDUCATION_DEFAULT_GOAL_KEYS,
  WORK_IN_EDUCATION_OPPORTUNITY_BANK,
  resolveEducationBankRoutes,
  type WorkInEducationBankEntry,
} from './workInEducationBank'

export type WorkInEducationSeedSummary = {
  added_count: number
  updated_count: number
  skipped_duplicate_count: number
  routesAdded: number
  goalsAdded: number
}

export const WORK_IN_EDUCATION_SEED_MESSAGE =
  'Core Work in My Education bank imported. Existing opportunities were updated, missing opportunities were added, duplicates were skipped.'

function isBlank(value: string | null | undefined): boolean {
  return !(value ?? '').trim()
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

function goalsToInput(goals: CourseOpportunity['goals']): OpportunityGoalInput[] {
  return (goals ?? []).map((g) => ({ goalKey: g.goalKey, goalLabel: g.goalLabel }))
}

function affiliatePotentialProvider() {
  return {
    providerName: 'Future provider',
    providerStatus: 'Need check',
    affiliateStatus: 'Need follow-up',
    officialUrl: '',
    referralUrl: '',
    dashboardUrl: '',
    commissionType: 'Unknown',
    commissionValue: '',
    publicOfferLabel: '',
    trackingMethod: 'Unknown',
    notes: 'Affiliate-friendly opportunity — provider research needed.',
    isPreferred: true,
  }
}

function buildTemplateGoals(): OpportunityGoalInput[] {
  return resolveGoalsFromKeys([...WORK_IN_EDUCATION_DEFAULT_GOAL_KEYS])
}

function countMetadataChanges(
  existing: CourseOpportunity,
  input: CourseOpportunityInput,
  routesAdded: number,
  goalsAdded: number
): boolean {
  if (routesAdded > 0 || goalsAdded > 0) return true
  if (
    mergeUniqueStrings(existing.educationFields ?? [], input.educationFields ?? []).length !==
    (existing.educationFields ?? []).length
  ) {
    return true
  }
  if (
    mergeUniqueStrings(existing.specialisations ?? [], input.specialisations ?? []).length !==
    (existing.specialisations ?? []).length
  ) {
    return true
  }
  if (isBlank(existing.suggestedSearchKeywords) && !isBlank(input.suggestedSearchKeywords)) return true
  if (isBlank(existing.adminNotes) && !isBlank(input.adminNotes)) return true
  if (isBlank(existing.commercialStatus) && !isBlank(input.commercialStatus)) return true
  if (isBlank(existing.recommendationType) && !isBlank(input.recommendationType)) return true
  if (!existing.canBeCourseCard && input.canBeCourseCard) return true
  return false
}

export function buildEducationBankInputForEntry(
  entry: WorkInEducationBankEntry,
  existing: CourseOpportunity | null
): {
  action: 'create' | 'update' | 'skip'
  input: CourseOpportunityInput
  routesAdded: number
  goalsAdded: number
} {
  const templateRoutes = resolveEducationBankRoutes(entry.routeLabels)
  const templateGoals = buildTemplateGoals()

  if (!existing) {
    return {
      action: 'create',
      routesAdded: templateRoutes.length,
      goalsAdded: templateGoals.length,
      input: {
        courseName: entry.courseName.trim(),
        shortLabel: '',
        coursePurpose: entry.coursePurpose,
        priority: entry.priority,
        opportunityStatus: 'Need provider',
        publishStatus: 'Not published',
        importance: 'Medium',
        notes: WORK_IN_EDUCATION_BANK_SEED_NOTES,
        nextAction: 'Search affiliate providers',
        publishedCourseId: null,
        visibilityStatus: 'internal',
        educationFields: entry.educationFields,
        specialisations: entry.specialisations,
        commercialStatus: 'no_link',
        suggestedSearchKeywords: entry.suggestedSearchKeywords,
        adminNotes: entry.adminNotes,
        canBeCourseCard: true,
        recommendationType: 'course_type',
        routes: templateRoutes,
        goals: templateGoals,
        providers: [affiliatePotentialProvider()],
      },
    }
  }

  const existingRouteKeys = new Set(existing.routes.map((r) => r.routeKey))
  const routesAddedList = templateRoutes.filter((r) => !existingRouteKeys.has(r.routeKey))
  const mergedRoutes = [
    ...existing.routes.map((r) => ({ routeKey: r.routeKey, routeLabel: r.routeLabel })),
    ...routesAddedList,
  ]

  const existingGoalKeys = new Set((existing.goals ?? []).map((g) => g.goalKey))
  const goalsAddedList = templateGoals.filter((g) => !existingGoalKeys.has(g.goalKey))
  const mergedGoals = [...goalsToInput(existing.goals ?? []), ...goalsAddedList]

  const mergedEducationFields = mergeUniqueStrings(existing.educationFields ?? [], entry.educationFields)
  const mergedSpecialisations = mergeUniqueStrings(existing.specialisations ?? [], entry.specialisations)

  const input: CourseOpportunityInput = {
    courseName: existing.courseName,
    shortLabel: existing.shortLabel,
    coursePurpose: isBlank(existing.coursePurpose) ? entry.coursePurpose : existing.coursePurpose,
    priority: existing.priority,
    opportunityStatus: existing.opportunityStatus,
    publishStatus: existing.publishStatus,
    importance: isBlank(existing.importance) ? 'Medium' : existing.importance,
    notes: isBlank(existing.notes) ? WORK_IN_EDUCATION_BANK_SEED_NOTES : existing.notes,
    nextAction: isBlank(existing.nextAction) ? 'Search affiliate providers' : existing.nextAction,
    publishedCourseId: existing.publishedCourseId ?? null,
    educationFields: mergedEducationFields,
    specialisations: mergedSpecialisations,
    commercialStatus: isBlank(existing.commercialStatus) ? 'no_link' : existing.commercialStatus,
    suggestedSearchKeywords: isBlank(existing.suggestedSearchKeywords)
      ? entry.suggestedSearchKeywords
      : existing.suggestedSearchKeywords,
    adminNotes: isBlank(existing.adminNotes) ? entry.adminNotes : existing.adminNotes,
    canBeCourseCard: existing.canBeCourseCard ?? true,
    recommendationType: isBlank(existing.recommendationType) ? 'course_type' : existing.recommendationType,
    routes: mergedRoutes,
    goals: mergedGoals,
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

  const hasChanges = countMetadataChanges(existing, input, routesAddedList.length, goalsAddedList.length)

  return {
    action: hasChanges ? 'update' : 'skip',
    routesAdded: routesAddedList.length,
    goalsAdded: goalsAddedList.length,
    input,
  }
}

export function planWorkInEducationBankOperations(existingOpportunities: CourseOpportunity[]): Array<{
  action: 'create' | 'update' | 'skip'
  existingId?: string
  input: CourseOpportunityInput
  routesAdded: number
  goalsAdded: number
}> {
  const running = [...existingOpportunities]
  const operations: Array<{
    action: 'create' | 'update' | 'skip'
    existingId?: string
    input: CourseOpportunityInput
    routesAdded: number
    goalsAdded: number
  }> = []

  for (const entry of WORK_IN_EDUCATION_OPPORTUNITY_BANK) {
    const existing = findExistingOpportunityByTitle(running, entry.courseName)
    const built = buildEducationBankInputForEntry(entry, existing)

    operations.push({
      action: built.action,
      existingId: existing?.id,
      input: built.input,
      routesAdded: built.routesAdded,
      goalsAdded: built.goalsAdded,
    })

    if (built.action === 'create') {
      running.unshift({
        id: `pending-edu-${entry.courseName}`,
        courseName: built.input.courseName,
        shortLabel: '',
        coursePurpose: built.input.coursePurpose,
        priority: built.input.priority,
        opportunityStatus: built.input.opportunityStatus,
        publishStatus: built.input.publishStatus,
        importance: built.input.importance,
        notes: built.input.notes,
        nextAction: built.input.nextAction,
        publishedCourseId: null,
        educationFields: built.input.educationFields ?? [],
        specialisations: built.input.specialisations ?? [],
        commercialStatus: built.input.commercialStatus ?? '',
        visibilityStatus: built.input.visibilityStatus ?? 'internal',
        suggestedSearchKeywords: built.input.suggestedSearchKeywords ?? '',
        adminNotes: built.input.adminNotes ?? '',
        canBeCourseCard: built.input.canBeCourseCard ?? true,
        recommendationType: built.input.recommendationType ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        routes: built.input.routes.map((r, i) => ({
          id: `r-${i}`,
          opportunityId: '',
          routeKey: r.routeKey,
          routeLabel: r.routeLabel,
        })),
        goals: built.input.goals.map((g, i) => ({
          id: `g-${i}`,
          opportunityId: '',
          goalKey: g.goalKey,
          goalLabel: g.goalLabel,
        })),
        providers: [],
      })
    }
  }

  return operations
}

export function summarizeWorkInEducationBankOperations(
  operations: ReturnType<typeof planWorkInEducationBankOperations>
): WorkInEducationSeedSummary {
  return operations.reduce<WorkInEducationSeedSummary>(
    (acc, op) => {
      if (op.action === 'create') acc.added_count += 1
      else if (op.action === 'update') acc.updated_count += 1
      else acc.skipped_duplicate_count += 1
      acc.routesAdded += op.routesAdded
      acc.goalsAdded += op.goalsAdded
      return acc
    },
    { added_count: 0, updated_count: 0, skipped_duplicate_count: 0, routesAdded: 0, goalsAdded: 0 }
  )
}
