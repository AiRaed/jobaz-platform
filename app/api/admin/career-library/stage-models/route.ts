import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import {
  stageKeyFromLabel,
  type CareerLibraryStageModelInput,
} from '@/lib/admin/career-library/types'
import { mapStageModelRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'

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

  let input: CareerLibraryStageModelInput
  try {
    input = (await req.json()) as CareerLibraryStageModelInput
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const name = input.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Stage model name is required.' }, { status: 400 })
  }

  const modelKey =
    (input.modelKey?.trim() ? stageKeyFromLabel(input.modelKey) : '') ||
    stageKeyFromLabel(name)
  if (!modelKey) {
    return NextResponse.json(
      { error: 'Could not create a valid model key. Use letters and numbers.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('career_library_stage_models')
    .insert({
      model_key: modelKey,
      name,
      description: input.description?.trim() ?? '',
      active: input.active ?? true,
      sort_order: typeof input.sortOrder === 'number' ? input.sortOrder : 100,
      is_system: false,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this stage model.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ stageModel: mapStageModelRow(data, []) }, { status: 201 })
}
