import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { loadBlueprintBundle } from '@/lib/admin/career-library/loadBlueprint'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import {
  evaluateAssessmentBlueprint,
  type BlueprintAnswers,
} from '@/lib/career-library/assessment/evaluateBlueprint'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/career-library/blueprint/preview
 * Deterministic preview for Assessment Blueprint + report outcomes.
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
    route_key?: string
    answers?: BlueprintAnswers
    includeDrafts?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const routeKey = body.route_key?.trim() || 'work_in_my_education'
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {}

  const bundle = await loadBlueprintBundle(supabase, routeKey)
  if (bundle.error) {
    return NextResponse.json({ error: bundle.error }, { status: 500 })
  }

  const result = evaluateAssessmentBlueprint({
    input: { route_key: routeKey, answers },
    questions: bundle.questions,
    rules: bundle.rules,
    includeDrafts: Boolean(body.includeDrafts),
  })

  return NextResponse.json({
    preview: result,
    meta: {
      question_count: bundle.questions.length,
      rule_count: bundle.rules.length,
      mode: 'deterministic_no_ai',
    },
  })
}
