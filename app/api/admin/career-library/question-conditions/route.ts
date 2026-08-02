import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapQuestionConditionRow } from '@/lib/admin/career-library/blueprintMappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'

export const dynamic = 'force-dynamic'

const OPERATORS = new Set(['equals', 'not_equals', 'in', 'not_in', 'contains'])

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

  let body: {
    questionId?: string
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

  const questionId = body.questionId?.trim()
  const dependsOn = body.dependsOnQuestionKey?.trim()
  const operator = body.operator?.trim() || 'equals'
  if (!questionId || !dependsOn) {
    return NextResponse.json(
      { error: 'Question and depends-on question key are required.' },
      { status: 400 }
    )
  }
  if (!OPERATORS.has(operator)) {
    return NextResponse.json({ error: 'Condition operator is invalid.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_question_conditions')
    .insert({
      question_id: questionId,
      depends_on_question_key: dependsOn,
      operator,
      expected_value: body.expectedValue ?? null,
      active: body.active ?? true,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this condition.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ condition: mapQuestionConditionRow(data) }, { status: 201 })
}
