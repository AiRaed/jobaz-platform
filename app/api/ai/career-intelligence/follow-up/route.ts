import { NextRequest, NextResponse } from 'next/server'
import { maybeGenerateFollowUp } from '@/lib/jobaz-ai/engines/careerIntelligence'
import type { UkCareerAssistantState } from '@/lib/jobaz-ai/engines/careerIntelligence'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Generate an AI follow-up question during UK Career Assistant PATH phase. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const state = body.state as UkCareerAssistantState | undefined
    if (!state?.answers) {
      return NextResponse.json({ ok: false, error: 'state.answers required' }, { status: 400 })
    }

    const followUp = await maybeGenerateFollowUp(state)
    if (!followUp) {
      return NextResponse.json({ ok: true, followUp: null })
    }

    return NextResponse.json({
      ok: true,
      followUp: followUp.question,
      stateUpdates: followUp.stateUpdates,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Follow-up generation failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
