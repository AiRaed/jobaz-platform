/**
 * Admin analytics for JAZ Plan Engine (rule-based).
 */

import { getAdminCoursesSupabase, isAdminCoursesSupabaseConfigured } from '@/lib/admin/courses/supabaseServer'

export type PlanEngineAdminSnapshot = {
  table_ready: boolean
  note: string | null
  api_endpoint: '/api/jaz-plan/generate'
  engine_version: 'jaz-plan-engine-v1'
  openai_disabled: true
  generated_plans_count: number
  completed_steps_count: number
  skipped_steps_count: number
  fallback_plans_count: number
  ollama_plans_count: number
  most_common_next_actions: Array<{ title: string; count: number }>
  completion_rates: {
    cv_action: number | null
    job_action: number | null
    course_action: number | null
  }
  weak_signals: Array<{ kind: string; detail: string; severity: 'high' | 'medium' | 'low' }>
  suggestions: Array<{ priority: 'high' | 'medium' | 'low'; title: string; detail: string }>
}

export async function buildPlanEngineAdminSnapshot(): Promise<PlanEngineAdminSnapshot> {
  const empty: PlanEngineAdminSnapshot = {
    table_ready: false,
    note: null,
    api_endpoint: '/api/jaz-plan/generate',
    engine_version: 'jaz-plan-engine-v1',
    openai_disabled: true,
    generated_plans_count: 0,
    completed_steps_count: 0,
    skipped_steps_count: 0,
    fallback_plans_count: 0,
    ollama_plans_count: 0,
    most_common_next_actions: [],
    completion_rates: { cv_action: null, job_action: null, course_action: null },
    weak_signals: [],
    suggestions: [],
  }

  if (!isAdminCoursesSupabaseConfigured()) {
    return { ...empty, note: 'Supabase service role not configured' }
  }
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return { ...empty, note: 'No Supabase client' }

  const { data: plans, error: planErr } = await supabase
    .from('jaz_user_action_plans')
    .select('id, plan_source, ai_provider, route_title, goal_path, next_best_action, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (planErr) {
    const missing = /schema cache|does not exist|jaz_user_action_plans/i.test(planErr.message)
    return {
      ...empty,
      table_ready: false,
      note: missing
        ? 'Apply migration supabase/migrations/20250801140000_jaz_plan_engine.sql'
        : planErr.message,
    }
  }

  const planRows = plans || []
  const { data: steps } = await supabase
    .from('jaz_plan_steps')
    .select('id, category, status, title, priority')
    .limit(2000)

  const stepRows = steps || []
  const completed = stepRows.filter((s) => s.status === 'done').length
  const skipped = stepRows.filter((s) => s.status === 'skipped').length

  const rate = (cat: string) => {
    const rows = stepRows.filter((s) => s.category === cat)
    if (!rows.length) return null
    const done = rows.filter((s) => s.status === 'done').length
    return Math.round((done / rows.length) * 1000) / 10
  }

  const nextCounts = new Map<string, number>()
  for (const p of planRows) {
    const nba = p.next_best_action as { title?: string } | null
    const title = nba?.title || '—'
    nextCounts.set(title, (nextCounts.get(title) || 0) + 1)
  }
  const most_common_next_actions = [...nextCounts.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const weak_signals: PlanEngineAdminSnapshot['weak_signals'] = []
  const cvRate = rate('cv')
  const jobRate = rate('jobs')
  const courseRate = rate('course')

  if (planRows.length >= 3 && (cvRate ?? 100) < 20) {
    weak_signals.push({
      kind: 'low_cv_completion',
      detail: 'Many plans generated but few CV actions completed',
      severity: 'high',
    })
  }
  if ((jobRate ?? 100) < 15 && planRows.length >= 3) {
    weak_signals.push({
      kind: 'jobs_not_applied',
      detail: 'Users open plans but few job actions are completed',
      severity: 'high',
    })
  }
  if (skipped >= 5) {
    weak_signals.push({
      kind: 'frequent_skips',
      detail: `${skipped} steps skipped — review step clarity / CTA`,
      severity: 'medium',
    })
  }
  if (
    planRows.filter((p) => p.plan_source === 'jaz_plan_fallback').length >
    planRows.length * 0.8
  ) {
    weak_signals.push({
      kind: 'mostly_fallback',
      detail: 'Most plans use jaz_plan_fallback (expected until Plan Ollama is enabled)',
      severity: 'low',
    })
  }

  const suggestions: PlanEngineAdminSnapshot['suggestions'] = []
  for (const p of planRows.slice(0, 40)) {
    const route = (p.route_title || '').toLowerCase()
    if (/warehouse|forklift/.test(route) && (courseRate ?? 100) < 25) {
      suggestions.push({
        priority: 'high',
        title: 'Warehouse route needs Forklift affiliate',
        detail: 'Users on Warehouse route often need Forklift provider. Add affiliate.',
      })
    }
    if (/care/.test(route) && (cvRate ?? 0) > 40 && (jobRate ?? 100) < 20) {
      suggestions.push({
        priority: 'medium',
        title: 'Improve Care CV → Jobs CTA',
        detail: 'Users on Care route open CV but do not click jobs. Improve care CV CTA.',
      })
    }
    if (/teach|tutor|tefl/.test(route) && (courseRate ?? 100) < 20) {
      suggestions.push({
        priority: 'high',
        title: 'Review TEFL course availability',
        detail: 'Users on Teaching route save plan but no course click. Review TEFL course availability.',
      })
    }
  }
  if (planRows.length >= 5 && completed < planRows.length) {
    suggestions.push({
      priority: 'medium',
      title: 'Make Next Best Action more visible',
      detail: 'Many users stop after plan generation. Make Next Best Action more visible.',
    })
  }

  const seen = new Set<string>()
  const uniqueSuggestions = suggestions.filter((s) => {
    if (seen.has(s.title)) return false
    seen.add(s.title)
    return true
  }).slice(0, 10)

  return {
    table_ready: true,
    note: null,
    api_endpoint: '/api/jaz-plan/generate',
    engine_version: 'jaz-plan-engine-v1',
    openai_disabled: true,
    generated_plans_count: planRows.length,
    completed_steps_count: completed,
    skipped_steps_count: skipped,
    fallback_plans_count: planRows.filter((p) => p.plan_source === 'jaz_plan_fallback').length,
    ollama_plans_count: planRows.filter((p) => p.ai_provider === 'ollama').length,
    most_common_next_actions,
    completion_rates: {
      cv_action: cvRate,
      job_action: jobRate,
      course_action: courseRate,
    },
    weak_signals,
    suggestions: uniqueSuggestions,
  }
}
