import type { AiProfilesOverview } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

const EMPTY_PROFILES: AiProfilesOverview = {
  totalProfiles: 0,
  returningProfiles: 0,
  averageReadinessScore: 0,
  averageEngagementScore: 0,
  mostCommonDominantGoal: '—',
  mostCommonLastRecommendedPath: '—',
}

type ProfileAnalyticsRow = {
  dominant_goal: string | null
  last_recommended_path: string | null
  readiness_score: number | null
  engagement_score: number | null
  assessment_count: number | null
}

function modeOf(values: string[]): string {
  if (values.length === 0) return '—'
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best = values[0]
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

export async function getAiProfilesOverview(): Promise<AiProfilesOverview> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) return EMPTY_PROFILES

  const { data, error } = await supabase
    .from('ai_user_profiles')
    .select(
      'dominant_goal, last_recommended_path, readiness_score, engagement_score, assessment_count'
    )

  if (error) {
    analyticsDevLog('AI profiles overview query failed', error)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[JobAZ AI Analytics] ai_user_profiles query failed', error)
    }
    return EMPTY_PROFILES
  }

  const rows = (data ?? []) as ProfileAnalyticsRow[]
  if (rows.length === 0) return EMPTY_PROFILES

  const totalProfiles = rows.length
  const returningProfiles = rows.filter((r) => (r.assessment_count ?? 0) >= 2).length

  const readinessSum = rows.reduce((sum, r) => sum + (r.readiness_score ?? 0), 0)
  const engagementSum = rows.reduce((sum, r) => sum + (r.engagement_score ?? 0), 0)

  const goals = rows
    .map((r) => r.dominant_goal?.trim())
    .filter((g): g is string => Boolean(g))
  const paths = rows
    .map((r) => r.last_recommended_path?.trim())
    .filter((p): p is string => Boolean(p))

  return {
    totalProfiles,
    returningProfiles,
    averageReadinessScore: Math.round(readinessSum / totalProfiles),
    averageEngagementScore: Math.round(engagementSum / totalProfiles),
    mostCommonDominantGoal: modeOf(goals),
    mostCommonLastRecommendedPath: modeOf(paths),
  }
}
