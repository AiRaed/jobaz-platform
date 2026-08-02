import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  assembleCourseOpportunity,
  opportunityInputToUpdateRow,
  normalizePreferredProviders,
  providerInputToInsertRow,
  routeInputToInsertRow,
  goalInputToInsertRow,
} from '@/lib/admin/opportunities/mappers'
import type { CourseOpportunityInput } from '@/lib/admin/opportunities/types'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

async function loadOpportunityById(
  supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>,
  id: string
) {
  const { data: row, error } = await supabase
    .from('course_opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!row) return null

  const [{ data: routeRows }, { data: goalRows }, { data: providerRows }] = await Promise.all([
    supabase.from('course_opportunity_routes').select('*').eq('opportunity_id', id),
    supabase.from('course_opportunity_goals').select('*').eq('opportunity_id', id),
    supabase.from('course_opportunity_providers').select('*').eq('opportunity_id', id),
  ])

  return assembleCourseOpportunity(row, routeRows ?? [], providerRows ?? [], goalRows ?? [])
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params

  let body: CourseOpportunityInput & { markPublished?: boolean }
  try {
    body = (await req.json()) as CourseOpportunityInput & { markPublished?: boolean }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.markPublished) {
    const { data, error } = await supabase
      .from('course_opportunities')
      .update({
        publish_status: 'Published',
        opportunity_status: 'Published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to update opportunity' }, { status: 500 })
    }

    const opportunity = await loadOpportunityById(supabase, id)
    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found after update' }, { status: 404 })
    }
    return NextResponse.json({ opportunity })
  }

  if (!body.courseName?.trim()) {
    return NextResponse.json({ error: 'Course name is required' }, { status: 400 })
  }

  const row = opportunityInputToUpdateRow(body)
  const { error } = await supabase.from('course_opportunities').update(row).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('course_opportunity_routes').delete().eq('opportunity_id', id)
  await supabase.from('course_opportunity_goals').delete().eq('opportunity_id', id)
  await supabase.from('course_opportunity_providers').delete().eq('opportunity_id', id)

  const providers = normalizePreferredProviders(body.providers ?? [])

  if (body.routes?.length) {
    const { error: routeErr } = await supabase
      .from('course_opportunity_routes')
      .insert(body.routes.map((r) => routeInputToInsertRow(id, r)))
    if (routeErr) {
      return NextResponse.json({ error: routeErr.message }, { status: 500 })
    }
  }

  if (body.goals?.length) {
    const { error: goalErr } = await supabase
      .from('course_opportunity_goals')
      .insert(body.goals.map((g) => goalInputToInsertRow(id, g)))
    if (goalErr) {
      return NextResponse.json({ error: goalErr.message }, { status: 500 })
    }
  }

  if (providers.length) {
    const { error: providerErr } = await supabase
      .from('course_opportunity_providers')
      .insert(providers.map((p) => providerInputToInsertRow(id, p)))
    if (providerErr) {
      return NextResponse.json({ error: providerErr.message }, { status: 500 })
    }
  }

  const opportunity = await loadOpportunityById(supabase, id)
  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found after update' }, { status: 404 })
  }

  return NextResponse.json({ opportunity })
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  const { error } = await supabase.from('course_opportunities').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
