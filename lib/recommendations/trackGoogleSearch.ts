export type GoogleSearchClickInput = {
  courseOpportunityId?: string
  publishedCourseId?: string
  title: string
  suggestedSearchKeywords: string
  source?: string
}

export async function trackGoogleCourseSearchClick(input: GoogleSearchClickInput): Promise<void> {
  try {
    await fetch('/api/analytics/course-google-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'course_google_search_click',
        course_opportunity_id: input.courseOpportunityId ?? null,
        published_course_id: input.publishedCourseId ?? null,
        title: input.title,
        suggested_search_keywords: input.suggestedSearchKeywords,
        source: input.source ?? 'career_coach_result',
      }),
    })
  } catch {
    // non-blocking
  }
}
