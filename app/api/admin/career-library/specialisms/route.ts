import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  isMissingDisabledStageKeysColumn,
  withDisabledStageMarker,
} from '@/lib/admin/career-library/disabledStages'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import {
  normalizeDisabledStageKeys,
  normalizeSlug,
  validateDisabledStageKeysForModel,
} from '@/lib/admin/career-library/guards'
import { mapSpecialismRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import type { CareerLibrarySpecialismInput } from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

const SPECIALISM_SELECT =
  '*, career_library_fields(name), career_library_stage_models(model_key, name)'

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let input: CareerLibrarySpecialismInput
  try {
    input = (await req.json()) as CareerLibrarySpecialismInput
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const name = input.name?.trim()
  const fieldId = input.fieldId?.trim()
  const stageModelId = input.stageModelId?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Specialism name is required.' }, { status: 400 })
  }
  if (!fieldId) {
    return NextResponse.json({ error: 'Choose a career field.' }, { status: 400 })
  }
  if (!stageModelId) {
    return NextResponse.json({ error: 'Choose a stage model.' }, { status: 400 })
  }

  const slug = normalizeSlug(input.slug, name)
  if (!slug) {
    return NextResponse.json(
      { error: 'Could not create a valid slug. Use letters and numbers.' },
      { status: 400 }
    )
  }

  const status = input.status === 'approved' ? 'approved' : 'draft'

  const disabledStageKeys = normalizeDisabledStageKeys(input.disabledStageKeys)
  if (disabledStageKeys === null) {
    return NextResponse.json(
      { error: 'Disabled stage keys must be an array of valid stage keys.' },
      { status: 400 }
    )
  }

  const disabledCheck = await validateDisabledStageKeysForModel(
    supabase,
    stageModelId,
    disabledStageKeys
  )
  if (!disabledCheck.ok) {
    return NextResponse.json({ error: disabledCheck.error }, { status: 400 })
  }

  const baseDescription = input.description?.trim() ?? ''
  const baseRow = {
    field_id: fieldId,
    name,
    slug,
    description: baseDescription,
    stage_model_id: stageModelId,
    regulated_profession: input.regulatedProfession ?? false,
    professional_body: input.professionalBody?.trim() || null,
    status,
    active: input.active ?? true,
    sort_order: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
  }

  let { data, error } = await supabase
    .from('career_library_specialisms')
    .insert({
      ...baseRow,
      disabled_stage_keys: disabledStageKeys,
    })
    .select(SPECIALISM_SELECT)
    .single()

  if (error && isMissingDisabledStageKeysColumn(error)) {
    const retry = await supabase
      .from('career_library_specialisms')
      .insert({
        ...baseRow,
        description: withDisabledStageMarker(baseDescription, disabledStageKeys),
      })
      .select(SPECIALISM_SELECT)
      .single()
    data = retry.data
    error = retry.error
  }

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this specialism.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ specialism: mapSpecialismRow(data, 0) }, { status: 201 })
}
