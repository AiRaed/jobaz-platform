/**
 * JAZ Career Engine admin logging types.
 */

export type JazLogPlanSource = 'jaz' | 'jaz_fallback' | 'legacy'

export type JazLogAdminFeedback =
  | 'good_result'
  | 'wrong_route'
  | 'wrong_course'
  | 'missing_affiliate'
  | 'needs_better_explanation'

export type JazCareerEngineLogEntry = {
  id: string
  created_at: string
  goal_path: string
  route_title: string | null
  route_category: string | null
  current_focus: string | null
  next_upgrade: string | null
  plan_source: JazLogPlanSource
  ai_provider: string
  engine_version: string | null
  readiness: number | null
  matched_courses_count: number
  safety_warnings_count: number
  user_id: string | null
  anonymous_id: string | null
  session_id: string | null
  /** Mapped from response_time_ms in DB */
  duration_ms: number | null
  /** Mapped from error_message in DB */
  ollama_error: string | null
  /** Mapped from safety_warnings in DB */
  safety_notes: string[]
  recommended_course_types: Array<{
    title: string
    priority?: string
  }>
  matched_jobaz_courses: Array<{
    course_id?: string
    title: string
    commercial_status?: string
    primary_button?: string
    referral_url?: string | null
  }>
  missing_affiliate_opportunities: Array<{
    course_type: string
    reason?: string
    suggested_category?: string
    priority?: string
  }>
  /** Redacted request snapshot for admin debug (no secrets). */
  request_payload?: Record<string, unknown> | null
  /** Truncated response for admin debug. */
  response_payload?: Record<string, unknown> | null
  admin_feedback?: JazLogAdminFeedback | null
  admin_feedback_note?: string | null
  admin_feedback_at?: string | null
}

export type JazEngineStatusSnapshot = {
  engine_status: 'active' | 'error' | 'unknown'
  api_endpoint: '/api/jaz-career/analyse'
  engine_version: string | null
  openai_in_career_assistant: 'disabled'
  ollama_status: 'connected' | 'not_connected' | 'unknown'
  ollama_base_url: string
  ollama_model: string
  ollama_timeout_ms: number
  fallback_enabled: true
  last_success_at: string | null
  last_ollama_success_at: string | null
  last_ollama_success_latency_ms: number | null
  last_error: string | null
  provider_counts: {
    jaz: number
    jaz_fallback: number
    legacy: number
  }
  fallback_usage_percent: number | null
  last_ollama_error: string | null
  last_ollama_error_kind: string | null
  last_ollama_error_detail: string | null
  last_fallback_reason: string | null
  average_duration_ms: number | null
  logs_source: 'supabase' | 'memory' | 'none'
  logs_available: boolean
  table_ready: boolean
  note: string | null
}
