import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  adminJobInputToUpdateRow,
  jobRowToAdminJob,
} from '@/lib/admin/jobs/mappers'
import { getAdminJobsSupabase } from '@/lib/admin/jobs/supabaseServer'
import type { AdminJobInput } from '@/lib/admin/jobs/types'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminJobsSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  let input: AdminJobInput & { archived?: boolean }
  try {
    input = (await req.json()) as AdminJobInput & { archived?: boolean }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!input.title?.trim()) {
    return NextResponse.json({ error: 'Job title is required' }, { status: 400 })
  }

  const row = adminJobInputToUpdateRow(input)
  const { data, error } = await supabase.from('jobs').update(row).eq('id', id).select('*').single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to update job' }, { status: 500 })
  }

  return NextResponse.json({ job: jobRowToAdminJob(data) })
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminJobsSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  const { error } = await supabase.from('jobs').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
