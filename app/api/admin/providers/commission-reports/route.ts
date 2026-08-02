import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { insertCommissionReport } from '@/lib/admin/providers/supabaseProviders'
import type { ProviderCommissionReportInput } from '@/lib/admin/providers/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  let input: ProviderCommissionReportInput
  try {
    input = (await req.json()) as ProviderCommissionReportInput
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!input.providerId?.trim()) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
  }

  try {
    const report = await insertCommissionReport(supabase, input)
    return NextResponse.json({ report }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create commission report' },
      { status: 500 }
    )
  }
}
