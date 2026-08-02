/**
 * Persist / load JAZ action plans (Supabase + never throw to callers).
 */

import { getAdminCoursesSupabase, isAdminCoursesSupabaseConfigured } from '@/lib/admin/courses/supabaseServer'
import type { JazActionPlanResult, JazPlanAction, JazPlanActionStatus } from './types'

function asUuidOrNull(v: string | null | undefined): string | null {
  if (!v) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    ? v
    : null
}

export async function persistJazActionPlan(opts: {
  plan: JazActionPlanResult
  userId?: string | null
  anonymousId?: string | null
}): Promise<{ action_plan_id: string | null; error?: string }> {
  try {
    if (!isAdminCoursesSupabaseConfigured()) {
      return { action_plan_id: null, error: 'supabase_not_configured' }
    }
    const supabase = getAdminCoursesSupabase()
    if (!supabase) return { action_plan_id: null, error: 'no_client' }

    const { data: planRow, error: planErr } = await supabase
      .from('jaz_user_action_plans')
      .insert({
        user_id: asUuidOrNull(opts.userId),
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
        raw_plan: {
          engine_version: opts.plan.engine_version,
          plan_source: opts.plan.plan_source,
          this_week_actions: opts.plan.this_week_actions,
          blocked_by: opts.plan.blocked_by,
          safety_notes: opts.plan.safety_notes,
        },
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (planErr || !planRow?.id) {
      return {
        action_plan_id: null,
        error: planErr?.message || 'insert_failed',
      }
    }

    const steps = opts.plan.this_week_actions.map((a, i) => ({
      action_plan_id: planRow.id,
      user_id: asUuidOrNull(opts.userId),
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

    return { action_plan_id: planRow.id }
  } catch (err) {
    return {
      action_plan_id: null,
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

export async function loadLatestJazActionPlan(opts: {
  userId?: string | null
  goalPath?: string | null
}): Promise<{
  plan: JazActionPlanResult | null
  steps: JazPlanAction[]
  table_ready: boolean
  note: string | null
}> {
  try {
    if (!isAdminCoursesSupabaseConfigured()) {
      return { plan: null, steps: [], table_ready: false, note: 'Supabase not configured' }
    }
    const supabase = getAdminCoursesSupabase()
    if (!supabase) {
      return { plan: null, steps: [], table_ready: false, note: 'No client' }
    }

    let q = supabase
      .from('jaz_user_action_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    const uid = asUuidOrNull(opts.userId)
    if (uid) q = q.eq('user_id', uid)
    if (opts.goalPath) q = q.eq('goal_path', opts.goalPath)

    const { data, error } = await q.maybeSingle()
    if (error) {
      const missing = /schema cache|does not exist|jaz_user_action_plans/i.test(error.message)
      return {
        plan: null,
        steps: [],
        table_ready: !missing,
        note: missing
          ? 'Apply migration 20250801140000_jaz_plan_engine.sql'
          : error.message,
      }
    }
    if (!data) return { plan: null, steps: [], table_ready: true, note: null }

    const { data: stepRows } = await supabase
      .from('jaz_plan_steps')
      .select('*')
      .eq('action_plan_id', data.id)
      .order('sort_order', { ascending: true })

    const steps: JazPlanAction[] = (stepRows || []).map((s) => ({
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

    const raw = (data.raw_plan || {}) as Record<string, unknown>
    const plan: JazActionPlanResult = {
      plan_source: (data.plan_source as JazActionPlanResult['plan_source']) || 'jaz_plan_fallback',
      ai_provider: (data.ai_provider as JazActionPlanResult['ai_provider']) || 'fallback',
      engine_version: 'jaz-plan-engine-v1',
      career_plan_id: data.career_plan_id,
      goal_path: data.goal_path || 'unknown',
      route_title: data.route_title || 'Your career route',
      current_focus: data.current_focus || '',
      next_upgrade: data.next_upgrade || '',
      readiness: data.readiness ?? 55,
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
      action_plan_id: data.id,
    }

    return { plan, steps, table_ready: true, note: null }
  } catch (err) {
    return {
      plan: null,
      steps: [],
      table_ready: false,
      note: err instanceof Error ? err.message : String(err),
    }
  }
}
