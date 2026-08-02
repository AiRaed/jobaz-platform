import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { normalizeStageKey } from '@/lib/admin/career-library/guards'
import { mapStageRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import type { CareerLibraryStageInput } from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

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

  let input: CareerLibraryStageInput
  try {
    input = (await req.json()) as CareerLibraryStageInput
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const label = input.label?.trim()
  const stageModelId = input.stageModelId?.trim()
  if (!label) {
    return NextResponse.json({ error: 'Stage label is required.' }, { status: 400 })
  }
  if (!stageModelId) {
    return NextResponse.json({ error: 'Stage model is required.' }, { status: 400 })
  }

  const stageKey = normalizeStageKey(input.stageKey, label)
  if (!stageKey) {
    return NextResponse.json(
      { error: 'Could not create a valid stage key. Use letters and numbers.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('career_library_stages')
    .insert({
      stage_model_id: stageModelId,
      stage_key: stageKey,
      label,
      description: input.description?.trim() ?? '',
      sort_order: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
      active: input.active ?? true,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this stage.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ stage: mapStageRow(data) }, { status: 201 })
}
