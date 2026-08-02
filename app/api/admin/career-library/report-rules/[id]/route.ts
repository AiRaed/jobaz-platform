import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { mapReportRuleRow } from '@/lib/admin/career-library/blueprintMappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { stageKeyFromLabel } from '@/lib/admin/career-library/types'
import type { ConditionGroup } from '@/lib/career-library/assessment/evaluateBlueprint'

export const dynamic = 'force-dynamic'

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

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
    patch.name = name
    patch.title = name
  }
  if (typeof body.ruleKey === 'string') {
    const key = stageKeyFromLabel(body.ruleKey)
    if (!key) return NextResponse.json({ error: 'Rule key is invalid.' }, { status: 400 })
    patch.rule_key = key
  }
  if (typeof body.routeKey === 'string' && body.routeKey.trim()) {
    patch.route_key = body.routeKey.trim()
  }
  if ('specialismId' in body) patch.specialism_id = body.specialismId || null
  if ('stageId' in body) patch.stage_id = body.stageId || null
  if (body.conditionGroup && typeof body.conditionGroup === 'object') {
    patch.condition_group = body.conditionGroup
  }
  if (typeof body.outcomeType === 'string') {
    if (!OUTCOME_TYPES.has(body.outcomeType)) {
      return NextResponse.json({ error: 'Outcome type is invalid.' }, { status: 400 })
    }
    patch.outcome_type = body.outcomeType
  }
  if (typeof body.outcomeKey === 'string') {
    const key = stageKeyFromLabel(body.outcomeKey)
    if (!key) return NextResponse.json({ error: 'Outcome key is invalid.' }, { status: 400 })
    patch.outcome_key = key
  }
  if (body.outcomePayload && typeof body.outcomePayload === 'object') {
    patch.outcome_payload = body.outcomePayload
  }
  if (typeof body.priority === 'number') {
    patch.priority = Math.trunc(body.priority)
    patch.sort_order = Math.trunc(body.priority)
  }
  if (typeof body.stopProcessing === 'boolean') patch.stop_processing = body.stopProcessing
  if (body.status === 'draft' || body.status === 'approved' || body.status === 'disabled') {
    patch.status = body.status
    if (body.status === 'disabled') patch.active = false
  }
  if (typeof body.active === 'boolean') patch.active = body.active

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_report_rules')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this report rule.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ rule: mapReportRuleRow(data) })
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
    .from('career_library_report_rules')
    .select('id, is_system, name')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Report rule not found.' }, { status: 404 })
  }
  if (existing.is_system) {
    return NextResponse.json(
      {
        error:
          'System report rules cannot be deleted. Disable them or edit their configuration instead.',
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('career_library_report_rules').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this report rule.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
