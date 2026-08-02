import type { CourseOpportunity, CourseOpportunityInput, CourseOpportunityStore } from './types'
import { normalizePreferredProviders } from './mappers'
import { OPPORTUNITY_SEED, nowIso, uuid } from './seedOpportunities'
import {
  planSeedOperations,
  summarizeSeedOperations,
  type SeedPlanningResult,
} from './seedPlanningTemplate'
import {
  CLEANUP_SUCCESS_MESSAGE,
  planDuplicateCleanup,
  type CleanupDuplicatesPlan,
  type CleanupDuplicatesResult,
} from './cleanupDuplicates'
import { findExistingByName } from './duplicateUtils'
import { findExistingOpportunityByTitle } from './titleNormalization'
import { loadMockAdminCourses } from '@/lib/admin/courses/mockStore'
import {
  enrichOpportunitiesWithPublishedCourses,
  planSyncWithPublishedCourses,
  type SyncWithPublishedCoursesResult,
} from './syncWithPublishedCourses'
import {
  planWorkInEducationBankOperations,
  summarizeWorkInEducationBankOperations,
  WORK_IN_EDUCATION_SEED_MESSAGE,
  type WorkInEducationSeedSummary,
} from './seedWorkInEducationBank'
import { applyRecommendationOnlyBulkToOpportunity } from '@/lib/recommendations/bulkSetRecommendationOnly'
import {
  activateWorkInEducationCards,
  type ActivateWorkInEducationCardsSummary,
} from '@/lib/admin/opportunities/activateWorkInEducationCards'

export const OPPORTUNITY_STORAGE_KEY = 'jobaz_course_opportunities_v1'
export const OPPORTUNITY_UPDATED_EVENT = 'jobaz-course-opportunities-updated'

function emptyStore(): CourseOpportunityStore {
  return { version: 1, opportunities: [] }
}

function inputToOpportunity(input: CourseOpportunityInput, id?: string): CourseOpportunity {
  const oppId = id ?? uuid()
  const ts = nowIso()
  const providers = normalizePreferredProviders(input.providers)

  return {
    id: oppId,
    courseName: input.courseName.trim(),
    shortLabel: input.shortLabel.trim(),
    coursePurpose: input.coursePurpose.trim(),
    priority: input.priority ?? 50,
    opportunityStatus: input.opportunityStatus || 'Need provider',
    publishStatus: input.publishStatus || 'Not published',
    importance: input.importance.trim(),
    notes: input.notes.trim(),
    nextAction: input.nextAction.trim(),
    publishedCourseId: input.publishedCourseId ?? null,
    visibilityStatus: input.visibilityStatus ?? 'internal',
    educationFields: input.educationFields ?? [],
    specialisations: input.specialisations ?? [],
    commercialStatus: input.commercialStatus?.trim() ?? '',
    suggestedSearchKeywords: input.suggestedSearchKeywords?.trim() ?? '',
    adminNotes: input.adminNotes?.trim() ?? '',
    canBeCourseCard: input.canBeCourseCard ?? true,
    recommendationType: input.recommendationType?.trim() ?? '',
    createdAt: ts,
    updatedAt: ts,
    routes: input.routes.map((r) => ({
      id: uuid(),
      opportunityId: oppId,
      routeKey: r.routeKey,
      routeLabel: r.routeLabel,
    })),
    goals: (input.goals ?? []).map((g) => ({
      id: uuid(),
      opportunityId: oppId,
      goalKey: g.goalKey,
      goalLabel: g.goalLabel,
    })),
    providers: providers.map((p) => ({
      id: p.id ?? uuid(),
      opportunityId: oppId,
      providerName: p.providerName.trim(),
      providerStatus: p.providerStatus,
      affiliateStatus: p.affiliateStatus,
      officialUrl: p.officialUrl.trim(),
      referralUrl: p.referralUrl.trim(),
      dashboardUrl: p.dashboardUrl.trim(),
      commissionType: p.commissionType,
      commissionValue: p.commissionValue.trim(),
      publicOfferLabel: p.publicOfferLabel.trim(),
      trackingMethod: p.trackingMethod,
      notes: p.notes.trim(),
      isPreferred: p.isPreferred,
      createdAt: ts,
      updatedAt: ts,
    })),
  }
}

function saveStore(store: CourseOpportunityStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(OPPORTUNITY_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new Event(OPPORTUNITY_UPDATED_EVENT))
}

function normalizeOpportunity(opp: CourseOpportunity): CourseOpportunity {
  return {
    ...opp,
    goals: opp.goals ?? [],
    publishedCourseId: opp.publishedCourseId ?? null,
    visibilityStatus: opp.visibilityStatus ?? 'internal',
    educationFields: opp.educationFields ?? [],
    specialisations: opp.specialisations ?? [],
    commercialStatus: opp.commercialStatus ?? '',
    suggestedSearchKeywords: opp.suggestedSearchKeywords ?? '',
    adminNotes: opp.adminNotes ?? '',
    canBeCourseCard: opp.canBeCourseCard ?? true,
    recommendationType: opp.recommendationType ?? '',
  }
}

function readStore(): CourseOpportunityStore {
  if (typeof window === 'undefined') {
    return { version: 1, opportunities: OPPORTUNITY_SEED.map(normalizeOpportunity) }
  }

  try {
    const raw = localStorage.getItem(OPPORTUNITY_STORAGE_KEY)
    if (!raw) {
      const seeded = {
        version: 1 as const,
        opportunities: OPPORTUNITY_SEED.map(normalizeOpportunity),
      }
      localStorage.setItem(OPPORTUNITY_STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as CourseOpportunityStore
    if (!parsed?.opportunities?.length) {
      const seeded = {
        version: 1 as const,
        opportunities: OPPORTUNITY_SEED.map(normalizeOpportunity),
      }
      saveStore(seeded)
      return seeded
    }
    return {
      ...parsed,
      opportunities: parsed.opportunities.map(normalizeOpportunity),
    }
  } catch {
    return { version: 1, opportunities: OPPORTUNITY_SEED.map(normalizeOpportunity) }
  }
}

export function loadMockOpportunities(): CourseOpportunity[] {
  return readStore().opportunities
}

export function createMockOpportunity(input: CourseOpportunityInput): CourseOpportunity {
  const store = readStore()
  const existing = findExistingByName(store.opportunities, input.courseName)
  if (existing) {
    throw new Error(`An opportunity named "${existing.courseName}" already exists.`)
  }
  const created = inputToOpportunity(input)
  store.opportunities.unshift(created)
  saveStore(store)
  return created
}

export function updateMockOpportunity(id: string, input: CourseOpportunityInput): CourseOpportunity | null {
  const store = readStore()
  const index = store.opportunities.findIndex((o) => o.id === id)
  if (index < 0) return null

  const existing = store.opportunities[index]
  const updated = inputToOpportunity(input, id)
  updated.createdAt = existing.createdAt
  updated.updatedAt = nowIso()
  store.opportunities[index] = updated
  saveStore(store)
  return updated
}

export function deleteMockOpportunity(id: string): boolean {
  const store = readStore()
  const next = store.opportunities.filter((o) => o.id !== id)
  if (next.length === store.opportunities.length) return false
  saveStore({ ...store, opportunities: next })
  return true
}

export function bulkSetMockOpportunityVisibility(
  ids: string[],
  visibilityStatus: CourseOpportunity['visibilityStatus']
): number {
  const store = readStore()
  const idSet = new Set(ids)
  let count = 0
  for (let i = 0; i < store.opportunities.length; i += 1) {
    const opp = store.opportunities[i]
    if (!idSet.has(opp.id)) continue

    if (visibilityStatus === 'recommendation_only') {
      const next = applyRecommendationOnlyBulkToOpportunity(opp)
      if (!next) continue
      store.opportunities[i] = next
    } else {
      opp.visibilityStatus = visibilityStatus
      opp.updatedAt = nowIso()
      store.opportunities[i] = opp
    }
    count += 1
  }
  if (count > 0) saveStore(store)
  return count
}

export function markMockOpportunityPublished(id: string): CourseOpportunity | null {
  const store = readStore()
  const opp = store.opportunities.find((o) => o.id === id)
  if (!opp) return null
  opp.publishStatus = 'Published'
  opp.opportunityStatus = 'Published'
  opp.updatedAt = nowIso()
  saveStore(store)
  return opp
}

export function seedMockPlanningTemplate(): SeedPlanningResult {
  const store = readStore()
  let running = [...store.opportunities]
  const operations = planSeedOperations(running)
  const summary = summarizeSeedOperations(operations)

  for (const op of operations) {
    const existing = findExistingByName(running, op.input.courseName)

    if (existing) {
      const index = store.opportunities.findIndex((o) => o.id === existing.id)
      if (index < 0) continue
      const current = store.opportunities[index]
      const updated = inputToOpportunity(op.input, existing.id)
      updated.createdAt = current.createdAt
      updated.updatedAt = nowIso()
      store.opportunities[index] = updated
      running = [...store.opportunities]
      continue
    }

    const created = inputToOpportunity(op.input)
    store.opportunities.unshift(created)
    running = [...store.opportunities]
  }

  saveStore(store)
  return summary
}

export function seedMockWorkInEducationBank(): WorkInEducationSeedSummary {
  const store = readStore()
  let running = [...store.opportunities]
  const operations = planWorkInEducationBankOperations(running)
  const summary = summarizeWorkInEducationBankOperations(operations)

  for (const op of operations) {
    if (op.action === 'skip') continue

    const existing = findExistingOpportunityByTitle(running, op.input.courseName)

    if (existing) {
      const index = store.opportunities.findIndex((o) => o.id === existing.id)
      if (index < 0) continue
      const current = store.opportunities[index]
      const updated = inputToOpportunity(op.input, existing.id)
      updated.createdAt = current.createdAt
      updated.updatedAt = nowIso()
      store.opportunities[index] = updated
      running = [...store.opportunities]
      continue
    }

    const created = inputToOpportunity(op.input)
    store.opportunities.unshift(created)
    running = [...store.opportunities]
  }

  saveStore(store)
  return summary
}

export { WORK_IN_EDUCATION_SEED_MESSAGE }

export function activateMockWorkInEducationCards(): ActivateWorkInEducationCardsSummary {
  const store = readStore()
  const result = activateWorkInEducationCards(store.opportunities)
  saveStore({ ...store, opportunities: result.opportunities })
  return result.summary
}

export function previewMockDuplicateOpportunities(): CleanupDuplicatesPlan {
  const courses = loadMockAdminCourses()
  const enriched = enrichOpportunitiesWithPublishedCourses(loadMockOpportunities(), courses)
  const titleMap = new Map(courses.map((course) => [course.id, course.title]))
  return planDuplicateCleanup(enriched, titleMap)
}

export function cleanupMockDuplicateOpportunities(): CleanupDuplicatesResult {
  const store = readStore()
  const plan = previewMockDuplicateOpportunities()

  for (const op of plan.operations) {
    const index = store.opportunities.findIndex((o) => o.id === op.keeperId)
    if (index < 0) continue

    const keeper = store.opportunities[index]
    const updated = inputToOpportunity(op.input, op.keeperId)
    updated.createdAt = keeper.createdAt
    updated.updatedAt = nowIso()
    store.opportunities[index] = updated
  }

  if (plan.operations.length) {
    const deleteIds = new Set(plan.operations.flatMap((op) => op.deleteIds))
    store.opportunities = store.opportunities.filter((o) => !deleteIds.has(o.id))
  }

  saveStore(store)
  return plan.result
}

export function syncMockOpportunitiesWithPublishedCourses(): SyncWithPublishedCoursesResult {
  const courses = loadMockAdminCourses()
  const opportunities = loadMockOpportunities()
  const { updates, result } = planSyncWithPublishedCourses(opportunities, courses)
  for (const update of updates) {
    updateMockOpportunity(update.opportunityId, update.input)
  }
  return result
}

export { CLEANUP_SUCCESS_MESSAGE }
