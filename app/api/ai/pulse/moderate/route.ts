import { NextRequest, NextResponse } from 'next/server'
import { moderatePulseContentSync } from '@/lib/ai/moderation'

export const dynamic = 'force-dynamic'

/** POST /api/ai/pulse/moderate — rule-based now; Ollama hook later */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const text = typeof body.text === 'string' ? body.text : ''
    const result = moderatePulseContentSync(text)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { ok: false, approved: false, verdict: 'blocked', reason: e instanceof Error ? e.message : 'Moderation failed' },
      { status: 500 }
    )
  }
}
