import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapReportRuleRow } from '@/lib/admin/career-library/blueprintMappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { stageKeyFromLabel } from '@/lib/admin/career-library/types'
import type { ConditionGroup } from '@/lib/career-library/assessment/evaluateBlueprint'

export const dynamic = 'force-dynamic'

const DEFAULT_ROUTE = 'work_in_my_education'
const OUTCOME_TYPES = new Set([
  'load_stage_roles',
  'add_recognition_section',
  'add_english_section',
  'no_english_section',
  'enable_english_question',
  'exclude_learning_option',
  'recommend_learning_category',
  'add_report_note',
  'reorder_roles',
  'skip_english_question',
])

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

  const { data, error } = await supabase
    .from('career_library_report_rules')
    .select('*')
    .eq('route_key', routeKey)
    .order('priority', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not load report rules.') },
      { status: 500 }
    )
  }

  return NextResponse.json({
    route_key: routeKey,
    rules: (data ?? []).map(mapReportRuleRow),
  })
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

  let body: {
    name?: string
    ruleKey?: string
    routeKey?: string
    specialismId?: string | null
    stageId?: string | null
    conditionGroup?: ConditionGroup
    outcomeType?: string
    outcomeKey?: string
    outcomePayload?: Record<string, unknown>
    priority?: number
    stopProcessing?: boolean
    status?: 'draft' | 'approved' | 'disabled'
    active?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Rule name is required.' }, { status: 400 })
  }

  const routeKey = body.routeKey?.trim() || DEFAULT_ROUTE
  const ruleKey =
    (body.ruleKey?.trim() ? stageKeyFromLabel(body.ruleKey) : '') || stageKeyFromLabel(name)
  const outcomeType = body.outcomeType?.trim() || 'add_report_note'
  const outcomeKey =
    (body.outcomeKey?.trim() ? stageKeyFromLabel(body.outcomeKey) : '') || ruleKey

  if (!ruleKey) {
    return NextResponse.json({ error: 'Rule key is invalid.' }, { status: 400 })
  }
  if (!OUTCOME_TYPES.has(outcomeType)) {
    return NextResponse.json({ error: 'Outcome type is invalid.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_report_rules')
    .insert({
      name,
      title: name,
      rule_key: ruleKey,
      route_key: routeKey,
      specialism_id: body.specialismId || null,
      stage_id: body.stageId || null,
      condition_group: body.conditionGroup ?? { logic: 'and', conditions: [] },
      outcome_type: outcomeType,
      outcome_key: outcomeKey,
      outcome_payload: body.outcomePayload ?? {},
      priority: typeof body.priority === 'number' ? body.priority : 100,
      stop_processing: body.stopProcessing ?? false,
      status: body.status === 'approved' || body.status === 'disabled' ? body.status : 'draft',
      active: body.active ?? true,
      is_system: false,
      sort_order: typeof body.priority === 'number' ? body.priority : 100,
      rule_json: {},
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this report rule.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ rule: mapReportRuleRow(data) }, { status: 201 })
}
