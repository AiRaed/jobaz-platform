import { NextResponse } from 'next/server'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'
import { buildStartNewCareerLibraryResult } from '@/lib/career-engine/start-new-career/library'
import {
  loadServerOpportunityPool,
  loadServerPublishedCourses,
} from '@/lib/recommendations/opportunityPool'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.', code: 'bad_json' }, { status: 400 })
  }

  const workTypeId = typeof body.work_type_id === 'string' ? body.work_type_id.trim() : ''
  const routeId = typeof body.route_id === 'string' ? body.route_id.trim() : ''

  if (!workTypeId || !routeId) {
    return NextResponse.json(
      { error: 'Please select a work type and career route.', code: 'missing_selection' },
      { status: 400 }
    )
  }

  let opportunities: Awaited<ReturnType<typeof loadServerOpportunityPool>> = []
  let publishedCourses: Awaited<ReturnType<typeof loadServerPublishedCourses>> = []
  try {
    ;[opportunities, publishedCourses] = await Promise.all([
      loadServerOpportunityPool(),
      loadServerPublishedCourses(),
    ])
  } catch (err) {
    console.warn('[start-new-career/match] opportunity pool load failed', err)
  }

  const result = buildStartNewCareerLibraryResult({
    work_type_id: workTypeId,
    route_id: routeId,
    opportunities,
    publishedCourses,
  })

  if (!result) {
    return NextResponse.json(
      { error: 'Could not match that Start New Career route.', code: 'no_match' },
      { status: 404 }
    )
  }

  void trackJazEventServer({
    event_type: 'career_plan_generated',
    event_source: 'profession_library_start_new_career',
    goal_path: 'start_new_career',
    page_path: '/career-engine/start-new-career',
    route_title: result.route_label,
    metadata: {
      selected_work_type: result.work_type_id,
      selected_career_route: result.route_id,
      mapped_profession_field: result.mapped_field_slug,
      mapped_specialism: result.mapped_specialism_slug,
      recommended_entry_course_count: result.recommended_entry_course_count,
      recommended_upgrade_course_count: result.recommended_upgrade_course_count,
      possible_job_count: result.possible_job_count,
      missing_provider_count: result.missing_provider_count,
      result_source: 'profession_library_start_new_career',
    },
  })

  return NextResponse.json({ result })
}
