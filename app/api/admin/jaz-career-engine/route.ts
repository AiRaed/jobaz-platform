/**
 * GET  /api/admin/jaz-career-engine — status + recent logs + learning loop
 * PATCH /api/admin/jaz-career-engine — admin feedback
 * POST  /api/admin/jaz-career-engine — { action: 'seed_test' } insert one test log
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { buildLearningLoopSnapshot } from '@/lib/analytics/jazLearningLoop'
import { buildPlanEngineAdminSnapshot } from '@/lib/jaz-plan-engine'
import {
  aggregateMissingAffiliates,
  buildJazEngineStatusSnapshot,
  listJazCareerLogs,
  seedTestJazCareerLog,
  updateJazLogFeedback,
  type JazLogAdminFeedback,
} from '@/lib/jaz-career-engine/logging'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FEEDBACK_VALUES: JazLogAdminFeedback[] = [
  'good_result',
  'wrong_route',
  'wrong_course',
  'missing_affiliate',
  'needs_better_explanation',
]

export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const status = await buildJazEngineStatusSnapshot()
    const { logs, source, note, table_ready } = await listJazCareerLogs(50)
    const missing = aggregateMissingAffiliates(logs)
    const learning_loop = await buildLearningLoopSnapshot(logs)
    const plan_engine = await buildPlanEngineAdminSnapshot()

    return NextResponse.json({
      status,
      logs,
      missing_affiliates: missing,
      learning_loop,
      plan_engine,
      logs_source: source,
      table_ready,
      note: note || status.note || learning_loop.note || plan_engine.note,
      migration_path: 'supabase/migrations/20250801120000_jaz_career_engine_logs.sql',
      events_migration_path: 'supabase/migrations/20250801130000_jaz_user_activity_events.sql',
      plan_migration_path: 'supabase/migrations/20250801140000_jaz_plan_engine.sql',
    })
  } catch (err) {
    console.error('[admin/jaz-career-engine] GET failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load JAZ admin data' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as {
      id?: string
      feedback?: string
      note?: string
    }

    if (!body.id || !body.feedback) {
      return NextResponse.json({ error: 'id and feedback required' }, { status: 400 })
    }

    if (!FEEDBACK_VALUES.includes(body.feedback as JazLogAdminFeedback)) {
      return NextResponse.json({ error: 'Invalid feedback value' }, { status: 400 })
    }

    const result = await updateJazLogFeedback(
      body.id,
      body.feedback as JazLogAdminFeedback,
      body.note,
      auth.user.id
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Update failed' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      entry: result.entry,
      warning: result.error || null,
    })
  } catch (err) {
    console.error('[admin/jaz-career-engine] PATCH failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save feedback' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as { action?: string }
    if (body.action !== 'seed_test') {
      return NextResponse.json(
        { error: 'Unsupported action. Use { "action": "seed_test" }.' },
        { status: 400 }
      )
    }

    const result = await seedTestJazCareerLog()
    return NextResponse.json({
      ok: result.ok,
      entry: result.entry,
      warning: result.error || null,
      message: result.ok
        ? 'Seed log inserted. Refresh the page to see it.'
        : 'Seed failed — apply the migration first, then retry.',
    })
  } catch (err) {
    console.error('[admin/jaz-career-engine] POST failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Seed failed' },
      { status: 500 }
    )
  }
}
