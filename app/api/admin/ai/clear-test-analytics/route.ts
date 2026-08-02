import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { clearMarkedTestAnalytics } from '@/lib/admin/ai/metrics'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { ok: false, error: 'Clear test analytics is only allowed in development.' },
      { status: 403 }
    )
  }

  try {
    const result = await clearMarkedTestAnalytics()
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Cleanup failed' },
      { status: 500 }
    )
  }
}
