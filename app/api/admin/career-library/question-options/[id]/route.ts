import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapQuestionOptionRow } from '@/lib/admin/career-library/blueprintMappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { stageKeyFromLabel } from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let body: {
    label?: string
    value?: string
    optionKey?: string
    sortOrder?: number
    active?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.label === 'string') patch.label = body.label.trim()
  if (typeof body.value === 'string') patch.value = body.value.trim()
  if (typeof body.optionKey === 'string') {
    const key = stageKeyFromLabel(body.optionKey)
    if (!key) return NextResponse.json({ error: 'Option key is invalid.' }, { status: 400 })
    patch.option_key = key
  }
  if (typeof body.sortOrder === 'number') patch.sort_order = Math.trunc(body.sortOrder)
  if (typeof body.active === 'boolean') patch.active = body.active

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_question_options')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this option.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ option: mapQuestionOptionRow(data) })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const { error } = await supabase.from('career_library_question_options').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this option.') },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true })
}
