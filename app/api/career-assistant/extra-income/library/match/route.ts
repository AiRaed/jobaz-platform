import { NextResponse } from 'next/server'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'
import { buildExtraIncomeLibraryResult } from '@/lib/career-engine/extra-income/library'
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

  const categoryId = typeof body.category_id === 'string' ? body.category_id.trim() : ''
  const optionId = typeof body.option_id === 'string' ? body.option_id.trim() : ''

  if (!categoryId || !optionId) {
    return NextResponse.json(
      { error: 'Please select a category and option.', code: 'missing_selection' },
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
    console.warn('[extra-income/match] opportunity pool load failed', err)
  }

  const result = buildExtraIncomeLibraryResult({
    category_id: categoryId,
    option_id: optionId,
    opportunities,
    publishedCourses,
  })

  if (!result) {
    return NextResponse.json(
      { error: 'Could not match that Extra Income option.', code: 'no_match' },
      { status: 404 }
    )
  }

  void trackJazEventServer({
    event_type: 'career_plan_generated',
    event_source: 'extra_income_library',
    goal_path: 'extra_income',
    page_path: '/career-engine/extra-income',
    route_title: result.option_title,
    metadata: {
      extra_income_category: result.category_id,
      selected_option: result.option_id,
      needs_licence: result.needs_licence,
      needs_short_training: result.needs_short_training,
      recommended_course_count: result.recommended_course_count,
      missing_provider_count: result.missing_provider_count,
      result_source: 'extra_income_library',
    },
  })

  return NextResponse.json({ result })
}
