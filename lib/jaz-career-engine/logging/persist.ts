/**
 * Persist JAZ Career Engine analysis logs (memory + Supabase).
 * DB write failures never break the user-facing analyse response.
 */

import { randomUUID } from 'crypto'
import { getAdminCoursesSupabase, isAdminCoursesSupabaseConfigured } from '@/lib/admin/courses/supabaseServer'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'
import type { JazAnalyseInput, JazAnalyseResult } from '../types'
import {
  getLastEngineError,
  getLastOllamaError,
  getMemoryLog,
  getOllamaRuntimeStatus,
  listMemoryLogs,
  pushMemoryLog,
  setLastEngineError,
  setLastOllamaError,
  updateMemoryFeedback,
} from './memoryStore'
import type {
  JazCareerEngineLogEntry,
  JazLogAdminFeedback,
  JazLogPlanSource,
} from './types'

function redactRequest(input: JazAnalyseInput): Record<string, unknown> {
  return {
    goal: input.goal,
    skills: input.skills,
    education: input.education,
    experience: input.experience,
    availability: input.availability,
    language_level: input.language_level,
    has_driving_licence: input.has_driving_licence,
    work_mode_preference: input.work_mode_preference,
    answer_keys: Object.keys(input.answers || {}),
    preference_keys: Object.keys(input.preferences || {}),
    session_id: input.session_id ? '[present]' : null,
    user_id: input.user_id ? '[present]' : null,
  }
}

function compactResponse(result: JazAnalyseResult): Record<string, unknown> {
  return {
    engine_version: result.engine_version,
    ai_provider: result.ai_provider,
    route_title: result.route_title,
    route_category: result.route_category,
    current_focus: result.current_focus,
    next_upgrade: result.next_upgrade,
    readiness: result.readiness,
    work_now_roles: result.work_now_roles.map((r) => r.title),
    recommended_course_types: result.recommended_course_types,
    matched_jobaz_courses: result.matched_jobaz_courses.map((c) => ({
      course_id: c.course_id,
      title: c.title,
      commercial_status: c.commercial_status,
      primary_button: c.primary_button,
      has_referral: Boolean(c.referral_url),
    })),
    missing_affiliate_opportunities: result.missing_affiliate_opportunities,
    safety_warnings: result.safety_notes,
    debug: result.debug,
  }
}

export function resolvePlanSource(result: JazAnalyseResult): JazLogPlanSource {
  if (result.ai_provider === 'ollama') return 'jaz'
  return 'jaz_fallback'
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => (typeof v === 'string' ? v : String(v)))
}

export type LogAnalyseOptions = {
  goalPath?: string
  input: JazAnalyseInput
  result: JazAnalyseResult
  durationMs?: number
  anonymousId?: string | null
}

function asUuidOrNull(v: string | null | undefined): string | null {
  if (!v) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  )
    ? v
    : null
}

function toDbRow(entry: JazCareerEngineLogEntry) {
  return {
    id: entry.id,
    created_at: entry.created_at,
    user_id: asUuidOrNull(entry.user_id),
    anonymous_id: entry.anonymous_id,
    session_id: entry.session_id,
    goal_path: entry.goal_path,
    route_title: entry.route_title,
    route_category: entry.route_category,
    current_focus: entry.current_focus,
    next_upgrade: entry.next_upgrade,
    plan_source: entry.plan_source,
    ai_provider: entry.ai_provider,
    engine_version: entry.engine_version,
    readiness: entry.readiness,
    recommended_course_types: entry.recommended_course_types,
    matched_jobaz_courses: entry.matched_jobaz_courses,
    missing_affiliate_opportunities: entry.missing_affiliate_opportunities,
    safety_warnings: entry.safety_notes,
    request_payload: entry.request_payload,
    response_payload: entry.response_payload,
    response_time_ms: entry.duration_ms,
    error_message: entry.ollama_error,
  }
}

export async function logJazCareerAnalyse(opts: LogAnalyseOptions): Promise<JazCareerEngineLogEntry> {
  const { input, result } = opts
  const plan_source = resolvePlanSource(result)
  const ollamaError = result.debug?.ollama_error || null

  if (ollamaError) setLastOllamaError(ollamaError)
  setLastEngineError(null)

  const entry: JazCareerEngineLogEntry = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    goal_path: opts.goalPath || String(input.goal || 'unknown'),
    route_title: result.route_title,
    route_category: result.route_category,
    current_focus: result.current_focus,
    next_upgrade: result.next_upgrade,
    plan_source,
    ai_provider: result.ai_provider,
    engine_version: result.engine_version,
    readiness: result.readiness ?? null,
    matched_courses_count: result.matched_jobaz_courses.length,
    safety_warnings_count: result.safety_notes.length,
    user_id: input.user_id || null,
    anonymous_id: opts.anonymousId || null,
    session_id: input.session_id || null,
    duration_ms: opts.durationMs ?? null,
    ollama_error: ollamaError,
    safety_notes: result.safety_notes,
    recommended_course_types: result.recommended_course_types.map((c) => ({
      title: c.title,
      priority: c.priority,
    })),
    matched_jobaz_courses: result.matched_jobaz_courses.map((c) => ({
      course_id: c.course_id,
      title: c.title,
      commercial_status: c.commercial_status,
      primary_button: c.primary_button,
      referral_url: c.referral_url ? '[set]' : null,
    })),
    missing_affiliate_opportunities: result.missing_affiliate_opportunities.map((m) => ({
      course_type: m.course_type,
      reason: m.reason,
      suggested_category: m.suggested_category,
      priority: m.priority,
    })),
    request_payload: redactRequest(input),
    response_payload: compactResponse(result),
    admin_feedback: null,
    admin_feedback_note: null,
    admin_feedback_at: null,
  }

  pushMemoryLog(entry)

  try {
    if (isAdminCoursesSupabaseConfigured()) {
      const supabase = getAdminCoursesSupabase()
      if (supabase) {
        const { error } = await supabase.from('jaz_career_engine_logs').insert(toDbRow(entry))
        if (error) {
          console.warn('[jaz-career-log] supabase insert skipped:', error.message)
        }
      }
    }
  } catch (err) {
    console.warn('[jaz-career-log] supabase insert failed', err)
  }

  // Learning Loop — never blocks analyse UX
  void trackJazEventServer({
    event_type: 'career_plan_generated',
    event_source: 'jaz_career_engine',
    user_id: entry.user_id,
    anonymous_id: entry.anonymous_id,
    session_id: entry.session_id,
    goal_path: entry.goal_path,
    route_title: entry.route_title,
    career_plan_id: entry.id,
    metadata: {
      engine_version: entry.engine_version,
      plan_source: entry.plan_source,
      ai_provider: entry.ai_provider,
      recommended_course_types_count: entry.recommended_course_types.length,
      matched_courses_count: entry.matched_courses_count,
      missing_affiliate_count: entry.missing_affiliate_opportunities.length,
      safety_warnings_count: entry.safety_warnings_count,
      engine_log_id: entry.id,
    },
  })

  for (const miss of entry.missing_affiliate_opportunities.slice(0, 5)) {
    void trackJazEventServer({
      event_type: 'course_missing_affiliate_detected',
      event_source: 'jaz_career_engine',
      user_id: entry.user_id,
      anonymous_id: entry.anonymous_id,
      session_id: entry.session_id,
      goal_path: entry.goal_path,
      route_title: entry.route_title,
      career_plan_id: entry.id,
      metadata: {
        course_type: miss.course_type,
        route_category: entry.route_category || miss.suggested_category,
        priority: miss.priority,
        reason: miss.reason,
      },
    })
  }

  return entry
}

export async function logJazCareerFailure(opts: {
  goalPath?: string
  input?: JazAnalyseInput
  error: string
  durationMs?: number
}): Promise<void> {
  setLastEngineError(opts.error)
  const entry: JazCareerEngineLogEntry = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    goal_path: opts.goalPath || String(opts.input?.goal || 'unknown'),
    route_title: null,
    route_category: null,
    current_focus: null,
    next_upgrade: null,
    plan_source: 'legacy',
    ai_provider: 'legacy',
    engine_version: null,
    readiness: null,
    matched_courses_count: 0,
    safety_warnings_count: 1,
    user_id: opts.input?.user_id || null,
    anonymous_id: null,
    session_id: opts.input?.session_id || null,
    duration_ms: opts.durationMs ?? null,
    ollama_error: opts.error,
    safety_notes: [opts.error],
    recommended_course_types: [],
    matched_jobaz_courses: [],
    missing_affiliate_opportunities: [],
    request_payload: opts.input ? redactRequest(opts.input) : null,
    response_payload: { error: opts.error },
    admin_feedback: null,
  }
  pushMemoryLog(entry)

  try {
    if (isAdminCoursesSupabaseConfigured()) {
      const supabase = getAdminCoursesSupabase()
      if (supabase) {
        const { error } = await supabase.from('jaz_career_engine_logs').insert(toDbRow(entry))
        if (error) {
          console.warn('[jaz-career-log] failure-row insert skipped:', error.message)
        }
      }
    }
  } catch (err) {
    console.warn('[jaz-career-log] failure-row insert failed', err)
  }
}

export function mapRow(row: Record<string, unknown>): JazCareerEngineLogEntry {
  const safety =
    asStringArray(row.safety_warnings).length > 0
      ? asStringArray(row.safety_warnings)
      : asStringArray(row.safety_notes)

  const matched = Array.isArray(row.matched_jobaz_courses)
    ? (row.matched_jobaz_courses as JazCareerEngineLogEntry['matched_jobaz_courses'])
    : []
  const duration =
    row.response_time_ms != null
      ? Number(row.response_time_ms)
      : row.duration_ms != null
        ? Number(row.duration_ms)
        : null

  return {
    id: String(row.id),
    created_at: String(row.created_at),
    goal_path: String(row.goal_path || 'unknown'),
    route_title: (row.route_title as string) ?? null,
    route_category: (row.route_category as string) ?? null,
    current_focus: (row.current_focus as string) ?? null,
    next_upgrade: (row.next_upgrade as string) ?? null,
    plan_source: (row.plan_source as JazLogPlanSource) || 'jaz_fallback',
    ai_provider: String(row.ai_provider || 'fallback'),
    engine_version: (row.engine_version as string) ?? null,
    readiness: row.readiness == null ? null : Number(row.readiness),
    matched_courses_count: matched.length || Number(row.matched_courses_count || 0),
    safety_warnings_count: safety.length || Number(row.safety_warnings_count || 0),
    user_id: (row.user_id as string) ?? null,
    anonymous_id: (row.anonymous_id as string) ?? null,
    session_id: (row.session_id as string) ?? null,
    duration_ms: duration,
    ollama_error: ((row.error_message as string) ?? (row.ollama_error as string)) || null,
    safety_notes: safety,
    recommended_course_types: Array.isArray(row.recommended_course_types)
      ? (row.recommended_course_types as JazCareerEngineLogEntry['recommended_course_types'])
      : [],
    matched_jobaz_courses: matched,
    missing_affiliate_opportunities: Array.isArray(row.missing_affiliate_opportunities)
      ? (row.missing_affiliate_opportunities as JazCareerEngineLogEntry['missing_affiliate_opportunities'])
      : [],
    request_payload: (row.request_payload as Record<string, unknown>) ?? null,
    response_payload: (row.response_payload as Record<string, unknown>) ?? null,
    admin_feedback: (row.admin_feedback as JazLogAdminFeedback) ?? null,
    admin_feedback_note: (row.admin_feedback_note as string) ?? null,
    admin_feedback_at: (row.admin_feedback_at as string) ?? null,
  }
}

export async function listJazCareerLogs(limit = 40): Promise<{
  logs: JazCareerEngineLogEntry[]
  source: 'supabase' | 'memory' | 'none'
  note: string | null
  table_ready: boolean
}> {
  if (isAdminCoursesSupabaseConfigured()) {
    const supabase = getAdminCoursesSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('jaz_career_engine_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!error && data) {
          const rows = data.map((r) => mapRow(r as Record<string, unknown>))

          // Attach latest feedback per log (if feedback table exists)
          try {
            const ids = rows.map((r) => r.id)
            if (ids.length) {
              const { data: feedbackRows } = await supabase
                .from('jaz_career_engine_feedback')
                .select('log_id, feedback_type, notes, created_at')
                .in('log_id', ids)
                .order('created_at', { ascending: false })

              if (feedbackRows?.length) {
                const latest = new Map<string, { feedback_type: string; notes: string | null; created_at: string }>()
                for (const f of feedbackRows) {
                  const logId = String((f as { log_id: string }).log_id)
                  if (!latest.has(logId)) {
                    latest.set(logId, {
                      feedback_type: String((f as { feedback_type: string }).feedback_type),
                      notes: ((f as { notes: string | null }).notes) ?? null,
                      created_at: String((f as { created_at: string }).created_at),
                    })
                  }
                }
                for (const row of rows) {
                  const fb = latest.get(row.id)
                  if (fb) {
                    row.admin_feedback = fb.feedback_type as JazLogAdminFeedback
                    row.admin_feedback_note = fb.notes
                    row.admin_feedback_at = fb.created_at
                  }
                }
              }
            }
          } catch {
            // feedback table optional
          }

          const mem = listMemoryLogs(limit)
          const ids = new Set(rows.map((r) => r.id))
          const merged = [...mem.filter((m) => !ids.has(m.id)), ...rows].slice(0, limit)
          return {
            logs: merged,
            source: 'supabase',
            table_ready: true,
            note:
              rows.length === 0 && mem.length === 0
                ? 'Table ready. No analyses logged yet — run Career Assistant once.'
                : null,
          }
        }
        if (error) {
          const mem = listMemoryLogs(limit)
          const missingTable = /schema cache|does not exist|jaz_career_engine_logs/i.test(
            error.message
          )
          return {
            logs: mem,
            source: mem.length ? 'memory' : 'none',
            table_ready: false,
            note: missingTable
              ? `Database table unavailable (${error.message}). Apply migration supabase/migrations/20250801120000_jaz_career_engine_logs.sql in the Supabase SQL Editor, then refresh.`
              : `Database read error (${error.message}). Showing in-memory logs only.`,
          }
        }
      } catch (err) {
        const mem = listMemoryLogs(limit)
        return {
          logs: mem,
          source: mem.length ? 'memory' : 'none',
          table_ready: false,
          note: `Could not read logs from Supabase. ${err instanceof Error ? err.message : ''}`,
        }
      }
    }
  }

  const mem = listMemoryLogs(limit)
  return {
    logs: mem,
    source: mem.length ? 'memory' : 'none',
    table_ready: false,
    note: mem.length
      ? 'Using in-memory logs (Supabase not configured or table not migrated).'
      : 'Not tracked yet — no JAZ analyses have been logged in this server process.',
  }
}

export async function updateJazLogFeedback(
  id: string,
  feedback: JazLogAdminFeedback,
  note?: string,
  adminUserId?: string
): Promise<{ ok: boolean; entry?: JazCareerEngineLogEntry; error?: string }> {
  updateMemoryFeedback(id, feedback, note)

  if (isAdminCoursesSupabaseConfigured()) {
    const supabase = getAdminCoursesSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.from('jaz_career_engine_feedback').insert({
          log_id: id,
          feedback_type: feedback,
          notes: note ?? null,
          admin_user_id: asUuidOrNull(adminUserId),
        })

        if (error) {
          // Fallback: memory only if feedback table missing or log id not in DB
          return {
            ok: true,
            entry: getMemoryLog(id) ?? undefined,
            error: `Saved in memory; feedback table write skipped: ${error.message}`,
          }
        }
      } catch (err) {
        return {
          ok: true,
          entry: getMemoryLog(id) ?? undefined,
          error: err instanceof Error ? err.message : 'DB feedback write failed',
        }
      }
    }
  }

  const entry = getMemoryLog(id)
  if (!entry) {
    // Feedback may have been written for a DB-only row
    return {
      ok: true,
      entry: {
        id,
        created_at: new Date().toISOString(),
        goal_path: 'unknown',
        route_title: null,
        route_category: null,
        current_focus: null,
        next_upgrade: null,
        plan_source: 'jaz_fallback',
        ai_provider: 'fallback',
        engine_version: null,
        readiness: null,
        matched_courses_count: 0,
        safety_warnings_count: 0,
        user_id: null,
        anonymous_id: null,
        session_id: null,
        duration_ms: null,
        ollama_error: null,
        safety_notes: [],
        recommended_course_types: [],
        matched_jobaz_courses: [],
        missing_affiliate_opportunities: [],
        admin_feedback: feedback,
        admin_feedback_note: note ?? null,
        admin_feedback_at: new Date().toISOString(),
      },
    }
  }
  return { ok: true, entry }
}

/** Insert one fake log row for admin UI testing. */
export async function seedTestJazCareerLog(): Promise<{
  ok: boolean
  entry?: JazCareerEngineLogEntry
  error?: string
}> {
  const entry: JazCareerEngineLogEntry = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    goal_path: 'side_job',
    route_title: 'Teaching / Tutoring extra income (test)',
    route_category: 'teaching',
    current_focus: 'Online Tutor',
    next_upgrade: 'TEFL / Teaching English Online',
    plan_source: 'jaz_fallback',
    ai_provider: 'fallback',
    engine_version: 'jaz-career-engine-v1',
    readiness: 62,
    matched_courses_count: 0,
    safety_warnings_count: 1,
    user_id: null,
    anonymous_id: 'admin-seed-test',
    session_id: null,
    duration_ms: 120,
    ollama_error: 'Ollama unavailable (seed test)',
    safety_notes: ['Seed row for admin UI testing'],
    recommended_course_types: [
      { title: 'TEFL / Teaching English Online', priority: 'primary' },
      { title: 'Safeguarding for working with children', priority: 'secondary' },
    ],
    matched_jobaz_courses: [],
    missing_affiliate_opportunities: [
      {
        course_type: 'TEFL / Teaching English Online',
        reason: 'No published Admin course matched (seed)',
        suggested_category: 'teaching',
        priority: 'high',
      },
    ],
    request_payload: { goal: 'extra_income', skills: ['teaching'], seed: true },
    response_payload: { seed: true },
    admin_feedback: null,
  }

  pushMemoryLog(entry)

  if (!isAdminCoursesSupabaseConfigured()) {
    return { ok: true, entry, error: 'Supabase not configured — seed stored in memory only' }
  }

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: true, entry, error: 'Supabase client unavailable — seed stored in memory only' }
  }

  const { error } = await supabase.from('jaz_career_engine_logs').insert(toDbRow(entry))
  if (error) {
    return {
      ok: false,
      entry,
      error: `Seed memory ok; DB insert failed: ${error.message}. Apply migration first.`,
    }
  }

  return { ok: true, entry }
}

export { getLastEngineError, getLastOllamaError, getOllamaRuntimeStatus }
