import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { courseRowToAdminCourse } from '@/lib/admin/courses/mappers'
import {
  CLEANUP_SUCCESS_MESSAGE,
  planDuplicateCleanup,
  type CleanupDuplicatesPlan,
} from '@/lib/admin/opportunities/cleanupDuplicates'
import {
  loadAllCourseOpportunities,
  updateOpportunityRecord,
} from '@/lib/admin/opportunities/supabaseOpportunities'
import { enrichOpportunitiesWithPublishedCourses } from '@/lib/admin/opportunities/syncWithPublishedCourses'
import { findDuplicatePublishedLinks } from '@/lib/admin/opportunities/query'

export const dynamic = 'force-dynamic'

async function loadEnrichedOpportunities(
  supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>
) {
  const [opportunities, coursesResult] = await Promise.all([
    loadAllCourseOpportunities(supabase),
    supabase.from('courses').select('*').eq('status', 'published'),
  ])
  const courses = (coursesResult.data ?? []).map(courseRowToAdminCourse)
  return enrichOpportunitiesWithPublishedCourses(opportunities, courses)
}

function publishedCourseTitleMap(
  courses: ReturnType<typeof courseRowToAdminCourse>[]
): Map<string, string> {
  return new Map(courses.map((course) => [course.id, course.title]))
}

async function buildCleanupPlan(
  supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>
): Promise<{ plan: CleanupDuplicatesPlan; enriched: Awaited<ReturnType<typeof loadEnrichedOpportunities>> }> {
  const enriched = await loadEnrichedOpportunities(supabase)
  const coursesResult = await supabase.from('courses').select('*').eq('status', 'published')
  const courses = (coursesResult.data ?? []).map(courseRowToAdminCourse)
  const plan = planDuplicateCleanup(enriched, publishedCourseTitleMap(courses))
  return { plan, enriched }
}

async function executeCleanupPlan(
  supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>,
  plan: CleanupDuplicatesPlan
) {
  for (const op of plan.operations) {
    await updateOpportunityRecord(supabase, op.keeperId, op.input)

    if (op.deleteIds.length) {
      const { error } = await supabase
        .from('course_opportunities')
        .delete()
        .in('id', op.deleteIds)

      if (error) throw new Error(error.message)
    }
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
    const { plan, enriched } = await buildCleanupPlan(supabase)
    const remainingDuplicateLinks = findDuplicatePublishedLinks(enriched).length

    return NextResponse.json({
      ok: true,
      dryRun: true,
      plan,
      summary: plan.result,
      total: enriched.length,
      remainingDuplicatePublishedLinks: remainingDuplicateLinks,
      remainingDuplicatePublishedLinksAfterCleanup: plan.remainingDuplicatePublishedLinksAfterCleanup,
      message:
        plan.operations.length > 0
          ? `${plan.result.removedDuplicates} duplicate row(s) across ${plan.result.mergedGroups} group(s) will be merged. Published courses are never deleted — one linked opportunity keeper is preserved per published course.`
          : 'No duplicate opportunities found.',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to preview duplicate cleanup' },
      { status: 500 }
    )
  }
}

export async function POST() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const { plan } = await buildCleanupPlan(supabase)

    if (!plan.operations.length) {
      const enriched = await loadEnrichedOpportunities(supabase)
      return NextResponse.json({
        ok: true,
        plan,
        summary: plan.result,
        total: enriched.length,
        opportunities: enriched,
        remainingDuplicatePublishedLinks: findDuplicatePublishedLinks(enriched).length,
        message: 'No duplicate opportunities found.',
      })
    }

    await executeCleanupPlan(supabase, plan)
    const enriched = await loadEnrichedOpportunities(supabase)

    return NextResponse.json({
      ok: true,
      plan,
      summary: plan.result,
      total: enriched.length,
      opportunities: enriched,
      remainingDuplicatePublishedLinks: findDuplicatePublishedLinks(enriched).length,
      message: CLEANUP_SUCCESS_MESSAGE,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to clean duplicate opportunities' },
      { status: 500 }
    )
  }
}
