/**
 * JAZ Learning Loop — aggregate activity events for admin insights.
 * Rule-based suggestions only (no auto-modifying AI).
 */

import { getAdminCoursesSupabase, isAdminCoursesSupabaseConfigured } from '@/lib/admin/courses/supabaseServer'
import type { JazCareerEngineLogEntry } from '@/lib/jaz-career-engine/logging/types'

export type JazActivityRow = {
  id: string
  created_at: string
  event_type: string
  event_source: string | null
  goal_path: string | null
  route_title: string | null
  course_id: string | null
  job_id: string | null
  tool_name: string | null
  metadata: Record<string, unknown>
}

export type BehaviourSummary = {
  plans_generated: number
  plans_saved: number
  cv_builder_opens: number
  view_jobs_clicks: number
  apply_now_clicks: number
  save_interest_clicks: number
  job_applications: number
  most_active_goal_path: string | null
  events_table_ready: boolean
  total_events: number
}

export type PopularRouteRow = {
  route_title: string
  goal_path: string
  count: number
  saved_plan_count: number
  cv_open_count: number
  job_click_count: number
  course_click_count: number
  apply_now_count: number
}

export type CourseDemandRow = {
  recommended_course_type: string
  route_title: string
  times_recommended: number
  active_affiliate_matches: number
  missing_affiliate_count: number
  save_interest_count: number
  suggested_priority: 'high' | 'medium' | 'low'
}

export type FunnelRow = {
  route_title: string
  goal_path: string
  plan_generated: number
  plan_saved: number
  cv_builder_opened: number
  jobs_clicked: number
  course_clicked: number
  apply_now_clicked: number
  marked_applied: number
}

export type WeakSignal = {
  kind: string
  route_title: string | null
  goal_path: string | null
  detail: string
  severity: 'high' | 'medium' | 'low'
}

export type ImprovementSuggestion = {
  priority: 'high' | 'medium' | 'low'
  title: string
  detail: string
}

export type LearningLoopSnapshot = {
  behaviour: BehaviourSummary
  popular_routes: PopularRouteRow[]
  course_demand: CourseDemandRow[]
  funnel: FunnelRow[]
  weak_signals: WeakSignal[]
  suggestions: ImprovementSuggestion[]
  note: string | null
}

function emptyBehaviour(ready: boolean): BehaviourSummary {
  return {
    plans_generated: 0,
    plans_saved: 0,
    cv_builder_opens: 0,
    view_jobs_clicks: 0,
    apply_now_clicks: 0,
    save_interest_clicks: 0,
    job_applications: 0,
    most_active_goal_path: null,
    events_table_ready: ready,
    total_events: 0,
  }
}

function countBy(events: JazActivityRow[], type: string | string[]): number {
  const set = new Set(Array.isArray(type) ? type : [type])
  return events.filter((e) => set.has(e.event_type)).length
}

function routeKey(e: Pick<JazActivityRow, 'route_title' | 'goal_path'>): string {
  return `${e.route_title || 'Unknown'}||${e.goal_path || 'unknown'}`
}

function parseRouteKey(key: string): { route_title: string; goal_path: string } {
  const [route_title, goal_path] = key.split('||')
  return { route_title: route_title || 'Unknown', goal_path: goal_path || 'unknown' }
}

export async function listJazActivityEvents(limit = 2000): Promise<{
  events: JazActivityRow[]
  table_ready: boolean
  note: string | null
}> {
  if (!isAdminCoursesSupabaseConfigured()) {
    return {
      events: [],
      table_ready: false,
      note: 'Supabase service role not configured — Learning Loop events cannot load.',
    }
  }

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { events: [], table_ready: false, note: 'Supabase client unavailable.' }
  }

  const { data, error } = await supabase
    .from('jaz_user_activity_events')
    .select(
      'id, created_at, event_type, event_source, goal_path, route_title, course_id, job_id, tool_name, metadata'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    const missing = /schema cache|does not exist|jaz_user_activity_events/i.test(error.message)
    return {
      events: [],
      table_ready: false,
      note: missing
        ? `Events table unavailable. Apply migration supabase/migrations/20250801130000_jaz_user_activity_events.sql in Supabase SQL Editor.`
        : `Events query failed: ${error.message}`,
    }
  }

  const events: JazActivityRow[] = (data || []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    event_type: row.event_type,
    event_source: row.event_source,
    goal_path: row.goal_path,
    route_title: row.route_title,
    course_id: row.course_id,
    job_id: row.job_id,
    tool_name: row.tool_name,
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {},
  }))

  return { events, table_ready: true, note: null }
}

function buildBehaviour(events: JazActivityRow[], tableReady: boolean): BehaviourSummary {
  const goalCounts = new Map<string, number>()
  for (const e of events) {
    if (!e.goal_path) continue
    goalCounts.set(e.goal_path, (goalCounts.get(e.goal_path) || 0) + 1)
  }
  let most: string | null = null
  let mostN = 0
  for (const [g, n] of goalCounts) {
    if (n > mostN) {
      most = g
      mostN = n
    }
  }

  return {
    plans_generated: countBy(events, 'career_plan_generated'),
    plans_saved: countBy(events, 'career_plan_saved'),
    cv_builder_opens: countBy(events, 'cv_builder_opened'),
    view_jobs_clicks: countBy(events, 'job_search_clicked'),
    apply_now_clicks: countBy(events, [
      'course_apply_clicked',
      'job_apply_clicked',
    ]),
    save_interest_clicks: countBy(events, 'course_save_interest_clicked'),
    job_applications: countBy(events, ['job_marked_applied', 'job_apply_clicked']),
    most_active_goal_path: most,
    events_table_ready: tableReady,
    total_events: events.length,
  }
}

function buildPopularRoutes(events: JazActivityRow[]): PopularRouteRow[] {
  const map = new Map<string, PopularRouteRow>()

  for (const e of events) {
    if (!e.route_title && !e.goal_path) continue
    const key = routeKey(e)
    let row = map.get(key)
    if (!row) {
      const parsed = parseRouteKey(key)
      row = {
        route_title: parsed.route_title,
        goal_path: parsed.goal_path,
        count: 0,
        saved_plan_count: 0,
        cv_open_count: 0,
        job_click_count: 0,
        course_click_count: 0,
        apply_now_count: 0,
      }
      map.set(key, row)
    }
    row.count += 1
    if (e.event_type === 'career_plan_saved') row.saved_plan_count += 1
    if (e.event_type === 'cv_builder_opened') row.cv_open_count += 1
    if (e.event_type === 'job_search_clicked') row.job_click_count += 1
    if (
      e.event_type === 'course_apply_clicked' ||
      e.event_type === 'course_card_viewed' ||
      e.event_type === 'course_save_interest_clicked'
    ) {
      row.course_click_count += 1
    }
    if (e.event_type === 'course_apply_clicked' || e.event_type === 'job_apply_clicked') {
      row.apply_now_count += 1
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 25)
}

function buildFunnel(events: JazActivityRow[]): FunnelRow[] {
  const map = new Map<string, FunnelRow>()
  for (const e of events) {
    if (!e.route_title && !e.goal_path) continue
    const key = routeKey(e)
    let row = map.get(key)
    if (!row) {
      const parsed = parseRouteKey(key)
      row = {
        route_title: parsed.route_title,
        goal_path: parsed.goal_path,
        plan_generated: 0,
        plan_saved: 0,
        cv_builder_opened: 0,
        jobs_clicked: 0,
        course_clicked: 0,
        apply_now_clicked: 0,
        marked_applied: 0,
      }
      map.set(key, row)
    }
    switch (e.event_type) {
      case 'career_plan_generated':
        row.plan_generated += 1
        break
      case 'career_plan_saved':
        row.plan_saved += 1
        break
      case 'cv_builder_opened':
        row.cv_builder_opened += 1
        break
      case 'job_search_clicked':
        row.jobs_clicked += 1
        break
      case 'course_apply_clicked':
      case 'course_card_viewed':
      case 'course_save_interest_clicked':
        row.course_clicked += 1
        if (e.event_type === 'course_apply_clicked') row.apply_now_clicked += 1
        break
      case 'job_apply_clicked':
        row.apply_now_clicked += 1
        break
      case 'job_marked_applied':
        row.marked_applied += 1
        break
      default:
        break
    }
  }
  return [...map.values()].sort((a, b) => b.plan_generated - a.plan_generated).slice(0, 25)
}

function buildCourseDemand(
  events: JazActivityRow[],
  engineLogs: JazCareerEngineLogEntry[]
): CourseDemandRow[] {
  const map = new Map<string, CourseDemandRow>()

  for (const log of engineLogs) {
    const route = log.route_title || 'Unknown'
    for (const ct of log.recommended_course_types || []) {
      const title = ct.title || 'Unknown'
      const key = `${title}||${route}`
      let row = map.get(key)
      if (!row) {
        row = {
          recommended_course_type: title,
          route_title: route,
          times_recommended: 0,
          active_affiliate_matches: 0,
          missing_affiliate_count: 0,
          save_interest_count: 0,
          suggested_priority: 'low',
        }
        map.set(key, row)
      }
      row.times_recommended += 1
    }
    for (const m of log.matched_jobaz_courses || []) {
      if (m.primary_button === 'Apply Now' || m.referral_url) {
        const key = `${m.title || 'Matched'}||${route}`
        let row = map.get(key)
        if (!row) {
          row = {
            recommended_course_type: m.title || 'Matched',
            route_title: route,
            times_recommended: 0,
            active_affiliate_matches: 0,
            missing_affiliate_count: 0,
            save_interest_count: 0,
            suggested_priority: 'low',
          }
          map.set(key, row)
        }
        row.active_affiliate_matches += 1
      }
    }
    for (const miss of log.missing_affiliate_opportunities || []) {
      const title = miss.course_type || 'Unknown'
      const key = `${title}||${route}`
      let row = map.get(key)
      if (!row) {
        row = {
          recommended_course_type: title,
          route_title: route,
          times_recommended: 0,
          active_affiliate_matches: 0,
          missing_affiliate_count: 0,
          save_interest_count: 0,
          suggested_priority: 'low',
        }
        map.set(key, row)
      }
      row.missing_affiliate_count += 1
      row.times_recommended += 1
    }
  }

  for (const e of events) {
    if (e.event_type !== 'course_save_interest_clicked') continue
    const courseType =
      (typeof e.metadata.course_type === 'string' && e.metadata.course_type) ||
      (typeof e.metadata.course_title === 'string' && e.metadata.course_title) ||
      e.course_id ||
      'Unknown'
    const route = e.route_title || 'Unknown'
    const key = `${courseType}||${route}`
    let row = map.get(key)
    if (!row) {
      row = {
        recommended_course_type: courseType,
        route_title: route,
        times_recommended: 0,
        active_affiliate_matches: 0,
        missing_affiliate_count: 0,
        save_interest_count: 0,
        suggested_priority: 'low',
      }
      map.set(key, row)
    }
    row.save_interest_count += 1
  }

  for (const row of map.values()) {
    if (row.missing_affiliate_count >= 3 || row.save_interest_count >= 3) {
      row.suggested_priority = 'high'
    } else if (row.missing_affiliate_count >= 1 || row.save_interest_count >= 1) {
      row.suggested_priority = 'medium'
    } else {
      row.suggested_priority = 'low'
    }
  }

  return [...map.values()]
    .sort(
      (a, b) =>
        b.missing_affiliate_count + b.save_interest_count -
        (a.missing_affiliate_count + a.save_interest_count)
    )
    .slice(0, 30)
}

function buildWeakSignals(
  events: JazActivityRow[],
  funnel: FunnelRow[],
  engineLogs: JazCareerEngineLogEntry[],
  courseDemand: CourseDemandRow[]
): WeakSignal[] {
  const signals: WeakSignal[] = []

  for (const f of funnel) {
    if (f.plan_generated >= 3 && f.plan_saved === 0) {
      signals.push({
        kind: 'low_save_rate',
        route_title: f.route_title,
        goal_path: f.goal_path,
        detail: `${f.plan_generated} plans generated but none saved`,
        severity: 'high',
      })
    }
    if (f.plan_generated >= 2 && f.course_clicked === 0 && f.jobs_clicked === 0) {
      signals.push({
        kind: 'no_cta_clicks',
        route_title: f.route_title,
        goal_path: f.goal_path,
        detail: 'Plans generated but no job or course clicks yet',
        severity: 'medium',
      })
    }
    if (f.jobs_clicked >= 3 && f.cv_builder_opened === 0) {
      signals.push({
        kind: 'jobs_without_cv',
        route_title: f.route_title,
        goal_path: f.goal_path,
        detail: 'Users click View Jobs but not CV Builder',
        severity: 'medium',
      })
    }
  }

  for (const c of courseDemand) {
    if (c.times_recommended >= 2 && c.active_affiliate_matches === 0 && c.missing_affiliate_count > 0) {
      signals.push({
        kind: 'missing_affiliate',
        route_title: c.route_title,
        goal_path: null,
        detail: `${c.recommended_course_type} recommended often with no active affiliate`,
        severity: c.suggested_priority === 'high' ? 'high' : 'medium',
      })
    }
  }

  const wrongRoute = engineLogs.filter((l) => l.admin_feedback === 'wrong_route').length
  const wrongCourse = engineLogs.filter((l) => l.admin_feedback === 'wrong_course').length
  if (wrongRoute > 0) {
    signals.push({
      kind: 'admin_wrong_route',
      route_title: null,
      goal_path: null,
      detail: `${wrongRoute} admin feedback marked wrong route`,
      severity: wrongRoute >= 2 ? 'high' : 'medium',
    })
  }
  if (wrongCourse > 0) {
    signals.push({
      kind: 'admin_wrong_course',
      route_title: null,
      goal_path: null,
      detail: `${wrongCourse} admin feedback marked wrong course`,
      severity: wrongCourse >= 2 ? 'high' : 'medium',
    })
  }

  const fallback = engineLogs.filter((l) => l.plan_source === 'jaz_fallback').length
  if (engineLogs.length >= 3 && fallback / engineLogs.length >= 0.5) {
    signals.push({
      kind: 'high_fallback',
      route_title: null,
      goal_path: null,
      detail: `Fallback usage high (${fallback}/${engineLogs.length}). Check Ollama connection.`,
      severity: 'high',
    })
  }

  const safetyHeavy = engineLogs.filter((l) => (l.safety_warnings_count || 0) >= 2).length
  if (safetyHeavy >= 2) {
    signals.push({
      kind: 'frequent_safety',
      route_title: null,
      goal_path: null,
      detail: `${safetyHeavy} plans with multiple safety warnings`,
      severity: 'medium',
    })
  }

  if (events.length === 0 && engineLogs.length === 0) {
    return []
  }

  return signals.slice(0, 20)
}

function buildSuggestions(
  weak: WeakSignal[],
  courseDemand: CourseDemandRow[],
  funnel: FunnelRow[]
): ImprovementSuggestion[] {
  const out: ImprovementSuggestion[] = []

  for (const c of courseDemand) {
    if (c.missing_affiliate_count > 0 && c.active_affiliate_matches === 0) {
      out.push({
        priority: c.suggested_priority,
        title: `${c.recommended_course_type} needs an affiliate`,
        detail: `${c.recommended_course_type} appears for “${c.route_title}” but has no active affiliate. Add a provider in Admin Courses.`,
      })
    }
  }

  for (const f of funnel) {
    if (f.plan_saved >= 2 && f.course_clicked === 0) {
      out.push({
        priority: 'medium',
        title: `Review course cards for ${f.route_title}`,
        detail: `High plan saves but low course clicks on ${f.goal_path}. Review recommended training CTAs.`,
      })
    }
    if (f.jobs_clicked >= 2 && f.cv_builder_opened === 0) {
      out.push({
        priority: 'medium',
        title: `Improve CV CTA for ${f.route_title}`,
        detail: `Users often click View Jobs but not CV Builder on this path.`,
      })
    }
  }

  for (const w of weak) {
    if (w.kind === 'high_fallback') {
      out.push({
        priority: 'high',
        title: 'Check Ollama connection',
        detail: w.detail,
      })
    }
  }

  // Deduplicate by title
  const seen = new Set<string>()
  return out
    .filter((s) => {
      if (seen.has(s.title)) return false
      seen.add(s.title)
      return true
    })
    .slice(0, 15)
}

export async function buildLearningLoopSnapshot(
  engineLogs: JazCareerEngineLogEntry[]
): Promise<LearningLoopSnapshot> {
  const { events, table_ready, note } = await listJazActivityEvents(2500)
  const behaviour = buildBehaviour(events, table_ready)
  const popular_routes = buildPopularRoutes(events)
  const funnel = buildFunnel(events)
  const course_demand = buildCourseDemand(events, engineLogs)
  const weak_signals = buildWeakSignals(events, funnel, engineLogs, course_demand)
  const suggestions = buildSuggestions(weak_signals, course_demand, funnel)

  return {
    behaviour,
    popular_routes,
    course_demand,
    funnel,
    weak_signals,
    suggestions,
    note,
  }
}
