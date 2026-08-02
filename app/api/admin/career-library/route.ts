import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapFieldRow, mapSpecialismRow, mapStageModelRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'

export const dynamic = 'force-dynamic'

/** GET /api/admin/career-library — overview for admin foundation UI */
export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const [fieldsRes, specialismsRes, modelsRes, stagesRes] = await Promise.all([
    supabase
      .from('career_library_fields')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('career_library_specialisms')
      .select('*, career_library_fields(name), career_library_stage_models(model_key, name)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('career_library_stage_models')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('career_library_stages')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true }),
  ])

  if (fieldsRes.error || specialismsRes.error || modelsRes.error || stagesRes.error) {
    return NextResponse.json(
      {
        error: friendlyCareerLibraryError(
          fieldsRes.error || specialismsRes.error || modelsRes.error || stagesRes.error,
          'Could not load the Career Library.'
        ),
      },
      { status: 500 }
    )
  }

  const specialisms = specialismsRes.data ?? []
  const specialismCountByField = new Map<string, number>()
  for (const row of specialisms) {
    specialismCountByField.set(row.field_id, (specialismCountByField.get(row.field_id) ?? 0) + 1)
  }

  const stagesByModel = new Map<string, NonNullable<typeof stagesRes.data>>()
  for (const stage of stagesRes.data ?? []) {
    const list = stagesByModel.get(stage.stage_model_id) ?? []
    list.push(stage)
    stagesByModel.set(stage.stage_model_id, list)
  }

  return NextResponse.json({
    fields: (fieldsRes.data ?? []).map((row) =>
      mapFieldRow(row, specialismCountByField.get(row.id) ?? 0)
    ),
    specialisms: specialisms.map((row) => mapSpecialismRow(row, 0)),
    stageModels: (modelsRes.data ?? []).map((row) =>
      mapStageModelRow(row, stagesByModel.get(row.id) ?? [])
    ),
  })
}
