import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapQuestionConditionRow } from '@/lib/admin/career-library/blueprintMappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'

export const dynamic = 'force-dynamic'

const OPERATORS = new Set(['equals', 'not_equals', 'in', 'not_in', 'contains'])

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
    dependsOnQuestionKey?: string
    operator?: string
    expectedValue?: unknown
    active?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.dependsOnQuestionKey === 'string') {
    patch.depends_on_question_key = body.dependsOnQuestionKey.trim()
  }
  if (typeof body.operator === 'string') {
    if (!OPERATORS.has(body.operator)) {
      return NextResponse.json({ error: 'Condition operator is invalid.' }, { status: 400 })
    }
    patch.operator = body.operator
  }
  if ('expectedValue' in body) patch.expected_value = body.expectedValue ?? null
  if (typeof body.active === 'boolean') patch.active = body.active

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_question_conditions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this condition.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ condition: mapQuestionConditionRow(data) })
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

  const { error } = await supabase
    .from('career_library_question_conditions')
    .delete()
    .eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this condition.') },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true })
}
