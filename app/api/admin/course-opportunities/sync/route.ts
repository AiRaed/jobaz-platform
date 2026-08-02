import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  loadAllCourseOpportunities,
  syncOpportunitiesWithPublishedCoursesServer,
} from '@/lib/admin/opportunities/supabaseOpportunities'
import { enrichOpportunitiesWithPublishedCourses } from '@/lib/admin/opportunities/syncWithPublishedCourses'
import { courseRowToAdminCourse } from '@/lib/admin/courses/mappers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const result = await syncOpportunitiesWithPublishedCoursesServer(supabase)
    const [opportunities, coursesResult] = await Promise.all([
      loadAllCourseOpportunities(supabase),
      supabase.from('courses').select('*').eq('status', 'published'),
    ])
    const courses = (coursesResult.data ?? []).map(courseRowToAdminCourse)
    const enriched = enrichOpportunitiesWithPublishedCourses(opportunities, courses)

    return NextResponse.json({
      ...result,
      opportunities: enriched,
      message: `Synced ${result.synced} opportunities with published courses`,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to sync with published courses' },
      { status: 500 }
    )
  }
}
