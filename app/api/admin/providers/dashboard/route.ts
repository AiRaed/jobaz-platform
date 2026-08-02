import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { loadProviderDashboardData } from '@/lib/admin/providers/supabaseProviders'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const dashboard = await loadProviderDashboardData(supabase)
    return NextResponse.json({ ...dashboard, source: 'supabase' as const })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load provider dashboard' },
      { status: 500 }
    )
  }
}
