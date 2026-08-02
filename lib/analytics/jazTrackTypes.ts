/**
 * JAZ Learning Loop — safe product analytics event types.
 */

export type JazActivityEventType =
  | 'career_assistant_started'
  | 'career_goal_selected'
  | 'career_answer_submitted'
  | 'career_plan_generated'
  | 'career_plan_saved'
  | 'career_plan_viewed'
  | 'career_plan_action_clicked'
  | 'career_feedback_given'
  | 'course_recommended'
  | 'course_card_viewed'
  | 'course_apply_clicked'
  | 'course_save_interest_clicked'
  | 'course_missing_affiliate_detected'
  | 'job_search_clicked'
  | 'job_viewed'
  | 'job_saved'
  | 'job_apply_clicked'
  | 'job_marked_applied'
  | 'cv_builder_opened'
  | 'cv_route_loaded'
  | 'cv_summary_generated'
  | 'cv_saved'
  | 'cv_downloaded'
  | 'cover_letter_generated'
  | 'writing_review_used'
  | 'interview_coach_started'
  | 'signup_started'
  | 'signup_completed'
  | 'login_completed'
  | 'dashboard_viewed'
  | 'my_plan_viewed'
  | 'tool_opened'
  | 'action_plan_generated'
  | 'action_step_clicked'
  | 'action_step_completed'
  | 'action_step_skipped'
  | 'next_best_action_clicked'
  | 'plan_regenerated'
  | 'cv_action_clicked'
  | 'job_action_clicked'
  | 'course_action_clicked'

export type JazTrackEventInput = {
  event_type: JazActivityEventType | string
  event_source?: string | null
  user_id?: string | null
  anonymous_id?: string | null
  session_id?: string | null
  page_path?: string | null
  goal_path?: string | null
  route_title?: string | null
  career_plan_id?: string | null
  job_id?: string | null
  course_id?: string | null
  provider_id?: string | null
  tool_name?: string | null
  metadata?: Record<string, unknown> | null
  referrer?: string | null
  device_type?: string | null
}

/** Strip keys that may hold sensitive CV/PII content. */
export function sanitizeJazEventMetadata(
  metadata?: Record<string, unknown> | null
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') return {}
  const blocked = /cv_text|resume|cover_letter|password|email|phone|address|full_name|raw_|payload_raw/i
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(metadata)) {
    if (blocked.test(k)) continue
    if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 500)}…`
      continue
    }
    if (v !== undefined) out[k] = v
  }
  return out
}
