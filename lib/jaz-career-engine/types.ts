/**
 * JAZ Career Engine — internal API-first career adviser types.
 * Engine version: jaz-career-engine-v1
 */

export type JazCareerGoal =
  | 'work_in_education'
  | 'work_in_experience'
  | 'start_new_career'
  | 'grow_current_career'
  | 'extra_income'
  | 'start_business'
  | 'unknown'

export type JazWorkModePreference =
  | 'online'
  | 'physical'
  | 'hybrid'
  | 'flexible'
  | 'unknown'

export type JazAnalyseInput = {
  goal?: JazCareerGoal | string
  answers?: Record<string, unknown>
  skills?: string[]
  education?: string
  experience?: string
  availability?: string
  preferences?: Record<string, unknown>
  language_level?: string
  has_driving_licence?: boolean | null
  work_mode_preference?: JazWorkModePreference | string
  /** Optional session / analytics */
  session_id?: string
  user_id?: string | null
}

export type JazWorkNowRole = {
  title: string
  why: string
  pay_range: string
  job_search_terms: string[]
}

export type JazCourseTypePriority = 'primary' | 'secondary' | 'optional'

export type JazRecommendedCourseType = {
  title: string
  priority: JazCourseTypePriority
  reason: string
  related_roles: string[]
  related_skills: string[]
  pathway_stage: 'start' | 'upgrade' | 'licence' | 'optional' | 'growth'
}

export type JazCommercialStatus =
  | 'active_affiliate'
  | 'planned_affiliate'
  | 'no_link'
  | 'coming_soon'

export type JazPrimaryButton =
  | 'Apply Now'
  | 'Coming Soon'
  | 'Save Interest'
  | 'Learn More'

export type JazMatchedCourse = {
  course_id: string
  title: string
  provider: string
  match_reason: string
  commercial_status: JazCommercialStatus
  primary_button: JazPrimaryButton
  referral_url: string | null
  official_url?: string | null
  slug?: string | null
}

export type JazMissingAffiliateOpportunity = {
  course_type: string
  reason: string
  suggested_category: string
  priority: 'high' | 'medium' | 'low'
}

export type JazActionStep = {
  step: string
  why: string
  action_type: 'job_search' | 'course' | 'cv' | 'profile' | 'research'
}

export type JazAnalyseResult = {
  engine_version: 'jaz-career-engine-v1'
  ai_provider: 'ollama' | 'fallback'
  route_title: string
  route_category: string
  user_goal: string
  why_this_route_fits: string
  current_focus: string
  next_upgrade: string
  readiness: number
  work_now_roles: JazWorkNowRole[]
  recommended_course_types: JazRecommendedCourseType[]
  matched_jobaz_courses: JazMatchedCourse[]
  missing_affiliate_opportunities: JazMissingAffiliateOpportunity[]
  cv_focus: string
  first_action_plan: JazActionStep[]
  safety_notes: string[]
  /** Internal debug — not required for UI */
  debug?: {
    ollama_error?: string
    ollama_error_kind?: string
    ollama_error_detail?: string
    ollama_latency_ms?: number
    ollama_model?: string
    route_id?: string
    matched_from?: 'ollama' | 'fallback_templates'
    fallback_reason?: string
  }
}

/** Intermediate reasoning from Ollama before inventory matching */
export type JazBrainReasoning = {
  route_title: string
  route_category: string
  user_goal: string
  why_this_route_fits: string
  current_focus: string
  next_upgrade: string
  readiness: number
  work_now_roles: JazWorkNowRole[]
  recommended_course_types: JazRecommendedCourseType[]
  cv_focus: string
  first_action_plan: JazActionStep[]
  confidence?: number
}

export const JAZ_ENGINE_VERSION = 'jaz-career-engine-v1' as const
export const JAZ_CAREER_ANALYSE_FEATURE = 'jaz-career-analyse'
