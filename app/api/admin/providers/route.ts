import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { insertProvider, loadAllProviders } from '@/lib/admin/providers/supabaseProviders'
import type { CourseProviderInput } from '@/lib/admin/providers/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const providers = await loadAllProviders(supabase)
    return NextResponse.json({ providers, source: 'supabase' as const })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load providers' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  let input: CourseProviderInput
  try {
    input = (await req.json()) as CourseProviderInput
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!input.name?.trim()) {
    return NextResponse.json({ error: 'Provider name is required' }, { status: 400 })
  }
  if (!input.slug?.trim()) {
    return NextResponse.json({ error: 'Provider slug is required' }, { status: 400 })
  }

  try {
    const provider = await insertProvider(supabase, input)
    return NextResponse.json({ provider }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create provider' },
      { status: 500 }
    )
  }
}
