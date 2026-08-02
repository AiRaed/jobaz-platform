import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getSavedPlanDetail } from '@/lib/admin/savedPlans'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/saved-plans/[id]
 * Admin-only saved plan detail (summaries only).
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const { id: rawId } = await context.params
    const id = String(rawId || '').trim()
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Plan id required' }, { status: 400 })
    }

    const result = await getSavedPlanDetail(id)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({ ok: true, plan: result.plan })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load plan' },
      { status: 500 }
    )
  }
}
