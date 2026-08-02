import type { ReadinessByPathRow } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

export async function getReadinessByPath(): Promise<ReadinessByPathRow[]> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ai_user_profiles')
    .select('last_recommended_path, readiness_score')
    .not('last_recommended_path', 'is', null)

  if (error) {
    analyticsDevLog('Readiness by path failed', error)
    return []
  }

  const buckets = new Map<string, { sum: number; count: number }>()

  for (const row of data ?? []) {
    const path = (row.last_recommended_path as string)?.trim()
    if (!path) continue
    const score = typeof row.readiness_score === 'number' ? row.readiness_score : 0
    const bucket = buckets.get(path) ?? { sum: 0, count: 0 }
    bucket.sum += score
    bucket.count += 1
    buckets.set(path, bucket)
  }

  return Array.from(buckets.entries())
    .map(([recommendedPath, { sum, count }]) => ({
      recommendedPath,
      averageReadiness: Math.round(sum / count),
      profileCount: count,
    }))
    .sort((a, b) => b.profileCount - a.profileCount)
}
