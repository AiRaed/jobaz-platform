/**
 * POST /api/jaz-plan/add-from-career-assistant
 * Replace the user's active My Plan with selected Career Assistant items.
 * Persists full JobAZPlan to Supabase as the cross-browser source of truth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { JazPlanAction } from '@/lib/jaz-plan-engine'
import { replaceJazPlanSteps } from '@/lib/jaz-plan-engine/replaceSteps'
import { isJobAZPlan, type JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'

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

type Body = {
  goal_path?: string
  route_title?: string
  current_focus?: string
  next_upgrade?: string
  actions?: JazPlanAction[]
  jobaz_plan?: unknown
  metadata?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId()
    if (!userId) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as Body | null
    if (!body?.actions?.length || !body.goal_path || !body.route_title) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    }

    const actions = body.actions.filter((a) => a?.id && a?.title)
    if (!actions.length) {
      return NextResponse.json({ error: 'no_actions' }, { status: 400 })
    }

    const jobazPlan: JobAZPlan | null = isJobAZPlan(body.jobaz_plan) ? body.jobaz_plan : null

    const result = await replaceJazPlanSteps({
      userId,
      goalPath: body.goal_path,
      routeTitle: body.route_title,
      currentFocus: body.current_focus || jobazPlan?.route_summary.current_target_role,
      nextUpgrade: body.next_upgrade || jobazPlan?.route_summary.next_upgrade_role,
      actions,
      jobazPlan,
      metadata: {
        source: 'career_assistant_selected_items',
        replace_active: true,
        ...(body.metadata || {}),
      },
    })

    void trackJazEventServer({
      event_type: 'career_plan_saved',
      event_source: 'add_to_my_plan',
      user_id: userId,
      goal_path: body.goal_path,
      route_title: body.route_title,
      tool_name: 'career_assistant',
      metadata: {
        added: result.added,
        replaced: result.replaced,
        archived_previous: result.archived_previous,
        action_plan_id: result.action_plan_id,
        has_jobaz_plan: Boolean(jobazPlan),
        persist_error: result.error || null,
      },
    })

    return NextResponse.json({
      ok: true,
      action_plan_id: result.action_plan_id,
      added: result.added,
      replaced: true,
      archived_previous: result.archived_previous,
      skipped_duplicates: 0,
      plan: result.plan,
      jobaz_plan: jobazPlan,
      persist_warning: result.error || null,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'server_error' },
      { status: 500 }
    )
  }
}
