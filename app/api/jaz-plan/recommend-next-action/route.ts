/**
 * POST /api/jaz-plan/recommend-next-action
 * Recompute next best action from current steps + signals.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  recommendNextBestAction,
  buildProgressSummary,
  type JazPlanAction,
  type JazPlanGenerateInput,
} from '@/lib/jaz-plan-engine'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      actions?: JazPlanAction[]
      signals?: JazPlanGenerateInput['signals']
      goal_path?: string
      route_title?: string
      action_plan_id?: string
    } | null

    const actions = Array.isArray(body?.actions) ? body!.actions : []
    const signals = body?.signals || {}
    const next = recommendNextBestAction(actions, signals)
    const progress = buildProgressSummary(actions, signals)

    if (next) {
      void trackJazEventServer({
        event_type: 'next_best_action_clicked',
        event_source: 'jaz_plan_engine',
        goal_path: body?.goal_path,
        route_title: body?.route_title,
        career_plan_id: body?.action_plan_id,
        tool_name: 'my_plan',
        metadata: {
          next_action_id: next.id,
          next_action_title: next.title,
          category: next.category,
        },
      })
    }

    return NextResponse.json({ ok: true, next_best_action: next, progress_summary: progress })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'recommend_failed',
        message: err instanceof Error ? err.message : 'Failed',
      },
      { status: 500 }
    )
  }
}
