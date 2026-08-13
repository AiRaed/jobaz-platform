/**
 * Public-safe selectable items for "Add to My Plan" from Career Assistant results.
 */

export type CaGoalPath =
  | 'work_in_my_education'
  | 'work_in_my_profession'
  | 'start_new_career'
  | 'extra_income'
  | 'legacy_career_assistant'

export type PlanPickGroup = 'roles' | 'training' | 'skills'

export type PlanPickKind =
  | 'role'
  | 'course'
  | 'licence'
  | 'check'
  | 'skill'
  | 'cv'
  | 'interview'
  | 'portfolio'
  | 'first_step'
  | 'job_search'

export type PlanPickProviderStatus = 'apply_now' | 'provider_not_listed' | 'check' | 'n_a'

/** Immediate vs progression — drives My Plan current focus guardrail */
export type PlanPickRouteTiming = 'start_now' | 'future_progression'

export type PlanPickItem = {
  id: string
  group: PlanPickGroup
  kind: PlanPickKind
  title: string
  subtitle?: string
  reason?: string
  badge?: string
  provider_status?: PlanPickProviderStatus
  default_selected?: boolean
  /** Stable key used for jaz_plan_steps.step_key dedupe */
  step_key: string
  /** When set on roles: start_now vs future/progression */
  route_timing?: PlanPickRouteTiming
  metadata?: {
    field?: string
    specialism?: string
    role_title?: string
    course_title?: string
    referral_url?: string | null
    search_keywords?: string[]
    pathway_id?: string
    match_type?: string
    start_now?: boolean
    level?: string
    stage_label?: string
    timing_label?: string
    bucket?: string
  }
}

export type PlanPickCatalog = {
  goal_path: CaGoalPath
  route_title: string
  field?: string
  specialism?: string
  result_token?: string | null
  roles: PlanPickItem[]
  training: PlanPickItem[]
  skills: PlanPickItem[]
}

export type PendingPlanItemsPayload = {
  version: 1
  savedAt: number
  goal_path: CaGoalPath
  route_title: string
  field?: string
  specialism?: string
  result_token?: string | null
  selected: PlanPickItem[]
  source: 'career_assistant'
}
