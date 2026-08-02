export type CourseClickSource =
  | 'courses_marketplace'
  | 'pathway_result'
  | 'dashboard_training'
  | 'course_detail'
  | 'career_coach_result'
  | 'education_path_result'
  | 'uk_career_assistant'
  | 'my_plan'
  | 'assistant_result'
  | 'cv_builder'
  | 'courses_page'

export type CourseClickAction = 'apply_now' | 'view_details' | 'save_to_plan' | 'referral_click'

export type TrackCourseEventInput = {
  courseId: string
  source: CourseClickSource
  action: CourseClickAction
  userId?: string | null
  providerName?: string | null
  /** Actual URL opened for apply_now clicks */
  referralUrl?: string | null
  /** Optional route label e.g. Security extra income */
  route?: string | null
  /** Guest / anonymous session id when available */
  sessionId?: string | null
}

function readGuestSessionId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('jobaz_ca_last_result_v1')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { sessionId?: string }
    return parsed.sessionId?.trim() || null
  } catch {
    return null
  }
}

/** Fire-and-forget event tracking for marketplace analytics. */
export async function trackCourseEvent(input: TrackCourseEventInput): Promise<void> {
  try {
    const sessionId = input.sessionId ?? readGuestSessionId()
    await fetch('/api/career-hub/courses/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        sessionId,
        // Alias apply_now as referral_click for analytics clarity when opening affiliate URL
        action: input.action === 'apply_now' ? 'apply_now' : input.action,
      }),
    })
  } catch {
    // non-blocking
  }
}

/** @deprecated use trackCourseEvent */
export async function trackCourseClick(
  input: Pick<TrackCourseEventInput, 'courseId' | 'source' | 'userId'>
): Promise<void> {
  return trackCourseEvent({ ...input, action: 'apply_now' })
}
