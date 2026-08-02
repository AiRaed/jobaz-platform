import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { parseSiteHealthScope, runSiteHealthCheck } from '@/lib/admin/ai/siteHealth'

export const dynamic = 'force-dynamic'

/**
 * Lightweight site health checks for Technical Reports.
 * GET /api/admin/ai/site-health?scope=basic|ai|courses|cv|jobs|interview|tracking|all
 * POST with { scope } — same behaviour (no expensive live API calls).
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const scope = parseSiteHealthScope(req.nextUrl.searchParams.get('scope'))
    const snapshot = await runSiteHealthCheck(scope)
    return NextResponse.json({ ok: true, health: snapshot })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Health check failed' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as { scope?: string }
    const scope = parseSiteHealthScope(body.scope)
    const snapshot = await runSiteHealthCheck(scope)
    return NextResponse.json({ ok: true, health: snapshot })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Health check failed' },
      { status: 500 }
    )
  }
}
