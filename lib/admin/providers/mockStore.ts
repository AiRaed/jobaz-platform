import type {
  CourseProvider,
  CourseProviderInput,
  ProviderCommissionReport,
  ProviderCommissionReportInput,
} from './types'
import { PROVIDER_SEED_DATA } from './seedProviders'
import { planSyncFromPublishedCourses, type ProviderSyncResult } from './syncFromPublishedCourses'
import { loadMockAdminCourses } from '@/lib/admin/courses/mockStore'

const PROVIDERS_KEY = 'jobaz_admin_providers_v1'
const REPORTS_KEY = 'jobaz_admin_provider_reports_v1'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function seedIfEmpty(): CourseProvider[] {
  return readJson<CourseProvider[]>(PROVIDERS_KEY, [])
}

export function loadMockProviders(): CourseProvider[] {
  return seedIfEmpty()
}

export function loadMockCommissionReports(): ProviderCommissionReport[] {
  return readJson<ProviderCommissionReport[]>(REPORTS_KEY, [])
}

export function createMockProvider(input: CourseProviderInput): CourseProvider {
  const providers = loadMockProviders()
  const provider: CourseProvider = {
    ...input,
    id: uuid(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  writeJson(PROVIDERS_KEY, [provider, ...providers])
  return provider
}

export function updateMockProvider(id: string, input: CourseProviderInput): CourseProvider | null {
  const providers = loadMockProviders()
  const index = providers.findIndex((p) => p.id === id)
  if (index < 0) return null
  const updated: CourseProvider = {
    ...input,
    id,
    createdAt: providers[index].createdAt,
    updatedAt: nowIso(),
  }
  providers[index] = updated
  writeJson(PROVIDERS_KEY, providers)
  return updated
}

export function deleteMockProvider(id: string): boolean {
  const providers = loadMockProviders().filter((p) => p.id !== id)
  if (providers.length === loadMockProviders().length) return false
  writeJson(PROVIDERS_KEY, providers)
  const reports = loadMockCommissionReports().filter((r) => r.providerId !== id)
  writeJson(REPORTS_KEY, reports)
  return true
}

export function seedMockProviders(): { created: number; skipped: number } {
  const providers = loadMockProviders()
  const existingSlugs = new Set(providers.map((p) => p.slug))
  let created = 0

  for (const input of PROVIDER_SEED_DATA) {
    if (existingSlugs.has(input.slug)) continue
    createMockProvider(input)
    created += 1
  }

  return { created, skipped: PROVIDER_SEED_DATA.length - created }
}

export function syncMockProvidersFromPublishedCourses(): ProviderSyncResult {
  const courses = loadMockAdminCourses()
  const existing = loadMockProviders()
  const { toCreate, reused, providerNames } = planSyncFromPublishedCourses(courses, existing)

  for (const input of toCreate) {
    createMockProvider(input)
  }

  return { created: toCreate.length, reused, providerNames }
}

export function createMockCommissionReport(
  input: ProviderCommissionReportInput
): ProviderCommissionReport {
  const reports = loadMockCommissionReports()
  const report: ProviderCommissionReport = {
    ...input,
    id: uuid(),
    createdAt: nowIso(),
  }
  writeJson(REPORTS_KEY, [report, ...reports])
  return report
}

export function updateMockCommissionReport(
  id: string,
  input: ProviderCommissionReportInput
): ProviderCommissionReport | null {
  const reports = loadMockCommissionReports()
  const index = reports.findIndex((r) => r.id === id)
  if (index < 0) return null
  const updated: ProviderCommissionReport = {
    ...input,
    id,
    createdAt: reports[index].createdAt,
  }
  reports[index] = updated
  writeJson(REPORTS_KEY, reports)
  return updated
}
