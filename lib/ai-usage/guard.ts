/**
 * MVP server-side AI usage guard for public OpenAI-costing tools.
 * Does not affect Career Assistant / My Plan / Jobs For You / Courses.
 */

import { createHash, randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  AI_LIMIT_ERROR,
  AI_LIMIT_MESSAGES,
  APPLY_ASSISTANT_DAILY_LIMIT,
  GUEST_COOKIE_NAME,
  GUEST_LIMIT_PER_CATEGORY,
  LOGGED_IN_DAILY_LIMIT_PER_CATEGORY,
  type AiLimitReason,
  type AiToolCategory,
  type AiUsageCheckResult,
} from './types'

const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

function utcDayStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function utcNextDayIso(now = new Date()): string {
  const next = utcDayStart(now)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.toISOString()
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function fingerprintId(request: Request): string {
  const ua = request.headers.get('user-agent') || 'ua'
  const raw = `${clientIp(request)}|${ua.slice(0, 180)}`
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 24)
  return `fp_${hash}`
}

async function resolveAuthUser(): Promise<{ id: string; email: string | null } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    })
    const { data } = await supabase.auth.getUser()
    if (!data.user?.id) return null
    return { id: data.user.id, email: data.user.email ?? null }
  } catch {
    return null
  }
}

async function readOrSetGuestCookie(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(GUEST_COOKIE_NAME)?.value?.trim()
  if (existing && existing.length >= 8 && existing.length <= 80) return existing

  const id = `g_${randomUUID()}`
  try {
    cookieStore.set(GUEST_COOKIE_NAME, id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 400,
      secure: process.env.NODE_ENV === 'production',
    })
  } catch {
    // Route may not allow set; still use the new id for this request.
  }
  return id
}

function memoryKey(parts: string[]): string {
  return parts.join('|')
}

function memoryCount(key: string, windowMs: number | null): number {
  const now = Date.now()
  const row = memoryBuckets.get(key)
  if (!row) return 0
  if (windowMs != null && now >= row.resetAt) {
    memoryBuckets.delete(key)
    return 0
  }
  return row.count
}

function memoryIncrement(key: string, windowMs: number | null): void {
  const now = Date.now()
  const resetAt = windowMs == null ? now + 1000 * 60 * 60 * 24 * 400 : now + windowMs
  const row = memoryBuckets.get(key)
  if (!row || (windowMs != null && now >= row.resetAt)) {
    memoryBuckets.set(key, { count: 1, resetAt })
    return
  }
  row.count += 1
}

async function countStoredEvents(params: {
  userId?: string | null
  anonymousIds?: string[]
  toolCategory: AiToolCategory
  sinceIso?: string | null
}): Promise<number | null> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return null

  try {
    let q = supabase
      .from('ai_usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('tool_category', params.toolCategory)

    if (params.userId) {
      q = q.eq('user_id', params.userId)
    } else {
      const ids = (params.anonymousIds || []).filter(Boolean)
      if (ids.length === 0) return 0
      q = q.is('user_id', null).in('anonymous_id', ids)
    }

    if (params.sinceIso) {
      q = q.gte('created_at', params.sinceIso)
    }

    const { count, error } = await q
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

async function insertStoredEvent(params: {
  userId?: string | null
  anonymousId?: string | null
  toolCategory: AiToolCategory
  actionName: string
}): Promise<void> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return
  try {
    await supabase.from('ai_usage_events').insert({
      user_id: params.userId || null,
      anonymous_id: params.anonymousId || null,
      tool_category: params.toolCategory,
      action_name: params.actionName,
      provider: 'openai',
    })
  } catch {
    // Memory bucket still recorded the grant.
  }
}

function limitMessage(reason: AiLimitReason | undefined, toolCategory: AiToolCategory): string {
  if (toolCategory === 'apply_assistant') return AI_LIMIT_MESSAGES.apply
  if (reason === 'daily_limit') return AI_LIMIT_MESSAGES.daily
  return AI_LIMIT_MESSAGES.guest
}

export function aiLimitJsonResponse(
  check: AiUsageCheckResult,
  toolCategory: AiToolCategory
): NextResponse {
  const resetAt = check.resetAt || utcNextDayIso()
  return NextResponse.json(
    {
      error: AI_LIMIT_ERROR,
      message: limitMessage(check.reason, toolCategory),
      toolCategory,
      remaining: check.remaining ?? 0,
      resetAt,
      reason: check.reason,
    },
    { status: 429 }
  )
}

/**
 * Check (and consume, if allowed) an AI usage slot for a public OpenAI tool.
 */
export async function checkAiUsageLimit(input: {
  request: Request
  userId?: string | null
  toolCategory: AiToolCategory
  actionName: string
}): Promise<AiUsageCheckResult> {
  const { request, toolCategory, actionName } = input
  const resetAt = utcNextDayIso()
  const dayStart = utcDayStart().toISOString()
  const dayMs = 24 * 60 * 60 * 1000

  const auth = await resolveAuthUser()
  const userId = input.userId || auth?.id || null
  const isAdmin = isAdminUser(auth?.email)

  if (isAdmin) {
    await insertStoredEvent({
      userId,
      anonymousId: null,
      toolCategory,
      actionName,
    })
    return {
      allowed: true,
      reason: 'admin_unlimited',
      remaining: 99,
      resetAt,
      userId,
    }
  }

  if (toolCategory === 'apply_assistant' && !userId) {
    return {
      allowed: false,
      reason: 'login_required',
      remaining: 0,
      resetAt,
      userId: null,
    }
  }

  const guestCookie = userId ? null : await readOrSetGuestCookie()
  const fp = userId ? null : fingerprintId(request)
  const anonymousIds = [guestCookie, fp].filter((v): v is string => Boolean(v))
  const primaryAnon = guestCookie || fp || null

  if (userId) {
    const max =
      toolCategory === 'apply_assistant'
        ? APPLY_ASSISTANT_DAILY_LIMIT
        : LOGGED_IN_DAILY_LIMIT_PER_CATEGORY
    const memKey = memoryKey(['user', userId, toolCategory, dayStart])
    const stored = await countStoredEvents({
      userId,
      toolCategory,
      sinceIso: dayStart,
    })
    const used = stored ?? memoryCount(memKey, dayMs)
    if (used >= max) {
      return {
        allowed: false,
        reason: 'daily_limit',
        remaining: 0,
        resetAt,
        userId,
      }
    }
    memoryIncrement(memKey, dayMs)
    await insertStoredEvent({
      userId,
      anonymousId: null,
      toolCategory,
      actionName,
    })
    return {
      allowed: true,
      remaining: Math.max(0, max - used - 1),
      resetAt,
      userId,
    }
  }

  const max = GUEST_LIMIT_PER_CATEGORY
  const memKey = memoryKey(['guest', primaryAnon || 'unknown', toolCategory])
  const stored = await countStoredEvents({
    anonymousIds,
    toolCategory,
  })
  const used = stored ?? memoryCount(memKey, null)
  if (used >= max) {
    return {
      allowed: false,
      reason: 'guest_limit',
      remaining: 0,
      resetAt,
      userId: null,
      anonymousId: primaryAnon,
    }
  }

  memoryIncrement(memKey, null)
  await insertStoredEvent({
    userId: null,
    anonymousId: primaryAnon,
    toolCategory,
    actionName,
  })
  return {
    allowed: true,
    remaining: Math.max(0, max - used - 1),
    resetAt,
    userId: null,
    anonymousId: primaryAnon,
  }
}

export type AiUsageGate =
  | { allowed: true; remaining?: number; resetAt?: string }
  | { allowed: false; response: NextResponse }

/** Route helper: return `usage.response` when blocked. */
export async function enforceAiUsageLimit(
  request: Request,
  toolCategory: AiToolCategory,
  actionName: string
): Promise<AiUsageGate> {
  const check = await checkAiUsageLimit({ request, toolCategory, actionName })
  if (!check.allowed) {
    return { allowed: false, response: aiLimitJsonResponse(check, toolCategory) }
  }
  return { allowed: true, remaining: check.remaining, resetAt: check.resetAt }
}
