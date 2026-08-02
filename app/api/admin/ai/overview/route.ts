import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminAiOverview } from '@/lib/admin/ai/overview'

export const dynamic = 'force-dynamic'

/** Compact Admin AI MVP overview for /admin/ai */
export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const overview = await getAdminAiOverview()
    return NextResponse.json({ ok: true, overview })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load overview' },
      { status: 500 }
    )
  }
}
