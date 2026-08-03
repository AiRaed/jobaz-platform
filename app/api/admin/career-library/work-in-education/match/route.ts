import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { matchWorkInEducation } from '@/lib/career-engine/work-in-education'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/career-library/work-in-education/match
 *
 * Admin/internal diagnostic matcher for Work in My Education.
 * Knowledge-first, deterministic — no LLM.
 * Draft roles may be included for integration testing; not for public publish.
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
    profile?: unknown
    includeDrafts?: boolean
    limits?: Record<string, number>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.profile) {
    return NextResponse.json({ error: 'profile is required' }, { status: 400 })
  }

  console.info('[work-in-education/match] admin_match_start', {
    admin_id: auth.user.id,
    includeDrafts: body.includeDrafts !== false,
    // Do not log raw private profile fields
    has_subject: Boolean((body.profile as { subject?: string })?.subject),
    education_level: (body.profile as { education_level?: string })?.education_level ?? null,
  })

  try {
    const run = await matchWorkInEducation(supabase, body.profile, {
      includeDrafts: body.includeDrafts !== false,
      limits: body.limits,
    })

    if (!run.ok) {
      return NextResponse.json({ error: 'Validation failed', details: run.errors }, { status: run.status })
    }

    console.info('[work-in-education/match] admin_match_done', {
      admin_id: auth.user.id,
      elapsed_ms: run.result.meta.elapsed_ms,
      query_count: run.result.meta.query_count,
      candidates: run.result.meta.candidate_roles_considered,
      confidence: run.result.resolution.confidence,
      needs_clarification: run.result.resolution.needs_clarification,
      immediate: run.result.recommendations.immediate.length,
    })

    return NextResponse.json({ match: run.result })
  } catch (err) {
    console.error('[work-in-education/match] failed', {
      admin_id: auth.user.id,
      message: err instanceof Error ? err.message : 'unknown',
    })
    return NextResponse.json(
      { error: 'Matching failed. Please try again.' },
      { status: 500 }
    )
  }
}
