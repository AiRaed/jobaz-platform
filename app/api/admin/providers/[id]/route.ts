import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { deleteProvider, updateProvider } from '@/lib/admin/providers/supabaseProviders'
import type { CourseProviderInput } from '@/lib/admin/providers/types'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  let input: CourseProviderInput
  try {
    input = (await req.json()) as CourseProviderInput
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!input.name?.trim()) {
    return NextResponse.json({ error: 'Provider name is required' }, { status: 400 })
  }

  try {
    const provider = await updateProvider(supabase, id, input)
    return NextResponse.json({ provider })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update provider' },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params

  try {
    await deleteProvider(supabase, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete provider' },
      { status: 500 }
    )
  }
}
