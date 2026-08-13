/**
 * Persist / load JAZ action plans (Supabase + never throw to callers).
 * Logged-in users: at most one is_active plan — previous actives are archived on save.
 */

import { getAdminCoursesSupabase, isAdminCoursesSupabaseConfigured } from '@/lib/admin/courses/supabaseServer'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { isJobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazActionPlanResult, JazPlanAction, JazPlanActionStatus } from './types'

export type JazPlanPersistSource =
  | 'career_assistant_selected_items'
  | 'jaz_plan_generate'
  | 'fallback'
  | 'manual'

function asUuidOrNull(v: string | null | undefined): string | null {
  if (!v) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    ? v
    : null
}

async function archiveActivePlansForUser(
  supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>,
  userId: string
): Promise<{ archived: number; error?: string }> {
  const uid = asUuidOrNull(userId)
  if (!uid) return { archived: 0 }
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('jaz_user_action_plans')
    .update({
      is_active: false,
      archived_at: now,
      updated_at: now,
    })
    .eq('user_id', uid)
    .eq('is_active', true)
    .select('id')

  if (error) {
    // Column may not exist before migration — soft-fail so insert can still proceed
    if (/is_active|archived_at|schema cache|does not exist/i.test(error.message)) {
      return { archived: 0, error: error.message }
    }
    return { archived: 0, error: error.message }
  }
  return { archived: data?.length ?? 0 }
}

export async function persistJazActionPlan(opts: {
  plan: JazActionPlanResult
  userId?: string | null
  anonymousId?: string | null
  /** Full Career Assistant / My Plan payload for cross-browser sync */
  jobazPlan?: JobAZPlan | null
  source?: JazPlanPersistSource
  metadata?: Record<string, unknown>
}): Promise<{ action_plan_id: string | null; archived_previous: number; error?: string }> {
  try {
    if (!isAdminCoursesSupabaseConfigured()) {
      return { action_plan_id: null, archived_previous: 0, error: 'supabase_not_configured' }
    }
    const supabase = getAdminCoursesSupabase()
    if (!supabase) return { action_plan_id: null, archived_previous: 0, error: 'no_client' }

    let archivedPrevious = 0
    const uid = asUuidOrNull(opts.userId)
    if (uid) {
      const archived = await archiveActivePlansForUser(supabase, uid)
      archivedPrevious = archived.archived
      // Continue even if archive soft-failed (pre-migration)
    }

    const source =
      opts.source ||
      (opts.jobazPlan?.ca_selection ? 'career_assistant_selected_items' : 'jaz_plan_generate')

    const raw_plan: Record<string, unknown> = {
      engine_version: opts.plan.engine_version,
      plan_source: opts.plan.plan_source,
      this_week_actions: opts.plan.this_week_actions,
      blocked_by: opts.plan.blocked_by,
      safety_notes: opts.plan.safety_notes,
      source,
      ...(opts.metadata || {}),
    }
    if (opts.jobazPlan && isJobAZPlan(opts.jobazPlan)) {
      raw_plan.jobaz_plan = opts.jobazPlan
      raw_plan.ca_selection = opts.jobazPlan.ca_selection || null
    }

    const insertRow: Record<string, unknown> = {
      user_id: uid,
      anonymous_id: opts.anonymousId ?? null,
      career_plan_id: opts.plan.career_plan_id,
      goal_path: opts.plan.goal_path,
      route_title: opts.plan.route_title,
      current_focus: opts.plan.current_focus,
      next_upgrade: opts.plan.next_upgrade,
      readiness: opts.plan.readiness,
      plan_source: opts.plan.plan_source,
      ai_provider: opts.plan.ai_provider,
      engine_version: opts.plan.engine_version,
      next_best_action: opts.plan.next_best_action || {},
      progress_summary: opts.plan.progress_summary || {},
      raw_plan,
      updated_at: new Date().toISOString(),
      is_active: true,
      archived_at: null,
      source,
    }

    let { data: planRow, error: planErr } = await supabase
      .from('jaz_user_action_plans')
      .insert(insertRow)
      .select('id')
      .single()

    // Pre-migration fallback: retry without is_active/source columns
    if (planErr && /is_active|archived_at|source|schema cache/i.test(planErr.message)) {
      const { is_active: _a, archived_at: _b, source: _c, ...legacy } = insertRow
      void _a
      void _b
      void _c
      const retry = await supabase.from('jaz_user_action_plans').insert(legacy).select('id').single()
      planRow = retry.data
      planErr = retry.error
    }

    if (planErr || !planRow?.id) {
      return {
        action_plan_id: null,
        archived_previous: archivedPrevious,
        error: planErr?.message || 'insert_failed',
      }
    }

    const steps = opts.plan.this_week_actions.map((a, i) => ({
      action_plan_id: planRow.id,
      user_id: uid,
      step_key: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      priority: a.priority,
      status: a.status,
      cta_label: a.cta_label,
      cta_target: a.cta_target,
      why_it_matters: a.why_it_matters,
      estimated_time: a.estimated_time,
      sort_order: i,
      completed_at: a.status === 'done' ? new Date().toISOString() : null,
      skipped_at: a.status === 'skipped' ? new Date().toISOString() : null,
    }))

    if (steps.length) {
      const { error: stepErr } = await supabase.from('jaz_plan_steps').insert(steps)
      if (stepErr && process.env.NODE_ENV === 'development') {
        console.warn('[jaz-plan-persist] steps insert:', stepErr.message)
      }
    }

    return { action_plan_id: planRow.id, archived_previous: archivedPrevious }
  } catch (err) {
    return {
      action_plan_id: null,
      archived_previous: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function updateJazPlanStepStatus(opts: {
  actionPlanId: string
  stepKey: string
  status: JazPlanActionStatus
  userId?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isAdminCoursesSupabaseConfigured()) return { ok: false, error: 'supabase_not_configured' }
    const supabase = getAdminCoursesSupabase()
    if (!supabase) return { ok: false, error: 'no_client' }

    const patch: Record<string, unknown> = {
      status: opts.status,
      updated_at: new Date().toISOString(),
    }
    if (opts.status === 'done') patch.completed_at = new Date().toISOString()
    if (opts.status === 'skipped') patch.skipped_at = new Date().toISOString()

    let q = supabase
      .from('jaz_plan_steps')
      .update(patch)
      .eq('action_plan_id', opts.actionPlanId)
      .eq('step_key', opts.stepKey)

    const uid = asUuidOrNull(opts.userId)
    if (uid) q = q.eq('user_id', uid)

    const { error } = await q
    if (error) return { ok: false, error: error.message }

    await supabase
      .from('jaz_user_action_plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', opts.actionPlanId)

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function mapRowToPlan(
  data: Record<string, unknown>,
  steps: JazPlanAction[]
): JazActionPlanResult {
  const raw = (data.raw_plan || {}) as Record<string, unknown>
  return {
    plan_source: (data.plan_source as JazActionPlanResult['plan_source']) || 'jaz_plan_fallback',
    ai_provider: (data.ai_provider as JazActionPlanResult['ai_provider']) || 'fallback',
    engine_version: 'jaz-plan-engine-v1',
    career_plan_id: (data.career_plan_id as string) || null,
    goal_path: (data.goal_path as string) || 'unknown',
    route_title: (data.route_title as string) || 'Your career route',
    current_focus: (data.current_focus as string) || '',
    next_upgrade: (data.next_upgrade as string) || '',
    readiness: (data.readiness as number) ?? 55,
    today_actions: steps.filter((s) => s.priority === 'required').slice(0, 2),
    this_week_actions: steps,
    next_14_days: [],
    next_30_days: [],
    cv_actions: steps.filter((s) => s.category === 'cv'),
    job_actions: steps.filter((s) => s.category === 'jobs'),
    course_actions: steps.filter((s) => s.category === 'course'),
    follow_up_actions: steps.filter((s) => s.category === 'follow_up'),
    blocked_by: Array.isArray(raw.blocked_by) ? (raw.blocked_by as string[]) : [],
    next_best_action:
      (data.next_best_action && typeof data.next_best_action === 'object'
        ? (data.next_best_action as JazPlanAction)
        : null) ||
      steps.find((s) => s.status !== 'done' && s.status !== 'skipped') ||
      null,
    progress_summary:
      (data.progress_summary as JazActionPlanResult['progress_summary']) || {
        cv_ready: false,
        jobs_started: false,
        training_checked: false,
        applications_started: false,
        follow_up_planned: false,
        required_done: 0,
        required_total: steps.filter((s) => s.priority === 'required').length,
        percent_complete: 0,
      },
    safety_notes: Array.isArray(raw.safety_notes) ? (raw.safety_notes as string[]) : [],
    action_plan_id: data.id as string,
  }
}

async function loadSteps(
  supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>,
  actionPlanId: string
): Promise<JazPlanAction[]> {
  const { data: stepRows } = await supabase
    .from('jaz_plan_steps')
    .select('*')
    .eq('action_plan_id', actionPlanId)
    .order('sort_order', { ascending: true })

  return (stepRows || []).map((s) => ({
    id: s.step_key,
    title: s.title,
    description: s.description || '',
    category: (s.category || 'research') as JazPlanAction['category'],
    priority: (s.priority || 'recommended') as JazPlanAction['priority'],
    status: (s.status || 'not_started') as JazPlanActionStatus,
    cta_label: s.cta_label || 'Mark Done',
    cta_target: s.cta_target || '#this-weeks-plan',
    why_it_matters: s.why_it_matters || '',
    estimated_time: s.estimated_time || '20 min',
  }))
}

export type ActiveJazPlanLoad = {
  plan: JazActionPlanResult | null
  steps: JazPlanAction[]
  jobaz_plan: JobAZPlan | null
  source: string | null
  is_active: boolean
  updated_at: string | null
  created_at: string | null
  table_ready: boolean
  note: string | null
  user_plan_count: number
  active_plan_count: number
}

/**
 * Load the single active My Plan for a user (Supabase source of truth).
 */
export async function loadActiveJazActionPlan(opts: {
  userId: string
}): Promise<ActiveJazPlanLoad> {
  const empty: ActiveJazPlanLoad = {
    plan: null,
    steps: [],
    jobaz_plan: null,
    source: null,
    is_active: false,
    updated_at: null,
    created_at: null,
    table_ready: false,
    note: null,
    user_plan_count: 0,
    active_plan_count: 0,
  }
  try {
    if (!isAdminCoursesSupabaseConfigured()) {
      return { ...empty, note: 'Supabase not configured' }
    }
    const supabase = getAdminCoursesSupabase()
    if (!supabase) return { ...empty, note: 'No client' }

    const uid = asUuidOrNull(opts.userId)
    if (!uid) return { ...empty, table_ready: true, note: 'invalid_user' }

    const { count: totalCount } = await supabase
      .from('jaz_user_action_plans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)

    let activeCount = 0
    const activeCountRes = await supabase
      .from('jaz_user_action_plans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_active', true)
    if (!activeCountRes.error) activeCount = activeCountRes.count ?? 0

    // Prefer is_active = true; fall back to newest row if column missing / none active
    let data: Record<string, unknown> | null = null
    let note: string | null = null

    const activeQ = await supabase
      .from('jaz_user_action_plans')
      .select('*')
      .eq('user_id', uid)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeQ.error && /is_active|schema cache|does not exist/i.test(activeQ.error.message)) {
      note = 'Apply migration 20250810180000_jaz_active_plan.sql'
      const latest = await supabase
        .from('jaz_user_action_plans')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = (latest.data as Record<string, unknown>) || null
    } else if (activeQ.error) {
      return {
        ...empty,
        table_ready: true,
        note: activeQ.error.message,
        user_plan_count: totalCount ?? 0,
        active_plan_count: activeCount,
      }
    } else {
      data = (activeQ.data as Record<string, unknown>) || null
    }

    if (!data) {
      // No active flag match — try newest as soft fallback
      const latest = await supabase
        .from('jaz_user_action_plans')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = (latest.data as Record<string, unknown>) || null
    }

    if (!data?.id) {
      return {
        ...empty,
        table_ready: true,
        note,
        user_plan_count: totalCount ?? 0,
        active_plan_count: activeCount,
      }
    }

    const steps = await loadSteps(supabase, String(data.id))
    const raw = (data.raw_plan || {}) as Record<string, unknown>
    const jobazRaw = raw.jobaz_plan
    const jobaz_plan = isJobAZPlan(jobazRaw) ? jobazRaw : null

    return {
      plan: mapRowToPlan(data, steps),
      steps,
      jobaz_plan,
      source: (data.source as string) || (raw.source as string) || null,
      is_active: data.is_active !== false,
      updated_at: (data.updated_at as string) || null,
      created_at: (data.created_at as string) || null,
      table_ready: true,
      note,
      user_plan_count: totalCount ?? 0,
      active_plan_count: activeCount || (data.is_active !== false ? 1 : 0),
    }
  } catch (err) {
    return {
      ...empty,
      note: err instanceof Error ? err.message : String(err),
    }
  }
}

/** @deprecated Prefer loadActiveJazActionPlan for My Plan UI */
export async function loadLatestJazActionPlan(opts: {
  userId?: string | null
  goalPath?: string | null
}): Promise<{
  plan: JazActionPlanResult | null
  steps: JazPlanAction[]
  table_ready: boolean
  note: string | null
}> {
  if (opts.userId) {
    const active = await loadActiveJazActionPlan({ userId: opts.userId })
    return {
      plan: active.plan,
      steps: active.steps,
      table_ready: active.table_ready,
      note: active.note,
    }
  }
  return { plan: null, steps: [], table_ready: false, note: 'user_required' }
}
