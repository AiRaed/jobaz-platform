import type { ToolClickStatRow } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

export async function getToolClickStats(): Promise<ToolClickStatRow[]> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('ai_career_events')
    .select('metadata')
    .eq('event_name', 'ai_path_tool_clicked')

  if (error) {
    analyticsDevLog('Tool click stats failed', error)
    return []
  }

  const counts = new Map<string, { toolName: string; count: number }>()

  for (const row of data ?? []) {
    const meta = row.metadata as Record<string, unknown> | null
    const toolName =
      (typeof meta?.tool_name === 'string' && meta.tool_name) ||
      (typeof meta?.tool_id === 'string' && meta.tool_id) ||
      'Unknown'
    const key = toolName.toLowerCase()
    const existing = counts.get(key)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(key, { toolName, count: 1 })
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .map((row, index) => ({
      rank: index + 1,
      toolName: row.toolName,
      count: row.count,
    }))
}
