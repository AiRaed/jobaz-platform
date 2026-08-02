import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapQuestionRow } from '@/lib/admin/career-library/blueprintMappers'
import { loadBlueprintBundle } from '@/lib/admin/career-library/loadBlueprint'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { stageKeyFromLabel } from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

const DEFAULT_ROUTE = 'work_in_my_education'

export async function GET(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const routeKey =
    new URL(req.url).searchParams.get('route_key')?.trim() || DEFAULT_ROUTE
  const bundle = await loadBlueprintBundle(supabase, routeKey)
  if (bundle.error) {
    return NextResponse.json({ error: bundle.error }, { status: 500 })
  }

  return NextResponse.json({
    route_key: routeKey,
    questions: bundle.questions,
    rules: bundle.rules,
  })
}

type CreateBody = {
  routeKey?: string
  questionKey?: string
  label?: string
  helpText?: string
  answerType?: string
  required?: boolean
  sortOrder?: number
  status?: 'draft' | 'approved' | 'disabled'
  active?: boolean
  configuration?: Record<string, unknown>
}

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

  let body: CreateBody
  try {
    body = (await req.json()) as CreateBody
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const label = body.label?.trim()
  if (!label) {
    return NextResponse.json({ error: 'Question label is required.' }, { status: 400 })
  }

  const routeKey = body.routeKey?.trim() || DEFAULT_ROUTE
  const questionKey =
    (body.questionKey?.trim() ? stageKeyFromLabel(body.questionKey) : '') ||
    stageKeyFromLabel(label)
  if (!questionKey) {
    return NextResponse.json({ error: 'Question key is invalid.' }, { status: 400 })
  }

  const answerType = body.answerType || 'single_select'
  const allowed = ['single_select', 'multi_select', 'boolean', 'text', 'number']
  if (!allowed.includes(answerType)) {
    return NextResponse.json({ error: 'Answer type is invalid.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_questions')
    .insert({
      route_key: routeKey,
      question_key: questionKey,
      label,
      help_text: body.helpText?.trim() ?? '',
      answer_type: answerType,
      required: body.required ?? true,
      sort_order: typeof body.sortOrder === 'number' ? body.sortOrder : 100,
      status: body.status === 'approved' || body.status === 'disabled' ? body.status : 'draft',
      active: body.active ?? true,
      is_system: false,
      configuration: body.configuration ?? { option_source: { type: 'static' } },
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this question.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ question: mapQuestionRow(data, [], []) }, { status: 201 })
}
