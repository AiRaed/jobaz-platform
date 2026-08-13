/**
 * Replace the user's active JAZ action plan with Career Assistant selections.
 * Archives previous active plans, inserts one new is_active plan with full JobAZPlan.
 */

import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazActionPlanResult, JazPlanAction } from './types'
import { persistJazActionPlan } from './persist'
import { JAZ_PLAN_ENGINE_VERSION } from './types'

export async function replaceJazPlanSteps(opts: {
  userId: string
  goalPath: string
  routeTitle: string
  currentFocus?: string
  nextUpgrade?: string
  actions: JazPlanAction[]
  jobazPlan?: JobAZPlan | null
  metadata?: Record<string, unknown>
}): Promise<{
  action_plan_id: string | null
  added: number
  skipped_duplicates: number
  replaced: boolean
  archived_previous: number
  error?: string
  plan?: JazActionPlanResult | null
}> {
  if (!opts.actions.length) {
    return {
      action_plan_id: null,
      added: 0,
      skipped_duplicates: 0,
      replaced: false,
      archived_previous: 0,
      error: 'no_actions',
    }
  }

  const fresh = opts.actions.filter((a) => a?.id && a?.title)
  if (!fresh.length) {
    return {
      action_plan_id: null,
      added: 0,
      skipped_duplicates: 0,
      replaced: false,
      archived_previous: 0,
      error: 'no_actions',
    }
  }

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

  const persist = await persistJazActionPlan({
    plan,
    userId: opts.userId,
    jobazPlan: opts.jobazPlan || null,
    source: 'career_assistant_selected_items',
    metadata: {
      replace_active: true,
      ...(opts.metadata || {}),
    },
  })

  return {
    action_plan_id: persist.action_plan_id,
    added: fresh.length,
    skipped_duplicates: 0,
    replaced: true,
    archived_previous: persist.archived_previous,
    error: persist.error,
    plan: {
      ...plan,
      action_plan_id: persist.action_plan_id,
    },
  }
}
