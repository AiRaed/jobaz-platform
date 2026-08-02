import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { countSpecialismsForStageModel } from '@/lib/admin/career-library/guards'
import { mapStageModelRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'

export const dynamic = 'force-dynamic'

type PatchBody = {
  name?: string
  description?: string
  active?: boolean
  sortOrder?: number
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing stage model id.' }, { status: 400 })
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
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'Stage model name cannot be empty.' }, { status: 400 })
    }
    patch.name = name
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
    .from('career_library_stage_models')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this stage model.') },
      { status: 500 }
    )
  }

  const { data: stages } = await supabase
    .from('career_library_stages')
    .select('*')
    .eq('stage_model_id', id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({
    stageModel: mapStageModelRow(data, stages ?? []),
  })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing stage model id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const { data: model, error: loadError } = await supabase
    .from('career_library_stage_models')
    .select('id, is_system, name')
    .eq('id', id)
    .maybeSingle()

  if (loadError || !model) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(loadError, 'Stage model not found.') },
      { status: loadError ? 500 : 404 }
    )
  }

  if (model.is_system) {
    return NextResponse.json(
      {
        error:
          'System stage models cannot be deleted. You can disable them or edit their stages instead.',
      },
      { status: 409 }
    )
  }

  const count = await countSpecialismsForStageModel(supabase, id)
  if (count < 0) {
    return NextResponse.json(
      { error: 'Could not check stage model dependencies. Please try again.' },
      { status: 500 }
    )
  }
  if (count > 0) {
    return NextResponse.json(
      {
        error: `This stage model is used by ${count} specialism${count === 1 ? '' : 's'}. Reassign them before deleting.`,
        dependencyCount: count,
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('career_library_stage_models').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this stage model.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
