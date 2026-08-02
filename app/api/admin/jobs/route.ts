import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  adminJobInputToInsertRow,
  jobRowToAdminJob,
} from '@/lib/admin/jobs/mappers'
import { getAdminJobsSupabase } from '@/lib/admin/jobs/supabaseServer'
import type { AdminJobInput } from '@/lib/admin/jobs/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminJobsSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('source', 'jobaz')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ jobs: (data ?? []).map(jobRowToAdminJob) })
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminJobsSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  let input: AdminJobInput
  try {
    input = (await req.json()) as AdminJobInput
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!input.title?.trim()) {
    return NextResponse.json({ error: 'Job title is required' }, { status: 400 })
  }
  if (!input.companyName?.trim()) {
    return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
  }

  const row = adminJobInputToInsertRow(input)
  const { data, error } = await supabase.from('jobs').insert(row).select('*').single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create job' }, { status: 500 })
  }

  return NextResponse.json({ job: jobRowToAdminJob(data) }, { status: 201 })
}
