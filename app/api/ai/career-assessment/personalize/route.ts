import { NextRequest, NextResponse } from 'next/server'
import { personalizeCareerAssessment } from '@/lib/jobaz-ai/assessment/personalizeCareerAssessment'
import type { AssessmentAnswers, CareerAssessmentResult } from '@/lib/jobaz-ai/types'
import type { RichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Server route — Ollama local personalization with OpenAI FAST fallback. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const answers = body.answers as AssessmentAnswers | undefined
    const ruleResult = body.ruleResult as CareerAssessmentResult | undefined
    const richInsights = body.richInsights as RichCareerInsights | undefined

    if (!answers || !ruleResult || !richInsights) {
      return NextResponse.json(
        { ok: false, error: 'answers, ruleResult, and richInsights are required' },
        { status: 400 }
      )
    }

    const personalization = await personalizeCareerAssessment({
      answers,
      ruleResult,
      richInsights,
      profileContext: body.profileContext ?? undefined,
    })

    return NextResponse.json({
      ok: true,
      personalization,
      usedAi: Boolean(personalization),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Personalization failed'
    return NextResponse.json({ ok: false, error: message, personalization: null }, { status: 500 })
  }
}
