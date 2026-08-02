/**
 * JAZ Plan Engine v1 — types.
 */

export const JAZ_PLAN_ENGINE_VERSION = 'jaz-plan-engine-v1' as const

export type JazPlanSource = 'jaz_plan' | 'jaz_plan_fallback' | 'legacy'
export type JazPlanAiProvider = 'ollama' | 'fallback' | 'legacy'

export type JazPlanActionCategory =
  | 'cv'
  | 'jobs'
  | 'course'
  | 'profile'
  | 'research'
  | 'follow_up'

export type JazPlanActionPriority = 'required' | 'recommended' | 'optional'
export type JazPlanActionStatus = 'not_started' | 'in_progress' | 'done' | 'skipped'

export type JazPlanAction = {
  id: string
  title: string
  description: string
  category: JazPlanActionCategory
  priority: JazPlanActionPriority
  status: JazPlanActionStatus
  cta_label: string
  cta_target: string
  why_it_matters: string
  estimated_time: string
}

export type JazPlanProgressSummary = {
  cv_ready: boolean
  jobs_started: boolean
  training_checked: boolean
  applications_started: boolean
  follow_up_planned: boolean
  required_done: number
  required_total: number
  percent_complete: number
}

export type JazActionPlanResult = {
  plan_source: JazPlanSource
  ai_provider: JazPlanAiProvider
  engine_version: typeof JAZ_PLAN_ENGINE_VERSION
  career_plan_id: string | null
  goal_path: string
  route_title: string
  current_focus: string
  next_upgrade: string
  readiness: number
  today_actions: JazPlanAction[]
  this_week_actions: JazPlanAction[]
  next_14_days: JazPlanAction[]
  next_30_days: JazPlanAction[]
  cv_actions: JazPlanAction[]
  job_actions: JazPlanAction[]
  course_actions: JazPlanAction[]
  follow_up_actions: JazPlanAction[]
  blocked_by: string[]
  next_best_action: JazPlanAction | null
  progress_summary: JazPlanProgressSummary
  safety_notes: string[]
  /** Persisted plan id when saved to DB / local */
  action_plan_id?: string | null
}

export type JazPlanGenerateInput = {
  career_plan_id?: string | null
  goal_path?: string | null
  route_title?: string | null
  current_focus?: string | null
  next_upgrade?: string | null
  readiness?: number | null
  cv_focus?: string | null
  work_now_roles?: Array<{ title: string; href?: string }>
  recommended_course_types?: Array<{ title: string; priority?: string }>
  matched_jobaz_courses?: Array<{
    title: string
    course_id?: string
    primary_button?: string
    referral_url?: string | null
    commercial_status?: string
  }>
  missing_affiliate_opportunities?: Array<{ course_type: string; reason?: string }>
  first_action_plan?: Array<{ step?: string; title?: string; action_type?: string }>
  this_week_plan?: string[]
  cv_target_role?: string | null
  user_id?: string | null
  anonymous_id?: string | null
  /** Behaviour / progress signals (safe summaries only) */
  signals?: {
    has_base_cv?: boolean
    cv_quality_score?: number
    cv_saved?: boolean
    saved_jobs_count?: number
    applied_jobs_count?: number
    job_search_clicked?: boolean
    course_apply_clicked?: boolean
    course_interest_saved?: boolean
    cv_builder_opened?: boolean
  }
}
