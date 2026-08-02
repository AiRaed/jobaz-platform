/**
 * POST /api/career-engine/start-new-career
 * Legacy start-new-career engine + JAZ attach on roadmap phase.
 */

import { NextResponse } from 'next/server'
import { buildStartNewCareerEngineResult } from '@/lib/career-engine/start-new-career/decisionEngine'
import { isStartNewCareerRoadmap } from '@/lib/career-engine/start-new-career/types'
import { buildStructuredStartNewCareerRecommendations } from '@/lib/recommendations/buildStructuredRecommendations'
import { attachJazToCareerResult } from '@/lib/jaz-career-engine/attachJazToCareerResult'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>
    if (!body.starting_situation) {
      return NextResponse.json({ error: 'Missing starting situation' }, { status: 400 })
    }

    const result = buildStartNewCareerEngineResult(body)

    if (isStartNewCareerRoadmap(result)) {
      const structuredRecommendations = await buildStructuredStartNewCareerRecommendations(result)
      const jaz = await attachJazToCareerResult('start_new_career', body)
      return NextResponse.json({
        result: {
          ...result,
          structuredRecommendations,
          ...jaz,
        },
      })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('[career-engine/start-new-career]', error)
    return NextResponse.json({ error: 'Failed to generate career transition plan' }, { status: 500 })
  }
}
