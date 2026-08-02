/**
 * POST /api/career-engine/experience-path
 * Legacy experience engine + JAZ Career Engine attach (preferred for UI).
 */

import { NextResponse } from 'next/server'
import { buildExperiencePathResult } from '@/lib/career-engine/experience-path/decisionEngine'
import { isExperienceAnswersComplete } from '@/lib/career-engine/experience-path/consultant/interviewDedup'
import { buildStructuredPlanRecommendations } from '@/lib/recommendations/buildStructuredRecommendations'
import type { ExperiencePathAnswers } from '@/lib/career-engine/experience-path/types'
import { attachJazToCareerResult } from '@/lib/jaz-career-engine/attachJazToCareerResult'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!isExperienceAnswersComplete(body)) {
      return NextResponse.json({ error: 'Invalid assessment answers' }, { status: 400 })
    }

    const result = buildExperiencePathResult(body as ExperiencePathAnswers)
    const structuredRecommendations = await buildStructuredPlanRecommendations(result, {
      goal: 'work_in_experience',
    })
    const jaz = await attachJazToCareerResult('work_in_experience', body as Record<string, unknown>)

    return NextResponse.json({
      result: {
        ...result,
        structuredRecommendations,
        ...jaz,
      },
      structuredRecommendations,
    })
  } catch (error) {
    console.error('[career-engine/experience-path]', error)
    return NextResponse.json({ error: 'Failed to generate career plan' }, { status: 500 })
  }
}
