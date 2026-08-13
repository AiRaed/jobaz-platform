import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { runWorkInEducationAssessment } from '@/lib/career-engine/work-in-education'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/career-library/work-in-education/assessment
 *
 * Admin assessment preview: answers → profile → existing matcher → presenter.
 * No public access. Answers are not persisted.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let body: {
    blueprint_version?: string
    answers?: unknown
    clarification_answers?: { selected_specialism_id?: string | null }
    includeDrafts?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.answers || typeof body.answers !== 'object') {
    return NextResponse.json({ error: 'answers is required' }, { status: 400 })
  }

  console.info('[work-in-education/assessment] start', {
    admin_id: auth.user.id,
    pathway: 'work_in_my_education',
    blueprint_version: body.blueprint_version ?? 'default',
    has_clarification: Boolean(body.clarification_answers?.selected_specialism_id),
    // No raw answer / registration-number logging
  })

  try {
    const run = await runWorkInEducationAssessment(supabase, {
      blueprint_version: body.blueprint_version,
      answers: body.answers as never,
      clarification_answers: body.clarification_answers,
      includeDrafts: body.includeDrafts !== false,
    })

    if (!run.ok) {
      console.info('[work-in-education/assessment] invalid_or_failed', {
        admin_id: auth.user.id,
        status: run.status,
        error_count: run.errors.length,
        assessment_status: run.result?.assessment_status ?? null,
      })
      return NextResponse.json(
        {
          error: run.status === 400 ? 'Validation failed' : 'Assessment failed',
          details: run.errors,
          assessment: run.result ?? null,
        },
        { status: run.status }
      )
    }

    console.info('[work-in-education/assessment] done', {
      admin_id: auth.user.id,
      blueprint_version: run.result.blueprint_version,
      assessment_status: run.result.assessment_status,
      field_id: run.result.resolution?.primary_field?.id ?? null,
      specialism_id: run.result.resolution?.primary_specialism?.id ?? null,
      immediate: run.result.summary.immediate_count,
      realistic_next: run.result.summary.realistic_next_count,
      future: run.result.summary.future_count,
      blocked: run.result.summary.blocked_count,
      total_ms: run.result.trace.total_ms,
      matcher_ms: run.result.trace.matcher_ms,
    })

    return NextResponse.json({ assessment: run.result })
  } catch (err) {
    console.error('[work-in-education/assessment] failed', {
      admin_id: auth.user.id,
      message: err instanceof Error ? err.message : 'unknown',
    })
    return NextResponse.json(
      { error: 'Assessment failed. Please try again.' },
      { status: 500 }
    )
  }
}
