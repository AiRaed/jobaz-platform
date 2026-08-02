import {
  createMockOpportunity,
  cleanupMockDuplicateOpportunities,
  deleteMockOpportunity,
  bulkSetMockOpportunityVisibility,
  activateMockWorkInEducationCards,
  loadMockOpportunities,
  markMockOpportunityPublished,
  previewMockDuplicateOpportunities,
  seedMockPlanningTemplate,
  seedMockWorkInEducationBank,
  WORK_IN_EDUCATION_SEED_MESSAGE,
  updateMockOpportunity,
  CLEANUP_SUCCESS_MESSAGE,
} from './mockStore'
import type { CourseOpportunity, CourseOpportunityInput } from './types'
import { isSupabaseCoursesConfigured } from '@/lib/admin/courses/repository'
import { loadMockAdminCourses } from '@/lib/admin/courses/mockStore'
import { enrichOpportunitiesWithPublishedCourses } from './syncWithPublishedCourses'
import type { SyncWithPublishedCoursesResult } from './syncWithPublishedCourses'
import type { SeedPlanningResult } from './seedPlanningTemplate'
import type { WorkInEducationSeedSummary } from './seedWorkInEducationBank'
import type { ActivateWorkInEducationCardsSummary } from './activateWorkInEducationCards'
import type { CleanupDuplicatesResult, CleanupDuplicatesPlan } from './cleanupDuplicates'
import { findDuplicatePublishedLinks } from './query'

export type OpportunityDataSource = 'supabase' | 'mock'

export type OpportunityRepoResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error || res.statusText || 'Request failed'
  } catch {
    return res.statusText || 'Request failed'
  }
}

export async function fetchCourseOpportunities(): Promise<
  OpportunityRepoResult<{ opportunities: CourseOpportunity[]; source: OpportunityDataSource }>
> {
  if (!isSupabaseCoursesConfigured()) {
    const courses = loadMockAdminCourses()
    const opportunities = enrichOpportunitiesWithPublishedCourses(
      loadMockOpportunities(),
      courses
    )
    return { ok: true, data: { opportunities, source: 'mock' } }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities', { cache: 'no-store' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { opportunities: CourseOpportunity[] }
    return { ok: true, data: { opportunities: body.opportunities ?? [], source: 'supabase' } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to load opportunities',
    }
  }
}

export async function createCourseOpportunityRecord(
  input: CourseOpportunityInput
): Promise<OpportunityRepoResult<CourseOpportunity>> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: createMockOpportunity(input) }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { opportunity: CourseOpportunity }
    return { ok: true, data: body.opportunity }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create opportunity',
    }
  }
}

export async function updateCourseOpportunityRecord(
  id: string,
  input: CourseOpportunityInput
): Promise<OpportunityRepoResult<CourseOpportunity>> {
  if (!isSupabaseCoursesConfigured()) {
    const updated = updateMockOpportunity(id, input)
    if (!updated) return { ok: false, error: 'Opportunity not found' }
    return { ok: true, data: updated }
  }

  try {
    const res = await fetch(`/api/admin/course-opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { opportunity: CourseOpportunity }
    return { ok: true, data: body.opportunity }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update opportunity',
    }
  }
}

export async function deleteCourseOpportunityRecord(id: string): Promise<OpportunityRepoResult<true>> {
  if (!isSupabaseCoursesConfigured()) {
    const ok = deleteMockOpportunity(id)
    if (!ok) return { ok: false, error: 'Opportunity not found' }
    return { ok: true, data: true }
  }

  try {
    const res = await fetch(`/api/admin/course-opportunities/${id}`, { method: 'DELETE' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    return { ok: true, data: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to delete opportunity',
    }
  }
}

export async function markCourseOpportunityPublished(
  id: string
): Promise<OpportunityRepoResult<CourseOpportunity>> {
  if (!isSupabaseCoursesConfigured()) {
    const updated = markMockOpportunityPublished(id)
    if (!updated) return { ok: false, error: 'Opportunity not found' }
    return { ok: true, data: updated }
  }

  try {
    const res = await fetch(`/api/admin/course-opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markPublished: true,
      }),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { opportunity: CourseOpportunity }
    return { ok: true, data: body.opportunity }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to mark published',
    }
  }
}

export async function syncCourseOpportunitiesWithPublished(): Promise<
  OpportunityRepoResult<SyncWithPublishedCoursesResult & { message: string }>
> {
  if (!isSupabaseCoursesConfigured()) {
    const { planSyncWithPublishedCourses } = await import('./syncWithPublishedCourses')
    const courses = loadMockAdminCourses()
    const opportunities = loadMockOpportunities()
    const { updates, result } = planSyncWithPublishedCourses(opportunities, courses)
    for (const update of updates) {
      updateMockOpportunity(update.opportunityId, update.input)
    }
    return {
      ok: true,
      data: {
        ...result,
        message: `Synced ${result.synced} opportunities with published courses`,
      },
    }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities/sync', { method: 'POST' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as SyncWithPublishedCoursesResult & { message: string }
    return { ok: true, data: body }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to sync with published courses',
    }
  }
}

export type SeedPlanningTemplateResult = {
  summary: SeedPlanningResult
  message: string
}

export async function seedCourseOpportunityPlanningTemplate(): Promise<
  OpportunityRepoResult<SeedPlanningTemplateResult>
> {
  if (!isSupabaseCoursesConfigured()) {
    const summary = seedMockPlanningTemplate()
    return {
      ok: true,
      data: {
        summary,
        message:
          'Starter planning template imported. Duplicates were skipped and route links were updated.',
      },
    }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities/seed', { method: 'POST' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as {
      summary: SeedPlanningResult
      message: string
    }
    return {
      ok: true,
      data: {
        summary: body.summary,
        message:
          body.message ??
          'Starter planning template imported. Duplicates were skipped and route links were updated.',
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to import planning template',
    }
  }
}

export type SeedWorkInEducationBankResult = {
  summary: WorkInEducationSeedSummary
  message: string
}

export async function seedWorkInEducationOpportunityBank(): Promise<
  OpportunityRepoResult<SeedWorkInEducationBankResult>
> {
  if (!isSupabaseCoursesConfigured()) {
    const summary = seedMockWorkInEducationBank()
    return {
      ok: true,
      data: {
        summary,
        message: WORK_IN_EDUCATION_SEED_MESSAGE,
      },
    }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities/seed-education-bank', { method: 'POST' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as {
      summary: WorkInEducationSeedSummary
      message: string
    }
    return {
      ok: true,
      data: {
        summary: body.summary,
        message: body.message ?? WORK_IN_EDUCATION_SEED_MESSAGE,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to import Work in my Education bank',
    }
  }
}

export type CleanupDuplicatesPreviewResult = {
  plan: CleanupDuplicatesPlan
  summary: CleanupDuplicatesResult
  message: string
  total: number
  remainingDuplicatePublishedLinks: number
}

export type CleanupDuplicatesTemplateResult = {
  plan: CleanupDuplicatesPlan
  summary: CleanupDuplicatesResult
  message: string
  total: number
  opportunities: CourseOpportunity[]
  remainingDuplicatePublishedLinks: number
}

export async function previewCourseOpportunityDuplicateCleanup(): Promise<
  OpportunityRepoResult<CleanupDuplicatesPreviewResult>
> {
  if (!isSupabaseCoursesConfigured()) {
    const courses = loadMockAdminCourses()
    const plan = previewMockDuplicateOpportunities()
    const enriched = enrichOpportunitiesWithPublishedCourses(loadMockOpportunities(), courses)
    return {
      ok: true,
      data: {
        plan,
        summary: plan.result,
        total: enriched.length,
        remainingDuplicatePublishedLinks: findDuplicatePublishedLinks(enriched).length,
        message:
          plan.operations.length > 0
            ? `${plan.result.removedDuplicates} duplicate row(s) across ${plan.result.mergedGroups} group(s) will be merged. Published courses are never deleted — one linked opportunity keeper is preserved per published course.`
            : 'No duplicate opportunities found.',
      },
    }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities/cleanup', { method: 'GET' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as {
      plan: CleanupDuplicatesPlan
      summary: CleanupDuplicatesResult
      message: string
      total: number
      remainingDuplicatePublishedLinks: number
    }
    return {
      ok: true,
      data: {
        plan: body.plan,
        summary: body.summary,
        total: body.total,
        remainingDuplicatePublishedLinks: body.remainingDuplicatePublishedLinks ?? 0,
        message: body.message ?? 'No duplicate opportunities found.',
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to preview duplicate cleanup',
    }
  }
}

export async function cleanupCourseOpportunityDuplicates(): Promise<
  OpportunityRepoResult<CleanupDuplicatesTemplateResult>
> {
  if (!isSupabaseCoursesConfigured()) {
    const plan = previewMockDuplicateOpportunities()
    const summary = cleanupMockDuplicateOpportunities()
    const courses = loadMockAdminCourses()
    const opportunities = enrichOpportunitiesWithPublishedCourses(loadMockOpportunities(), courses)
    return {
      ok: true,
      data: {
        plan,
        summary,
        total: opportunities.length,
        opportunities,
        remainingDuplicatePublishedLinks: findDuplicatePublishedLinks(opportunities).length,
        message:
          summary.removedDuplicates > 0
            ? CLEANUP_SUCCESS_MESSAGE
            : 'No duplicate opportunities found.',
      },
    }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities/cleanup', { method: 'POST' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as {
      plan: CleanupDuplicatesPlan
      summary: CleanupDuplicatesResult
      message: string
      total: number
      opportunities: CourseOpportunity[]
      remainingDuplicatePublishedLinks: number
    }
    return {
      ok: true,
      data: {
        plan: body.plan,
        summary: body.summary,
        total: body.total,
        opportunities: body.opportunities ?? [],
        remainingDuplicatePublishedLinks: body.remainingDuplicatePublishedLinks ?? 0,
        message: body.message ?? CLEANUP_SUCCESS_MESSAGE,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to clean duplicate opportunities',
    }
  }
}

export async function bulkSetCourseOpportunityVisibility(
  ids: string[],
  visibilityStatus: 'internal' | 'recommendation_only' | 'public_listed'
): Promise<OpportunityRepoResult<{ updated: number }>> {
  if (!ids.length) return { ok: true, data: { updated: 0 } }

  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: { updated: bulkSetMockOpportunityVisibility(ids, visibilityStatus) } }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities/bulk-visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, visibilityStatus }),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { updated: number }
    return { ok: true, data: { updated: body.updated ?? 0 } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update visibility',
    }
  }
}

export type ActivateEducationCardsResult = {
  summary: ActivateWorkInEducationCardsSummary
  message: string
  opportunities?: CourseOpportunity[]
}

export async function activateWorkInEducationRecommendationCards(): Promise<
  OpportunityRepoResult<ActivateEducationCardsResult>
> {
  if (!isSupabaseCoursesConfigured()) {
    const summary = activateMockWorkInEducationCards()
    const courses = loadMockAdminCourses()
    const opportunities = enrichOpportunitiesWithPublishedCourses(loadMockOpportunities(), courses)
    const { formatActivateEducationCardsMessage } = await import('./activateWorkInEducationCards')
    return {
      ok: true,
      data: {
        summary,
        message: formatActivateEducationCardsMessage(summary),
        opportunities,
      },
    }
  }

  try {
    const res = await fetch('/api/admin/course-opportunities/activate-education-cards', {
      method: 'POST',
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as {
      summary: ActivateWorkInEducationCardsSummary
      message: string
      opportunities?: CourseOpportunity[]
    }
    return {
      ok: true,
      data: {
        summary: body.summary,
        message: body.message,
        opportunities: body.opportunities,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to activate recommendation cards',
    }
  }
}
