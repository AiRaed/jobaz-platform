/**
 * POST /api/jaz-career/analyse
 * Internal JAZ Career Engine endpoint (API-first; not public partner API).
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyseCareerGoal } from '@/lib/jaz-career-engine'
import type { JazAnalyseInput } from '@/lib/jaz-career-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Allow slow local Ollama generations (CPU llama3 can exceed 2 minutes). */
export const maxDuration = 240

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as JazAnalyseInput | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'invalid_body', message: 'Expected JSON profile / answers object.' },
        { status: 400 }
      )
    }

    console.info('[jaz-career/analyse] request', {
      goal: body.goal,
      skills: body.skills,
      work_mode: body.work_mode_preference,
      answer_keys: Object.keys(body.answers || {}),
    })

    const result = await analyseCareerGoal(body, {
      goalPath: String(body.goal || 'jaz-career-analyse'),
    })

    console.info('[jaz-career/analyse] response', {
      success: true,
      ai_provider: result.ai_provider,
      engine_version: result.engine_version,
      route_title: result.route_title,
      current_focus: result.current_focus,
      next_upgrade: result.next_upgrade,
      work_now_roles: result.work_now_roles.map((r) => r.title),
      recommended_course_types: result.recommended_course_types.map((c) => ({
        title: c.title,
        priority: c.priority,
      })),
      matched_jobaz_courses: result.matched_jobaz_courses.map((c) => ({
        title: c.title,
        button: c.primary_button,
        has_referral: Boolean(c.referral_url),
      })),
      safety_notes: result.safety_notes,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[jaz-career/analyse] failed', err)
    return NextResponse.json(
      {
        error: 'analyse_failed',
        message: err instanceof Error ? err.message : 'Career analyse failed',
      },
      { status: 500 }
    )
  }
}
