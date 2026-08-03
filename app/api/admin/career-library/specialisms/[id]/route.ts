import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  isMissingDisabledStageKeysColumn,
  stripDisabledStageMarker,
  withDisabledStageMarker,
} from '@/lib/admin/career-library/disabledStages'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import {
  countSpecialismDependents,
  normalizeDisabledStageKeys,
  normalizeSlug,
  validateDisabledStageKeysForModel,
} from '@/lib/admin/career-library/guards'
import { mapSpecialismRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'

export const dynamic = 'force-dynamic'

const SPECIALISM_SELECT =
  '*, career_library_fields(name), career_library_stage_models(model_key, name)'

type PatchBody = {
  fieldId?: string
  name?: string
  slug?: string
  description?: string
  stageModelId?: string | null
  disabledStageKeys?: string[]
  regulatedProfession?: boolean
  professionalBody?: string | null
  status?: 'draft' | 'approved'
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
    return NextResponse.json({ error: 'Missing specialism id.' }, { status: 400 })
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
  if (typeof body.fieldId === 'string' && body.fieldId.trim()) {
    patch.field_id = body.fieldId.trim()
  }
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'Specialism name cannot be empty.' }, { status: 400 })
    }
    patch.name = name
  }
  if (typeof body.slug === 'string') {
    const slug = normalizeSlug(body.slug, body.name ?? body.slug)
    if (!slug) {
      return NextResponse.json({ error: 'Slug is invalid.' }, { status: 400 })
    }
    patch.slug = slug
  }
  if (typeof body.description === 'string') patch.description = body.description.trim()
  if (typeof body.stageModelId === 'string') {
    if (!body.stageModelId.trim()) {
      return NextResponse.json({ error: 'Choose a stage model.' }, { status: 400 })
    }
    patch.stage_model_id = body.stageModelId.trim()
  }

  let normalizedDisabled: string[] | undefined
  if (body.disabledStageKeys !== undefined) {
    const disabledStageKeys = normalizeDisabledStageKeys(body.disabledStageKeys)
    if (disabledStageKeys === null) {
      return NextResponse.json(
        { error: 'Disabled stage keys must be an array of valid stage keys.' },
        { status: 400 }
      )
    }
    normalizedDisabled = disabledStageKeys
    patch.disabled_stage_keys = disabledStageKeys
  }

  if (typeof body.regulatedProfession === 'boolean') {
    patch.regulated_profession = body.regulatedProfession
  }
  if (body.professionalBody === null) patch.professional_body = null
  else if (typeof body.professionalBody === 'string') {
    patch.professional_body = body.professionalBody.trim() || null
  }
  if (body.status === 'draft' || body.status === 'approved') patch.status = body.status
  if (typeof body.active === 'boolean') patch.active = body.active
  if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
    patch.sort_order = Math.trunc(body.sortOrder)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data: current } = await supabase
    .from('career_library_specialisms')
    .select('stage_model_id, description')
    .eq('id', id)
    .maybeSingle()

  if (normalizedDisabled !== undefined || patch.stage_model_id !== undefined) {
    const stageModelId =
      (typeof patch.stage_model_id === 'string' ? patch.stage_model_id : null) ??
      current?.stage_model_id ??
      null
    const keys = normalizedDisabled ?? []
    if (stageModelId && normalizedDisabled !== undefined) {
      const disabledCheck = await validateDisabledStageKeysForModel(supabase, stageModelId, keys)
      if (!disabledCheck.ok) {
        return NextResponse.json({ error: disabledCheck.error }, { status: 400 })
      }
    }
  }

  let { data, error } = await supabase
    .from('career_library_specialisms')
    .update(patch)
    .eq('id', id)
    .select(SPECIALISM_SELECT)
    .single()

  if (error && isMissingDisabledStageKeysColumn(error) && normalizedDisabled !== undefined) {
    const { disabled_stage_keys: _drop, ...withoutColumn } = patch
    const baseDesc =
      typeof withoutColumn.description === 'string'
        ? (withoutColumn.description as string)
        : stripDisabledStageMarker(current?.description ?? '')
    const retry = await supabase
      .from('career_library_specialisms')
      .update({
        ...withoutColumn,
        description: withDisabledStageMarker(baseDesc, normalizedDisabled),
      })
      .eq('id', id)
      .select(SPECIALISM_SELECT)
      .single()
    data = retry.data
    error = retry.error
  }

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this specialism.') },
      { status: 500 }
    )
  }

  const deps = await countSpecialismDependents(supabase, id)
  return NextResponse.json({ specialism: mapSpecialismRow(data, Math.max(0, deps)) })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing specialism id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const deps = await countSpecialismDependents(supabase, id)
  if (deps < 0) {
    return NextResponse.json(
      { error: 'Could not check specialism dependencies. Please try again.' },
      { status: 500 }
    )
  }
  if (deps > 0) {
    return NextResponse.json(
      {
        error: `This specialism has ${deps} linked record${deps === 1 ? '' : 's'} (roles, learning, recognition, or rules). Remove them first.`,
        dependencyCount: deps,
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('career_library_specialisms').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this specialism.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
