import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  adminCourseInputToUpdateRow,
  courseRowToAdminCourse,
} from '@/lib/admin/courses/mappers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import type { AdminCourseInput } from '@/lib/admin/courses/types'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  let input: AdminCourseInput
  try {
    input = (await req.json()) as AdminCourseInput
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!input.title?.trim()) {
    return NextResponse.json({ error: 'Course title is required' }, { status: 400 })
  }
  if (!input.routeIds?.length) {
    return NextResponse.json({ error: 'At least one route is required' }, { status: 400 })
  }

  const row = adminCourseInputToUpdateRow(input)
  console.log('[Admin courses] PATCH save:', {
    id,
    title: row.title,
    status: row.status,
    show_in_career_hub: row.show_in_career_hub,
    appears_in_routes: row.appears_in_routes,
  })

  const { data, error } = await supabase
    .from('courses')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to update course' }, { status: 500 })
  }

  return NextResponse.json({ course: courseRowToAdminCourse(data) })
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  const { error } = await supabase.from('courses').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
