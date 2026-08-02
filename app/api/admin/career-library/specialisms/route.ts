import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { normalizeSlug } from '@/lib/admin/career-library/guards'
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

  const { data, error } = await supabase
    .from('career_library_specialisms')
    .insert({
      field_id: fieldId,
      name,
      slug,
      description: input.description?.trim() ?? '',
      stage_model_id: stageModelId,
      regulated_profession: input.regulatedProfession ?? false,
      professional_body: input.professionalBody?.trim() || null,
      status,
      active: input.active ?? true,
      sort_order: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
    })
    .select(SPECIALISM_SELECT)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this specialism.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ specialism: mapSpecialismRow(data, 0) }, { status: 201 })
}
