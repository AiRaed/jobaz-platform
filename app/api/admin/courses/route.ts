import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  adminCourseInputToInsertRow,
  adminCourseInputToUpdateRow,
  courseRowToAdminCourse,
} from '@/lib/admin/courses/mappers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import type { AdminCourseInput } from '@/lib/admin/courses/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    courses: (data ?? []).map(courseRowToAdminCourse),
    source: 'supabase' as const,
  })
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

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

  const row = adminCourseInputToInsertRow(input)
  console.log('[Admin courses] POST save:', {
    title: row.title,
    status: row.status,
    show_in_career_hub: row.show_in_career_hub,
    appears_in_routes: row.appears_in_routes,
  })

  const { data, error } = await supabase
    .from('courses')
    .insert(row)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create course' }, { status: 500 })
  }

  return NextResponse.json({ course: courseRowToAdminCourse(data) }, { status: 201 })
}
