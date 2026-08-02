import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminUserDetail } from '@/lib/admin/users'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users/[id]
 * Admin-only user detail (summaries only — no raw CV / assessment JSON).
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const { id: rawId } = await context.params
    const id = String(rawId || '').trim()
    if (!id) {
      return NextResponse.json({ ok: false, error: 'User id required' }, { status: 400 })
    }

    const result = await getAdminUserDetail(id)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({ ok: true, user: result.user })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load user' },
      { status: 500 }
    )
  }
}
