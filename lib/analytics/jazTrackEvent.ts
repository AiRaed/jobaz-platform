/**
 * JAZ Learning Loop — track product events safely.
 * Client: POST /api/analytics/jaz-track (fire-and-forget).
 * Server: insert via service role; never throws to callers.
 */

import { getAdminCoursesSupabase, isAdminCoursesSupabaseConfigured } from '@/lib/admin/courses/supabaseServer'
import {
  sanitizeJazEventMetadata,
  type JazTrackEventInput,
} from './jazTrackTypes'

const DEDUPE_MS = 2500
const recentKeys = new Map<string, number>()

function dedupeKey(input: JazTrackEventInput): string {
  return [
    input.event_type,
    input.session_id || '',
    input.goal_path || '',
    input.route_title || '',
    input.course_id || '',
    input.job_id || '',
    input.career_plan_id || '',
    input.tool_name || '',
  ].join('|')
}

function shouldSkipDuplicate(input: JazTrackEventInput): boolean {
  const key = dedupeKey(input)
  const now = Date.now()
  const prev = recentKeys.get(key)
  if (prev && now - prev < DEDUPE_MS) return true
  recentKeys.set(key, now)
  if (recentKeys.size > 400) {
    for (const [k, t] of recentKeys) {
      if (now - t > 60_000) recentKeys.delete(k)
    }
  }
  return false
}

function asUuidOrNull(v: string | null | undefined): string | null {
  if (!v) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    ? v
    : null
}

function detectDeviceType(): string | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent || ''
  if (/Mobi|Android/i.test(ua)) return 'mobile'
  if (/Tablet|iPad/i.test(ua)) return 'tablet'
  return 'desktop'
}

function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const key = 'jobaz_jaz_anon_id'
    let id = localStorage.getItem(key)
    if (!id) {
      id = `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return null
  }
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const key = 'jobaz_jaz_session_id'
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return null
  }
}

/** Client or universal entry — never throws. */
export async function trackJazEvent(input: JazTrackEventInput): Promise<void> {
  try {
    if (!input?.event_type) return
    if (shouldSkipDuplicate(input)) return

    const enriched: JazTrackEventInput = {
      ...input,
      metadata: sanitizeJazEventMetadata(input.metadata),
      anonymous_id: input.anonymous_id ?? getAnonymousId(),
      session_id: input.session_id ?? getSessionId(),
      page_path:
        input.page_path ??
        (typeof window !== 'undefined' ? window.location.pathname : null),
      referrer:
        input.referrer ??
        (typeof document !== 'undefined' ? document.referrer || null : null),
      device_type: input.device_type ?? detectDeviceType(),
    }

    if (typeof window !== 'undefined') {
      void fetch('/api/analytics/jaz-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched),
        keepalive: true,
      }).catch(() => {})
      return
    }

    await trackJazEventServer(enriched)
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[jazTrackEvent] failed', err)
    }
  }
}

/** Server insert via service role. Never throws. */
export async function trackJazEventServer(input: JazTrackEventInput): Promise<void> {
  try {
    if (!input?.event_type) return
    if (!isAdminCoursesSupabaseConfigured()) return

    const supabase = getAdminCoursesSupabase()
    if (!supabase) return

    const { error } = await supabase.from('jaz_user_activity_events').insert({
      user_id: asUuidOrNull(input.user_id),
      anonymous_id: input.anonymous_id ?? null,
      session_id: input.session_id ?? null,
      event_type: String(input.event_type).slice(0, 120),
      event_source: input.event_source ?? null,
      page_path: input.page_path ?? null,
      goal_path: input.goal_path ?? null,
      route_title: input.route_title ?? null,
      career_plan_id: input.career_plan_id ?? null,
      job_id: input.job_id ?? null,
      course_id: input.course_id ?? null,
      provider_id: input.provider_id ?? null,
      tool_name: input.tool_name ?? null,
      metadata: sanitizeJazEventMetadata(input.metadata),
      referrer: input.referrer ?? null,
      device_type: input.device_type ?? null,
    })

    if (error && process.env.NODE_ENV === 'development') {
      console.warn('[jazTrackEventServer] insert skipped:', error.message)
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[jazTrackEventServer] failed', err)
    }
  }
}

export type { JazTrackEventInput, JazActivityEventType } from './jazTrackTypes'
