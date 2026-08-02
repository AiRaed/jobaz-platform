import type { SupabaseClient } from '@supabase/supabase-js'
import { courseRowToAdminCourse } from '@/lib/admin/courses/mappers'
import {
  commissionReportInputToInsertRow,
  commissionReportRowToReport,
  courseProviderInputToInsertRow,
  courseProviderInputToUpdateRow,
  providerRowToCourseProvider,
} from './mappers'
import { buildProviderDashboard, type CourseClickRow } from './metrics'
import { planProviderSeed } from './seedProviders'
import { planSyncFromPublishedCourses, type ProviderSyncResult } from './syncFromPublishedCourses'
import type {
  CourseProvider,
  CourseProviderInput,
  ProviderCommissionReportInput,
  ProviderDashboardData,
} from './types'

export async function loadAllProviders(
  supabase: SupabaseClient
): Promise<CourseProvider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(providerRowToCourseProvider)
}

export async function loadAllCommissionReports(
  supabase: SupabaseClient
): Promise<ReturnType<typeof commissionReportRowToReport>[]> {
  const { data, error } = await supabase
    .from('provider_commission_reports')
    .select('*')
    .order('report_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(commissionReportRowToReport)
}

export async function loadCourseClickRows(supabase: SupabaseClient): Promise<CourseClickRow[]> {
  const { data, error } = await supabase
    .from('course_clicks')
    .select('course_id, action')

  if (error) throw new Error(error.message)
  return (data ?? []) as CourseClickRow[]
}

export async function loadProviderDashboardData(
  supabase: SupabaseClient
): Promise<ProviderDashboardData> {
  const [providers, reports, clickRows, coursesResult] = await Promise.all([
    loadAllProviders(supabase),
    loadAllCommissionReports(supabase),
    loadCourseClickRows(supabase),
    supabase.from('courses').select('*').order('updated_at', { ascending: false }),
  ])

  if (coursesResult.error) throw new Error(coursesResult.error.message)
  const courses = (coursesResult.data ?? []).map(courseRowToAdminCourse)

  return buildProviderDashboard(providers, courses, clickRows, reports)
}

export async function insertProvider(
  supabase: SupabaseClient,
  input: CourseProviderInput
): Promise<CourseProvider> {
  const { data, error } = await supabase
    .from('providers')
    .insert(courseProviderInputToInsertRow(input))
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create provider')
  return providerRowToCourseProvider(data)
}

export async function updateProvider(
  supabase: SupabaseClient,
  id: string,
  input: CourseProviderInput
): Promise<CourseProvider> {
  const { data, error } = await supabase
    .from('providers')
    .update(courseProviderInputToUpdateRow(input))
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update provider')
  return providerRowToCourseProvider(data)
}

export async function deleteProvider(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('providers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function insertCommissionReport(
  supabase: SupabaseClient,
  input: ProviderCommissionReportInput
) {
  const { data, error } = await supabase
    .from('provider_commission_reports')
    .insert(commissionReportInputToInsertRow(input))
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create report')
  return commissionReportRowToReport(data)
}

export async function syncProvidersFromPublishedCourses(
  supabase: SupabaseClient
): Promise<ProviderSyncResult> {
  const coursesResult = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  if (coursesResult.error) throw new Error(coursesResult.error.message)

  const courses = (coursesResult.data ?? []).map(courseRowToAdminCourse)
  const existing = await loadAllProviders(supabase)
  const { toCreate, reused, providerNames } = planSyncFromPublishedCourses(courses, existing)

  for (const input of toCreate) {
    await insertProvider(supabase, input)
  }

  return { created: toCreate.length, reused, providerNames }
}

export async function seedProvidersIfMissing(supabase: SupabaseClient): Promise<{
  created: number
  skipped: number
}> {
  const existing = await loadAllProviders(supabase)
  const existingSlugs = new Set(existing.map((p) => p.slug))
  const { toCreate, skipped } = planProviderSeed(existingSlugs)

  for (const input of toCreate) {
    await insertProvider(supabase, input)
  }

  return { created: toCreate.length, skipped }
}
