import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { normalizeStageKey } from '@/lib/admin/career-library/guards'
import { mapStageRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'

export const dynamic = 'force-dynamic'

type PatchBody = {
  label?: string
  stageKey?: string
  description?: string
  sortOrder?: number
  active?: boolean
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing stage id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.label === 'string') {
    const label = body.label.trim()
    if (!label) {
      return NextResponse.json({ error: 'Stage label cannot be empty.' }, { status: 400 })
    }
    patch.label = label
  }
  if (typeof body.stageKey === 'string') {
    const key = normalizeStageKey(body.stageKey, body.label ?? body.stageKey)
    if (!key) {
      return NextResponse.json({ error: 'Stage key is invalid.' }, { status: 400 })
    }
    patch.stage_key = key
  }
  if (typeof body.description === 'string') patch.description = body.description.trim()
  if (typeof body.active === 'boolean') patch.active = body.active
  if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
    patch.sort_order = Math.trunc(body.sortOrder)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_stages')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this stage.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ stage: mapStageRow(data) })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing stage id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const { error } = await supabase.from('career_library_stages').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this stage.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
