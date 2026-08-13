/**
 * Append Career Assistant plan steps to the user's latest action plan (dedupe by step_key).
 */

import { getAdminCoursesSupabase, isAdminCoursesSupabaseConfigured } from '@/lib/admin/courses/supabaseServer'
import type { JazActionPlanResult, JazPlanAction } from './types'
import { loadLatestJazActionPlan, persistJazActionPlan } from './persist'
import { JAZ_PLAN_ENGINE_VERSION } from './types'

function asUuidOrNull(v: string | null | undefined): string | null {
  if (!v) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    ? v
    : null
}

export async function appendJazPlanSteps(opts: {
  userId: string
  goalPath: string
  routeTitle: string
  currentFocus?: string
  nextUpgrade?: string
  actions: JazPlanAction[]
  metadata?: Record<string, unknown>
}): Promise<{
  action_plan_id: string | null
  added: number
  skipped_duplicates: number
  error?: string
  plan?: JazActionPlanResult | null
}> {
  if (!opts.actions.length) {
    return { action_plan_id: null, added: 0, skipped_duplicates: 0, error: 'no_actions' }
  }

  const latest = await loadLatestJazActionPlan({ userId: opts.userId })
  const existingKeys = new Set(latest.steps.map((s) => s.id))
  const fresh = opts.actions.filter((a) => a.id && !existingKeys.has(a.id))
  const skipped = opts.actions.length - fresh.length

  if (!latest.plan || !latest.plan.action_plan_id) {
    const emptyProgress = {
      cv_ready: false,
      jobs_started: false,
      training_checked: false,
      applications_started: false,
      follow_up_planned: false,
      required_done: 0,
      required_total: fresh.filter((a) => a.priority === 'required').length,
      percent_complete: 0,
    }
    const plan: JazActionPlanResult = {
      plan_source: 'jaz_plan_fallback',
      ai_provider: 'fallback',
      engine_version: JAZ_PLAN_ENGINE_VERSION,
      career_plan_id: null,
      goal_path: opts.goalPath,
      route_title: opts.routeTitle,
      current_focus: opts.currentFocus || opts.routeTitle,
      next_upgrade: opts.nextUpgrade || opts.routeTitle,
      readiness: 55,
      today_actions: fresh.filter((a) => a.priority === 'required').slice(0, 2),
      this_week_actions: fresh,
      next_14_days: [],
      next_30_days: [],
      cv_actions: fresh.filter((a) => a.category === 'cv'),
      job_actions: fresh.filter((a) => a.category === 'jobs'),
      course_actions: fresh.filter((a) => a.category === 'course'),
      follow_up_actions: fresh.filter((a) => a.category === 'follow_up'),
      blocked_by: [],
      next_best_action: fresh[0] || null,
      progress_summary: emptyProgress,
      safety_notes: [],
    }
    const persist = await persistJazActionPlan({ plan, userId: opts.userId })
    return {
      action_plan_id: persist.action_plan_id,
      added: fresh.length,
      skipped_duplicates: skipped,
      error: persist.error,
      plan: { ...plan, action_plan_id: persist.action_plan_id },
    }
  }

  if (!fresh.length) {
    return {
      action_plan_id: latest.plan.action_plan_id || null,
      added: 0,
      skipped_duplicates: skipped,
      plan: latest.plan,
    }
  }

  if (!isAdminCoursesSupabaseConfigured()) {
    return {
      action_plan_id: latest.plan.action_plan_id || null,
      added: 0,
      skipped_duplicates: skipped,
      error: 'supabase_not_configured',
      plan: latest.plan,
    }
  }

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return {
      action_plan_id: latest.plan.action_plan_id || null,
      added: 0,
      skipped_duplicates: skipped,
      error: 'no_client',
      plan: latest.plan,
    }
  }

  const actionPlanId = latest.plan.action_plan_id!
  const baseOrder = latest.steps.length
  const rows = fresh.map((a, i) => ({
    action_plan_id: actionPlanId,
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
    sort_order: baseOrder + i,
    completed_at: null,
    skipped_at: null,
  }))

  const { error } = await supabase.from('jaz_plan_steps').insert(rows)
  if (error) {
    return {
      action_plan_id: actionPlanId,
      added: 0,
      skipped_duplicates: skipped,
      error: error.message,
      plan: latest.plan,
    }
  }

  const mergedActions = [...latest.steps, ...fresh]
  const raw = {
    engine_version: JAZ_PLAN_ENGINE_VERSION,
    plan_source: latest.plan.plan_source,
    this_week_actions: mergedActions,
    blocked_by: latest.plan.blocked_by,
    safety_notes: latest.plan.safety_notes,
    career_assistant_add: opts.metadata || null,
  }

  await supabase
    .from('jaz_user_action_plans')
    .update({
      route_title: opts.routeTitle || latest.plan.route_title,
      current_focus: opts.currentFocus || latest.plan.current_focus,
      next_upgrade: opts.nextUpgrade || latest.plan.next_upgrade,
      raw_plan: raw,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionPlanId)

  const plan: JazActionPlanResult = {
    ...latest.plan,
    this_week_actions: mergedActions,
    today_actions: mergedActions.filter((a) => a.priority === 'required').slice(0, 2),
    cv_actions: mergedActions.filter((a) => a.category === 'cv'),
    job_actions: mergedActions.filter((a) => a.category === 'jobs'),
    course_actions: mergedActions.filter((a) => a.category === 'course'),
    follow_up_actions: mergedActions.filter((a) => a.category === 'follow_up'),
    next_best_action:
      mergedActions.find((s) => s.status !== 'done' && s.status !== 'skipped') || null,
  }

  return {
    action_plan_id: actionPlanId,
    added: fresh.length,
    skipped_duplicates: skipped,
    plan,
  }
}
