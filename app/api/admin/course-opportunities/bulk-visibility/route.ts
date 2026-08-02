import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { assembleCourseOpportunity } from '@/lib/admin/opportunities/mappers'
import { buildRecommendationOnlyBulkPatch } from '@/lib/recommendations/bulkSetRecommendationOnly'

export const dynamic = 'force-dynamic'

type Body = {
  ids?: string[]
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const ids = (body.ids ?? []).filter(Boolean)
  if (!ids.length) {
    return NextResponse.json({ updated: 0 })
  }

  const { data: rows, error: loadErr } = await supabase
    .from('course_opportunities')
    .select('*')
    .in('id', ids)

  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 500 })
  }

  let updated = 0
  for (const row of rows ?? []) {
    const [{ data: routeRows }, { data: goalRows }, { data: providerRows }] = await Promise.all([
      supabase.from('course_opportunity_routes').select('*').eq('opportunity_id', row.id),
      supabase.from('course_opportunity_goals').select('*').eq('opportunity_id', row.id),
      supabase.from('course_opportunity_providers').select('*').eq('opportunity_id', row.id),
    ])

    const opp = assembleCourseOpportunity(row, routeRows ?? [], providerRows ?? [], goalRows ?? [])
    if (opp.publishedCourseId) continue

    const patch = buildRecommendationOnlyBulkPatch(opp)

    const { error } = await supabase
      .from('course_opportunities')
      .update({
        visibility_status: patch.visibility_status,
        publish_status: patch.publish_status,
        can_be_course_card: patch.can_be_course_card,
        commercial_status: patch.commercial_status,
        updated_at: patch.updated_at,
      })
      .eq('id', row.id)

    if (!error) updated += 1
  }

  return NextResponse.json({ updated })
}
