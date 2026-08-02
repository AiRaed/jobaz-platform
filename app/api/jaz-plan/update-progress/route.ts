/**
 * POST /api/jaz-plan/update-progress
 * Update a plan step status (done / in_progress / skipped / not_started).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateJazPlanStepStatus, type JazPlanActionStatus } from '@/lib/jaz-plan-engine'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSES: JazPlanActionStatus[] = ['not_started', 'in_progress', 'done', 'skipped']

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
    const body = (await req.json().catch(() => null)) as {
      action_plan_id?: string
      step_key?: string
      status?: string
      goal_path?: string
      route_title?: string
      category?: string
    } | null

    if (!body?.action_plan_id || !body?.step_key || !body?.status) {
      return NextResponse.json(
        { error: 'action_plan_id, step_key, and status required' },
        { status: 400 }
      )
    }
    if (!STATUSES.includes(body.status as JazPlanActionStatus)) {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
    }

    const userId = await resolveUserId()
    const status = body.status as JazPlanActionStatus
    const result = await updateJazPlanStepStatus({
      actionPlanId: body.action_plan_id,
      stepKey: body.step_key,
      status,
      userId,
    })

    const eventType =
      status === 'done'
        ? 'action_step_completed'
        : status === 'skipped'
          ? 'action_step_skipped'
          : 'action_step_clicked'

    void trackJazEventServer({
      event_type: eventType,
      event_source: 'jaz_plan_engine',
      user_id: userId,
      goal_path: body.goal_path,
      route_title: body.route_title,
      career_plan_id: body.action_plan_id,
      tool_name: 'my_plan',
      metadata: {
        step_key: body.step_key,
        status,
        category: body.category || null,
        db_ok: result.ok,
        db_error: result.error || null,
      },
    })

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.error || null,
    })
  } catch (err) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      warning: err instanceof Error ? err.message : 'update failed',
    })
  }
}
