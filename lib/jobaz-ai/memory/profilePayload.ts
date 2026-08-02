/**
 * Sanitize ai_user_profiles payloads — only known columns, valid UUIDs.
 */

const PROFILE_COLUMNS = new Set([
  'id',
  'user_id',
  'anonymous_id',
  'session_id',
  'dominant_goal',
  'english_level',
  'experience_level',
  'cv_status',
  'last_recommended_path',
  'preferred_tools',
  'recommended_jobs',
  'readiness_score',
  'engagement_score',
  'assessment_count',
  'last_assessment_id',
  'career_stage',
  'current_stage',
  'strongest_area',
  'weakest_area',
  'recommendation_reason',
  'next_action',
  'weekly_focus',
  'action_plan',
  'ai_journey_summary',
  'progression_meta',
  'last_ai_update',
  'last_active_at',
  'created_at',
  'updated_at',
])

export function isValidUuid(value: string | null | undefined): value is string {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function sanitizeProfilePayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (!PROFILE_COLUMNS.has(key)) continue
    if (value === undefined) continue
    out[key] = value
  }

  if (out.user_id != null && !isValidUuid(String(out.user_id))) {
    delete out.user_id
  }
  if (out.last_assessment_id != null && !isValidUuid(String(out.last_assessment_id))) {
    out.last_assessment_id = null
  }
  if (out.id != null && !isValidUuid(String(out.id))) {
    delete out.id
  }

  return out
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}
