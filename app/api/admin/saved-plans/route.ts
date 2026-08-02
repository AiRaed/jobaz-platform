import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { listSavedPlans } from '@/lib/admin/savedPlans'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/saved-plans
 * Admin-only saved career plans list + demand summary.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const sp = req.nextUrl.searchParams
    const result = await listSavedPlans({
      search: sp.get('search') || undefined,
      route: sp.get('route') || undefined,
      goal: sp.get('goal') || undefined,
      hasCv: (sp.get('hasCv') as 'all' | 'yes' | 'no') || 'all',
      hasApplyNow: (sp.get('hasApplyNow') as 'all' | 'yes' | 'no') || 'all',
      savedFrom: sp.get('savedFrom') || undefined,
      savedTo: sp.get('savedTo') || undefined,
      status: sp.get('status') || undefined,
      limit: Number(sp.get('limit') || 200) || 200,
    })

    return NextResponse.json({
      ok: result.ok,
      plans: result.plans,
      summary: result.summary,
      routes: result.routes,
      goals: result.goals,
      error: result.error || null,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load saved plans' },
      { status: 500 }
    )
  }
}
