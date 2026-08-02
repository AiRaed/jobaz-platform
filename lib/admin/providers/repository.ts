import { loadMockAdminCourses } from '@/lib/admin/courses/mockStore'
import { isSupabaseCoursesConfigured } from '@/lib/admin/courses/repository'
import { buildProviderDashboard } from './metrics'
import {
  createMockCommissionReport,
  createMockProvider,
  deleteMockProvider,
  loadMockCommissionReports,
  loadMockProviders,
  seedMockProviders,
  syncMockProvidersFromPublishedCourses,
  updateMockProvider,
} from './mockStore'
import type {
  CourseProvider,
  CourseProviderInput,
  ProviderCommissionReport,
  ProviderCommissionReportInput,
  ProviderDashboardData,
} from './types'
import type { ProviderSyncResult } from './syncFromPublishedCourses'

export type ProviderDataSource = 'supabase' | 'mock'

export type ProviderRepoResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error || res.statusText || 'Request failed'
  } catch {
    return res.statusText || 'Request failed'
  }
}

function buildMockDashboard(): ProviderDashboardData {
  const providers = loadMockProviders()
  const reports = loadMockCommissionReports()
  const courses = loadMockAdminCourses()
  const clickRows = courses.flatMap((c) =>
    Array.from({ length: c.clicks }, () => ({
      course_id: c.id,
      action: 'apply_now' as const,
    }))
  )
  return buildProviderDashboard(providers, courses, clickRows, reports)
}

export async function fetchProviderDashboard(): Promise<
  ProviderRepoResult<{ dashboard: ProviderDashboardData; source: ProviderDataSource }>
> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: { dashboard: buildMockDashboard(), source: 'mock' } }
  }

  try {
    const res = await fetch('/api/admin/providers/dashboard', { cache: 'no-store' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as ProviderDashboardData & { source: ProviderDataSource }
    const { source, ...dashboard } = body
    return { ok: true, data: { dashboard, source: source ?? 'supabase' } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to load providers dashboard',
    }
  }
}

export async function createProviderRecord(
  input: CourseProviderInput
): Promise<ProviderRepoResult<CourseProvider>> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: createMockProvider(input) }
  }

  try {
    const res = await fetch('/api/admin/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { provider: CourseProvider }
    return { ok: true, data: body.provider }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create provider' }
  }
}

export async function updateProviderRecord(
  id: string,
  input: CourseProviderInput
): Promise<ProviderRepoResult<CourseProvider>> {
  if (!isSupabaseCoursesConfigured()) {
    const updated = updateMockProvider(id, input)
    if (!updated) return { ok: false, error: 'Provider not found' }
    return { ok: true, data: updated }
  }

  try {
    const res = await fetch(`/api/admin/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { provider: CourseProvider }
    return { ok: true, data: body.provider }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update provider' }
  }
}

export async function deleteProviderRecord(id: string): Promise<ProviderRepoResult<null>> {
  if (!isSupabaseCoursesConfigured()) {
    if (!deleteMockProvider(id)) return { ok: false, error: 'Provider not found' }
    return { ok: true, data: null }
  }

  try {
    const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete provider' }
  }
}

export async function seedProviderRecords(): Promise<
  ProviderRepoResult<{ created: number; skipped: number }>
> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: seedMockProviders() }
  }

  try {
    const res = await fetch('/api/admin/providers/seed', { method: 'POST' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { created: number; skipped: number }
    return { ok: true, data: body }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to seed providers' }
  }
}

export async function syncProvidersFromPublishedCourses(): Promise<
  ProviderRepoResult<ProviderSyncResult>
> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: syncMockProvidersFromPublishedCourses() }
  }

  try {
    const res = await fetch('/api/admin/providers/sync', { method: 'POST' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as ProviderSyncResult
    return { ok: true, data: body }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to sync providers',
    }
  }
}

export async function createProviderFromCourseName(
  providerName: string
): Promise<ProviderRepoResult<CourseProvider>> {
  const { buildProviderInputFromPublishedName } = await import('./syncFromPublishedCourses')
  return createProviderRecord(buildProviderInputFromPublishedName(providerName))
}

export async function createCommissionReportRecord(
  input: ProviderCommissionReportInput
): Promise<ProviderRepoResult<ProviderCommissionReport>> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: createMockCommissionReport(input) }
  }

  try {
    const res = await fetch('/api/admin/providers/commission-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { report: ProviderCommissionReport }
    return { ok: true, data: body.report }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create commission report',
    }
  }
}
