/**
 * POST /api/career-engine/education-path
 * Legacy education engine + JAZ Career Engine attach (preferred for UI).
 */

import { NextResponse } from 'next/server'
import { buildEducationPathResult } from '@/lib/career-engine/education-path/decisionEngine'
import { fetchEducationFieldKnowledge } from '@/lib/career-engine/education-path/knowledge/loadField'
import { buildStructuredEducationRecommendations } from '@/lib/recommendations/buildStructuredRecommendations'
import type { EducationFieldId, EducationPathAnswers } from '@/lib/career-engine/education-path/types'
import { attachJazToCareerResult } from '@/lib/jaz-career-engine/attachJazToCareerResult'

function isValidAnswers(body: unknown): body is EducationPathAnswers {
  if (!body || typeof body !== 'object') return false
  const a = body as Record<string, unknown>
  return (
    typeof a.education_field === 'string' &&
    typeof a.education_specialisation === 'string' &&
    typeof a.qualification_origin === 'string' &&
    typeof a.qualification_level === 'string' &&
    typeof a.english_level === 'string' &&
    typeof a.open_to_courses === 'string' &&
    typeof a.preferred_location === 'string'
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!isValidAnswers(body)) {
      return NextResponse.json({ error: 'Invalid assessment answers' }, { status: 400 })
    }

    const knowledge = await fetchEducationFieldKnowledge(body.education_field as EducationFieldId)
    const result = buildEducationPathResult(body, knowledge)
    const structuredRecommendations = await buildStructuredEducationRecommendations(body, result)
    const jaz = await attachJazToCareerResult('work_in_education', body as Record<string, unknown>)

    return NextResponse.json({
      result: {
        ...result,
        structuredRecommendations,
        ...jaz,
      },
      structuredRecommendations,
    })
  } catch (error) {
    console.error('[career-engine/education-path]', error)
    return NextResponse.json({ error: 'Failed to generate career plan' }, { status: 500 })
  }
}

export async function GET() {
  const { listEducationFields } = await import('@/lib/career-engine/education-path/knowledge/loadField')
  const fields = await listEducationFields()
  return NextResponse.json({ fields })
}
