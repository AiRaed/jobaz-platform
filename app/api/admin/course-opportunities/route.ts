import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { findExistingByName } from '@/lib/admin/opportunities/duplicateUtils'
import {
  opportunityInputToInsertRow,
  normalizePreferredProviders,
  providerInputToInsertRow,
  routeInputToInsertRow,
  goalInputToInsertRow,
} from '@/lib/admin/opportunities/mappers'
import type { CourseOpportunityInput } from '@/lib/admin/opportunities/types'
import { loadAllCourseOpportunities } from '@/lib/admin/opportunities/supabaseOpportunities'
import { enrichOpportunitiesWithPublishedCourses } from '@/lib/admin/opportunities/syncWithPublishedCourses'
import { courseRowToAdminCourse } from '@/lib/admin/courses/mappers'

export const dynamic = 'force-dynamic'

async function insertNested(
  supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>,
  opportunityId: string,
  input: CourseOpportunityInput
) {
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

export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const [opportunities, coursesResult] = await Promise.all([
      loadAllCourseOpportunities(supabase),
      supabase.from('courses').select('*').eq('status', 'published'),
    ])
    const courses = (coursesResult.data ?? []).map(courseRowToAdminCourse)
    const enriched = enrichOpportunitiesWithPublishedCourses(opportunities, courses)
    return NextResponse.json({ opportunities: enriched, source: 'supabase' as const })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load opportunities' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  let input: CourseOpportunityInput
  try {
    input = (await req.json()) as CourseOpportunityInput
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!input.courseName?.trim()) {
    return NextResponse.json({ error: 'Course name is required' }, { status: 400 })
  }

  const existing = await loadAllCourseOpportunities(supabase)
  const duplicate = findExistingByName(existing, input.courseName)
  if (duplicate) {
    return NextResponse.json(
      {
        error: `An opportunity named "${duplicate.courseName}" already exists. Edit the existing row instead.`,
      },
      { status: 409 }
    )
  }

  const row = opportunityInputToInsertRow(input)
  const { data, error } = await supabase
    .from('course_opportunities')
    .insert(row)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create opportunity' }, { status: 500 })
  }

  try {
    await insertNested(supabase, data.id, input)
  } catch (nestedErr) {
    await supabase.from('course_opportunities').delete().eq('id', data.id)
    return NextResponse.json(
      { error: nestedErr instanceof Error ? nestedErr.message : 'Failed to save routes/providers' },
      { status: 500 }
    )
  }

  const opportunities = await loadAllCourseOpportunities(supabase)
  const opportunity = opportunities.find((o) => o.id === data.id)
  if (!opportunity) {
    return NextResponse.json({ error: 'Created but could not reload opportunity' }, { status: 500 })
  }

  return NextResponse.json({ opportunity }, { status: 201 })
}
