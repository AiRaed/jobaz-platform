import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { runWorkInEducationAssessment } from '@/lib/career-engine/work-in-education'
import { buildPublicWieAssessmentResult } from '@/lib/career-engine/work-in-education/public-contract'
import { mintWieResultToken } from '@/lib/career-engine/work-in-education/result-token'
import { checkWieAssessmentRateLimit } from '@/lib/career-engine/work-in-education/rate-limit'
import {
  isWieKnowledgeEngineEnvEnabled,
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import { NOT_SURE_CLARIFICATION_VALUE } from '@/lib/career-engine/work-in-education/clarification-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/career-assistant/work-in-my-education/assessment
 *
 * Public-safe Work in My Education assessment (knowledge engine).
 * Feature-flagged. No drafts. No LLM. Filtered public contract only.
 *
 * Legacy flow (unchanged): POST /api/career-engine/education-path
 * Rollback: disable CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1
 */
export async function POST(req: Request) {
  const started = Date.now()

  const email = await getOptionalAuthUserEmail()
  const isAdmin = isAdminUser(email)
  const cookieStore = await cookies()
  const cookieOverride = cookieStore.get(WIE_ADMIN_OVERRIDE_COOKIE)?.value ?? null
  const flagOn = resolveWieKnowledgeEngineEnabled({
    isAdmin,
    cookieOverride,
    queryOverride: null,
  })

  if (!flagOn) {
    return NextResponse.json(
      {
        error: 'This experience is not available right now.',
        code: 'feature_disabled',
      },
      { status: 403 }
    )
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const rate = checkWieAssessmentRateLimit(`wie-public:${ip}`, { limit: 40, windowMs: 60_000 })
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    )
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career matching is temporarily unavailable.', code: 'unavailable' },
      { status: 503 }
    )
  }

  let body: {
    blueprint_version?: string
    answers?: unknown
    clarification_answers?: { selected_specialism_id?: string | null }
    debug?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.', code: 'bad_json' }, { status: 400 })
  }

  if (!body.answers || typeof body.answers !== 'object') {
    return NextResponse.json(
      { error: 'Answers are required.', code: 'missing_answers' },
      { status: 400 }
    )
  }

  const selectedId = body.clarification_answers?.selected_specialism_id?.trim() || null
  if (selectedId === NOT_SURE_CLARIFICATION_VALUE) {
    return NextResponse.json(
      {
        error: 'Please choose a listed area, or go back to add a specialisation.',
        code: 'not_sure_selected',
      },
      { status: 400 }
    )
  }

  const allowDebug =
    Boolean(body.debug) &&
    isAdmin &&
    (process.env.NODE_ENV === 'development' || isWieKnowledgeEngineEnvEnabled())

  console.info('[wie-public/assessment] start', {
    pathway: 'work_in_my_education',
    has_clarification: Boolean(selectedId),
    is_admin: isAdmin,
  })

  try {
    // Knowledge Library roles are still largely `draft`. Matching/scoring unchanged —
    // this only controls which library rows load for the existing matcher.
    // Default ON (same as admin matcher). Set WIE_PUBLIC_INCLUDE_DRAFTS=false after publish.
    const draftFlag = String(process.env.WIE_PUBLIC_INCLUDE_DRAFTS ?? 'true')
      .trim()
      .toLowerCase()
    const includeDrafts = !['false', '0', 'no', 'off'].includes(draftFlag)

    const run = await runWorkInEducationAssessment(supabase, {
      blueprint_version: body.blueprint_version,
      answers: body.answers as never,
      clarification_answers: selectedId ? { selected_specialism_id: selectedId } : undefined,
      includeDrafts,
    })

    if (!run.ok) {
      console.info('[wie-public/assessment] invalid', {
        status: run.status,
        error_count: run.errors.length,
        elapsed_ms: Date.now() - started,
      })
      if (run.result) {
        const draft = buildPublicWieAssessmentResult(run.result, '')
        const { result_token: _t, ...rest } = draft
        const token = mintWieResultToken(rest)
        const pub = buildPublicWieAssessmentResult(run.result, token)
        return NextResponse.json(
          {
            error: 'Please check your answers and try again.',
            code: 'validation_failed',
            result: pub,
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Please check your answers and try again.', code: 'validation_failed' },
        { status: 400 }
      )
    }

    const draft = buildPublicWieAssessmentResult(run.result, '')
    const { result_token: _t, ...rest } = draft
    const token = mintWieResultToken(rest)
    const result = buildPublicWieAssessmentResult(run.result, token)

    console.info('[wie-public/assessment] done', {
      status: result.status,
      field: result.matched_direction.field || null,
      specialism: result.matched_direction.specialism || null,
      include_drafts: result.role_counts.include_drafts,
      candidates: result.role_counts.candidate_roles_considered,
      available_now: result.recommendations.available_now.length,
      realistic_next: result.recommendations.realistic_next.length,
      future: result.recommendations.future_options.length,
      academic: result.recommendations.academic_research.length,
      requirements: result.recommendations.requirements_needed.length,
      matcher_immediate: result.role_counts.immediate,
      matcher_future: result.role_counts.future_progression,
      matcher_blocked: result.role_counts.blocked_or_needs_review,
      clarification: result.clarification.required,
      elapsed_ms: Date.now() - started,
    })

    return NextResponse.json({
      result,
      ...(allowDebug
        ? {
            debug: {
              mapping_ms: run.result.trace.mapping_ms,
              matcher_ms: run.result.trace.matcher_ms,
              total_ms: run.result.trace.total_ms,
              query_count: run.result.trace.query_count,
            },
          }
        : {}),
    })
  } catch (err) {
    console.error('[wie-public/assessment] failed', {
      message: err instanceof Error ? err.message : 'unknown',
      elapsed_ms: Date.now() - started,
    })
    return NextResponse.json(
      {
        error: 'We could not complete your assessment right now. Please try again.',
        code: 'assessment_failed',
      },
      { status: 500 }
    )
  }
}
