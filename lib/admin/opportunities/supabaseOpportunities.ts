import type { SupabaseClient } from '@supabase/supabase-js'
import {
  assembleCourseOpportunity,
  goalInputToInsertRow,
  opportunityInputToUpdateRow,
  normalizePreferredProviders,
  providerInputToInsertRow,
  routeInputToInsertRow,
} from './mappers'
import type { CourseOpportunity, CourseOpportunityInput } from './types'

export async function loadAllCourseOpportunities(supabase: SupabaseClient) {
  const { data: rows, error } = await supabase
    .from('course_opportunities')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const ids = (rows ?? []).map((r) => r.id)
  if (!ids.length) return [] as CourseOpportunity[]

  const [
    { data: routeRows, error: routeErr },
    { data: goalRows, error: goalErr },
    { data: providerRows, error: providerErr },
  ] = await Promise.all([
    supabase.from('course_opportunity_routes').select('*').in('opportunity_id', ids),
    supabase.from('course_opportunity_goals').select('*').in('opportunity_id', ids),
    supabase.from('course_opportunity_providers').select('*').in('opportunity_id', ids),
  ])

  if (routeErr) throw new Error(routeErr.message)
  if (goalErr) throw new Error(goalErr.message)
  if (providerErr) throw new Error(providerErr.message)

  return (rows ?? []).map((row) =>
    assembleCourseOpportunity(row, routeRows ?? [], providerRows ?? [], goalRows ?? [])
  )
}

export async function replaceOpportunityNested(
  supabase: SupabaseClient,
  opportunityId: string,
  input: CourseOpportunityInput
) {
  await supabase.from('course_opportunity_routes').delete().eq('opportunity_id', opportunityId)
  await supabase.from('course_opportunity_goals').delete().eq('opportunity_id', opportunityId)
  await supabase.from('course_opportunity_providers').delete().eq('opportunity_id', opportunityId)

  const providers = normalizePreferredProviders(input.providers)

  if (input.routes.length) {
    const { error } = await supabase
      .from('course_opportunity_routes')
      .insert(input.routes.map((r) => routeInputToInsertRow(opportunityId, r)))
    if (error) throw new Error(error.message)
  }

  if (input.goals?.length) {
    const { error } = await supabase
      .from('course_opportunity_goals')
      .insert(input.goals.map((g) => goalInputToInsertRow(opportunityId, g)))
    if (error) throw new Error(error.message)
  }

  if (providers.length) {
    const { error } = await supabase
      .from('course_opportunity_providers')
      .insert(providers.map((p) => providerInputToInsertRow(opportunityId, p)))
    if (error) throw new Error(error.message)
  }
}

export async function updateOpportunityRecord(
  supabase: SupabaseClient,
  opportunityId: string,
  input: CourseOpportunityInput
) {
  const row = opportunityInputToUpdateRow(input)
  const { error } = await supabase.from('course_opportunities').update(row).eq('id', opportunityId)
  if (error) throw new Error(error.message)
  await replaceOpportunityNested(supabase, opportunityId, input)
}

export async function syncOpportunitiesWithPublishedCoursesServer(
  supabase: SupabaseClient
) {
  const { courseRowToAdminCourse } = await import('@/lib/admin/courses/mappers')
  const { planSyncWithPublishedCourses } = await import('./syncWithPublishedCourses')

  const [opportunities, coursesResult] = await Promise.all([
    loadAllCourseOpportunities(supabase),
    supabase.from('courses').select('*').eq('status', 'published'),
  ])

  if (coursesResult.error) throw new Error(coursesResult.error.message)

  const courses = (coursesResult.data ?? []).map(courseRowToAdminCourse)
  const { updates, result } = planSyncWithPublishedCourses(opportunities, courses)

  for (const update of updates) {
    await updateOpportunityRecord(supabase, update.opportunityId, update.input)
  }

  return result
}
