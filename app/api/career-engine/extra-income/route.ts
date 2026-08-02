/**
 * POST /api/career-engine/extra-income
 * Extra Income + JAZ Career Engine (preferred handoff).
 */

import { NextResponse } from 'next/server'
import { buildExtraIncomeResult } from '@/lib/career-engine/extra-income/decisionEngine'
import { buildStructuredExtraIncomeRecommendations } from '@/lib/recommendations/buildStructuredRecommendations'
import { attachJazToCareerResult } from '@/lib/jaz-career-engine/attachJazToCareerResult'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>
    if (!body.side_profile) {
      return NextResponse.json({ error: 'Missing profile answers' }, { status: 400 })
    }

    console.info('[extra-income] answers received', {
      side_skills: body.side_skills,
      side_hours: body.side_hours,
      side_schedule: body.side_schedule,
    })

    const result = buildExtraIncomeResult(body)
    const structuredRecommendations = await buildStructuredExtraIncomeRecommendations(result)
    const jaz = await attachJazToCareerResult('side_job', body)

    return NextResponse.json({
      result: {
        ...result,
        structuredRecommendations,
        ...jaz,
      },
    })
  } catch (error) {
    console.error('[career-engine/extra-income]', error)
    return NextResponse.json({ error: 'Failed to generate extra income plan' }, { status: 500 })
  }
}
