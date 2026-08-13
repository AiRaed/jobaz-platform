/**
 * GET /api/jaz-plan/active
 * Load the logged-in user's single active My Plan from Supabase (source of truth).
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { loadActiveJazActionPlan } from '@/lib/jaz-plan-engine/persist'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function resolveUserId(): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return null
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
    return data.user?.id ?? null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const userId = await resolveUserId()
    if (!userId) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 })
    }

    const active = await loadActiveJazActionPlan({ userId })

    return NextResponse.json({
      ok: true,
      user_id_suffix: userId.slice(-6),
      action_plan_id: active.plan?.action_plan_id || null,
      updated_at: active.updated_at,
      created_at: active.created_at,
      source: active.source,
      is_active: active.is_active,
      user_plan_count: active.user_plan_count,
      active_plan_count: active.active_plan_count,
      multiple_active_warning: active.active_plan_count > 1,
      plan: active.plan,
      jobaz_plan: active.jobaz_plan,
      table_ready: active.table_ready,
      note: active.note,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'server_error' },
      { status: 500 }
    )
  }
}
