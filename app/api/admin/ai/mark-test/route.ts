import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { markAssessmentIsTest } from '@/lib/admin/ai/metrics'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      id?: string
      isTest?: boolean
    }
    const id = String(body.id || '').trim()
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Assessment id required' }, { status: 400 })
    }
    const result = await markAssessmentIsTest(id, body.isTest !== false)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to update' },
      { status: 500 }
    )
  }
}
