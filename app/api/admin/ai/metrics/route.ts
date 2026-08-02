import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { parseAdminAiDateRange } from '@/lib/admin/ai/dateRange'
import {
  getAdminAiMetrics,
  getAffiliateProviderSummary,
  getSupervisorSessions,
  getTechnicalChecks,
} from '@/lib/admin/ai/metrics'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const kind = req.nextUrl.searchParams.get('kind') || 'manager'
  const range = parseAdminAiDateRange(req.nextUrl.searchParams.get('range'))
  const includeTest = req.nextUrl.searchParams.get('includeTest') === '1'
  const completeOnly = req.nextUrl.searchParams.get('completeOnly') === '1'
  const route = req.nextUrl.searchParams.get('route') || undefined

  try {
    if (kind === 'manager') {
      const metrics = await getAdminAiMetrics({ range, includeTest })
      return NextResponse.json({ ok: true, metrics })
    }
    if (kind === 'supervisor') {
      const sessions = await getSupervisorSessions({
        range,
        includeTest,
        completeOnly,
        includeOld: includeTest,
        problemOnly: req.nextUrl.searchParams.get('problemOnly') === '1',
        route,
        limit: 50,
      })
      return NextResponse.json({ ok: true, sessions })
    }
    if (kind === 'affiliate') {
      const summary = await getAffiliateProviderSummary()
      return NextResponse.json({ ok: true, summary, range })
    }
    if (kind === 'technical') {
      const checks = await getTechnicalChecks()
      return NextResponse.json({ ok: true, checks })
    }
    return NextResponse.json({ ok: false, error: 'Unknown kind' }, { status: 400 })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load metrics' },
      { status: 500 }
    )
  }
}
