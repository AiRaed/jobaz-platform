import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapQuestionRow } from '@/lib/admin/career-library/blueprintMappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { stageKeyFromLabel } from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

type PatchBody = {
  label?: string
  helpText?: string
  questionKey?: string
  answerType?: string
  required?: boolean
  sortOrder?: number
  status?: 'draft' | 'approved' | 'disabled'
  active?: boolean
  configuration?: Record<string, unknown>
}

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

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.label === 'string') {
    const label = body.label.trim()
    if (!label) return NextResponse.json({ error: 'Label cannot be empty.' }, { status: 400 })
    patch.label = label
  }
  if (typeof body.helpText === 'string') patch.help_text = body.helpText.trim()
  if (typeof body.questionKey === 'string') {
    const key = stageKeyFromLabel(body.questionKey)
    if (!key) return NextResponse.json({ error: 'Question key is invalid.' }, { status: 400 })
    patch.question_key = key
  }
  if (typeof body.answerType === 'string') patch.answer_type = body.answerType
  if (typeof body.required === 'boolean') patch.required = body.required
  if (typeof body.sortOrder === 'number') patch.sort_order = Math.trunc(body.sortOrder)
  if (body.status === 'draft' || body.status === 'approved' || body.status === 'disabled') {
    patch.status = body.status
    if (body.status === 'disabled') patch.active = false
  }
  if (typeof body.active === 'boolean') patch.active = body.active
  if (body.configuration && typeof body.configuration === 'object') {
    patch.configuration = body.configuration
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_questions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this question.') },
      { status: 500 }
    )
  }

  const [optionsRes, conditionsRes] = await Promise.all([
    supabase.from('career_library_question_options').select('*').eq('question_id', id),
    supabase.from('career_library_question_conditions').select('*').eq('question_id', id),
  ])

  return NextResponse.json({
    question: mapQuestionRow(data, optionsRes.data ?? [], conditionsRes.data ?? []),
  })
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

  const { data: existing } = await supabase
    .from('career_library_questions')
    .select('id, is_system, label')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
  }
  if (existing.is_system) {
    return NextResponse.json(
      {
        error:
          'System blueprint questions cannot be deleted. Disable them or edit their configuration instead.',
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('career_library_questions').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this question.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
