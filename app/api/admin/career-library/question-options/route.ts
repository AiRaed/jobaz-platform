import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapQuestionOptionRow } from '@/lib/admin/career-library/blueprintMappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { stageKeyFromLabel } from '@/lib/admin/career-library/types'

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

  let body: {
    questionId?: string
    optionKey?: string
    label?: string
    value?: string
    sortOrder?: number
    active?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const questionId = body.questionId?.trim()
  const label = body.label?.trim()
  if (!questionId || !label) {
    return NextResponse.json(
      { error: 'Question and option label are required.' },
      { status: 400 }
    )
  }

  const optionKey =
    (body.optionKey?.trim() ? stageKeyFromLabel(body.optionKey) : '') ||
    stageKeyFromLabel(label)
  const value = body.value?.trim() || optionKey
  if (!optionKey) {
    return NextResponse.json({ error: 'Option key is invalid.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_question_options')
    .insert({
      question_id: questionId,
      option_key: optionKey,
      label,
      value,
      sort_order: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
      active: body.active ?? true,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this option.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ option: mapQuestionOptionRow(data) }, { status: 201 })
}
