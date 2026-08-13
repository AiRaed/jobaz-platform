/**
 * POST /api/jaz-plan/generate
 * Generate + optionally persist a JAZ action plan. Fallback-first; never blocks UX.
 * Does NOT replace an active Career Assistant selected plan.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  generateJazActionPlan,
  persistJazActionPlan,
  loadActiveJazActionPlan,
  type JazPlanGenerateInput,
} from '@/lib/jaz-plan-engine'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as JazPlanGenerateInput | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    }

    const userId = await resolveUserId()

    // Never overwrite Career Assistant selected active plan with a generic generate.
    if (userId) {
      const active = await loadActiveJazActionPlan({ userId })
      if (
        active.plan &&
        (active.source === 'career_assistant_selected_items' || active.jobaz_plan?.ca_selection)
      ) {
        return NextResponse.json({
          ok: true,
          plan: active.plan,
          jobaz_plan: active.jobaz_plan,
          reused_active: true,
          persist_warning: null,
        })
      }
    }

    const plan = await generateJazActionPlan({ ...body, user_id: userId })

    const persist = await persistJazActionPlan({
      plan,
      userId,
      anonymousId: body.anonymous_id || null,
      source: 'jaz_plan_generate',
    })

    const withId = { ...plan, action_plan_id: persist.action_plan_id }

    void trackJazEventServer({
      event_type: 'action_plan_generated',
      event_source: 'jaz_plan_engine',
      user_id: userId,
      anonymous_id: body.anonymous_id,
      goal_path: plan.goal_path,
      route_title: plan.route_title,
      career_plan_id: persist.action_plan_id || plan.career_plan_id,
      tool_name: 'jaz_plan_engine',
      metadata: {
        plan_source: plan.plan_source,
        ai_provider: plan.ai_provider,
        engine_version: plan.engine_version,
        steps_count: plan.this_week_actions.length,
        archived_previous: persist.archived_previous,
        persist_error: persist.error || null,
      },
    })

    return NextResponse.json({
      ok: true,
      plan: withId,
      persist_warning: persist.error || null,
    })
  } catch (err) {
    console.error('[jaz-plan/generate] failed', err)
    return NextResponse.json(
      {
        error: 'generate_failed',
        message: err instanceof Error ? err.message : 'Plan generate failed',
      },
      { status: 500 }
    )
  }
}
