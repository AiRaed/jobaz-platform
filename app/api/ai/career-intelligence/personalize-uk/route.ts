import { NextRequest, NextResponse } from 'next/server'
import { enrichUkCareerResult } from '@/lib/jobaz-ai/engines/careerIntelligence'
import type {
  PartialProfileContext,
  UkCareerAssistantState,
  UkCareerRuleResult,
} from '@/lib/jobaz-ai/engines/careerIntelligence'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** AI personalization layer for UK Career Assistant results (rules unchanged). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const state = body.state as UkCareerAssistantState | undefined
    const ruleResult = body.ruleResult as UkCareerRuleResult | undefined
    const profileContext = body.profileContext as PartialProfileContext | undefined

    if (!state || !ruleResult) {
      return NextResponse.json(
        { ok: false, error: 'state and ruleResult are required' },
        { status: 400 }
      )
    }

    const personalization = await enrichUkCareerResult({
      state,
      ruleResult,
      profileContext,
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
