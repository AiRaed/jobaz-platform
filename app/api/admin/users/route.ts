import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { listAdminUsers } from '@/lib/admin/users'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users
 * Admin-only user list + engagement summary.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const sp = req.nextUrl.searchParams
    const result = await listAdminUsers({
      search: sp.get('search') || undefined,
      route: sp.get('route') || undefined,
      joinedFrom: sp.get('joinedFrom') || undefined,
      joinedTo: sp.get('joinedTo') || undefined,
      hasSavedPlan: (sp.get('hasSavedPlan') as 'all' | 'yes' | 'no') || 'all',
      hasCv: (sp.get('hasCv') as 'all' | 'yes' | 'no') || 'all',
      hasApplyNow: (sp.get('hasApplyNow') as 'all' | 'yes' | 'no') || 'all',
      engagement: sp.get('engagement') || undefined,
      limit: Number(sp.get('limit') || 200) || 200,
    })

    if (!result.ok && result.error) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          users: result.users,
          summary: result.summary,
          tracking: result.tracking,
          routes: result.routes,
        },
        { status: result.summary.usersAvailable ? 200 : 503 }
      )
    }

    return NextResponse.json({
      ok: true,
      users: result.users,
      summary: result.summary,
      tracking: result.tracking,
      routes: result.routes,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load users' },
      { status: 500 }
    )
  }
}
