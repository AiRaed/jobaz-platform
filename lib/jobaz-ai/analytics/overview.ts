import type { AiAnalyticsOverview } from './types'
import { countEventsByName, countTableRows, getAnalyticsSupabase } from './supabase'

const EMPTY_OVERVIEW: AiAnalyticsOverview = {
  totalAssessments: 0,
  totalCompletedAssessments: 0,
  totalSignupClicks: 0,
  totalToolClicks: 0,
  completionRatePercent: 0,
}

export async function getAiAnalyticsOverview(): Promise<AiAnalyticsOverview> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) return EMPTY_OVERVIEW

  const [
    totalAssessments,
    totalCompletedAssessments,
    totalSignupClicks,
    totalToolClicks,
    totalStarted,
  ] = await Promise.all([
    countTableRows(supabase, 'ai_career_assessments'),
    countEventsByName(supabase, 'ai_path_completed'),
    countEventsByName(supabase, 'ai_path_signup_clicked'),
    countEventsByName(supabase, 'ai_path_tool_clicked'),
    countEventsByName(supabase, 'ai_path_started'),
  ])

  const completionRatePercent =
    totalStarted > 0
      ? Math.round((totalCompletedAssessments / totalStarted) * 1000) / 10
      : 0

  return {
    totalAssessments,
    totalCompletedAssessments,
    totalSignupClicks,
    totalToolClicks,
    completionRatePercent,
  }
}
