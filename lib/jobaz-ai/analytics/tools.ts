import { TOOL_CATALOG } from '@/lib/jobaz-ai/engines/careerAssessment/toolCatalog'
import type { ToolStatRow } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

/** Dashboard focus tools (expandable later). */
const DASHBOARD_TOOL_IDS = [
  'cv_builder',
  'job_finder',
  'writing_review',
  'interview_coach',
] as const

const TOOL_NAME_BY_ID: Record<string, string> = {
  cv_builder: TOOL_CATALOG.cvBuilder.name,
  job_finder: TOOL_CATALOG.jobFinder.name,
  writing_review: TOOL_CATALOG.writingReview.name,
  interview_coach: TOOL_CATALOG.interviewCoach.name,
}

type RecommendedToolRow = { id?: string; name?: string }

export async function getToolStats(): Promise<ToolStatRow[]> {
  const supabase = getAnalyticsSupabase()
  const empty = DASHBOARD_TOOL_IDS.map((toolId) => ({
    toolId,
    toolName: TOOL_NAME_BY_ID[toolId] ?? toolId,
    count: 0,
  }))

  if (!supabase) return empty

  const { data, error } = await supabase
    .from('ai_career_assessments')
    .select('recommended_tools')

  if (error) {
    analyticsDevLog('Tool stats query failed', error)
    return empty
  }

  const counts = new Map<string, number>(
    DASHBOARD_TOOL_IDS.map((id) => [id, 0])
  )

  for (const row of data ?? []) {
    const tools = row.recommended_tools as RecommendedToolRow[] | null
    if (!Array.isArray(tools)) continue

    const seenInRow = new Set<string>()
    for (const tool of tools) {
      const id = normalizeToolId(tool.id, tool.name)
      if (!id || !counts.has(id) || seenInRow.has(id)) continue
      seenInRow.add(id)
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  return DASHBOARD_TOOL_IDS.map((toolId) => ({
    toolId,
    toolName: TOOL_NAME_BY_ID[toolId] ?? toolId,
    count: counts.get(toolId) ?? 0,
  }))
}

function normalizeToolId(id?: string, name?: string): string | null {
  if (id && DASHBOARD_TOOL_IDS.includes(id as (typeof DASHBOARD_TOOL_IDS)[number])) {
    return id
  }
  const normalizedName = (name ?? '').toLowerCase()
  if (normalizedName.includes('cv')) return 'cv_builder'
  if (normalizedName.includes('job finder')) return 'job_finder'
  if (normalizedName.includes('writing')) return 'writing_review'
  if (normalizedName.includes('interview')) return 'interview_coach'
  return null
}
