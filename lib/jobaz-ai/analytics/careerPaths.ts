import type { CareerPathStatRow } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

export async function getCareerPathStats(): Promise<CareerPathStatRow[]> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ai_career_assessments')
    .select('recommended_path')

  if (error) {
    analyticsDevLog('Career path stats query failed', error)
    return []
  }

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const path = row.recommended_path?.trim() || 'Unknown'
    counts.set(path, (counts.get(path) ?? 0) + 1)
  }

  const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0)
  if (total === 0) return []

  return Array.from(counts.entries())
    .map(([recommendedPath, count]) => ({
      recommendedPath,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)
}
