import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { isAdminUser } from '@/lib/auth/adminEmails'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import { matchLibraryPath } from '@/lib/career-engine/work-in-education/match-library-path'
import { assessmentResultFromLibraryMatch } from '@/lib/career-engine/work-in-education/assessment/from-library-match'
import { buildPublicWieAssessmentResult } from '@/lib/career-engine/work-in-education/public-contract'
import { mintWieResultToken } from '@/lib/career-engine/work-in-education/result-token'
import {
  buildWieTrainingRecommendations,
  type WieCompletedCoursesAnswers,
  type WieCourseConfidence,
} from '@/lib/career-engine/work-in-education/course-alignment'
import {
  loadServerOpportunityPool,
  loadServerPublishedCourses,
} from '@/lib/recommendations/opportunityPool'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'

export const dynamic = 'force-dynamic'

function includeDraftsDefault() {
  const draftFlag = String(process.env.WIE_PUBLIC_INCLUDE_DRAFTS ?? 'true')
    .trim()
    .toLowerCase()
  return !['false', '0', 'no', 'off'].includes(draftFlag)
}

function parseCompleted(body: Record<string, unknown>): WieCompletedCoursesAnswers {
  const types = Array.isArray(body.completed_course_types)
    ? body.completed_course_types.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean)
    : []
  const confidenceRaw = typeof body.course_confidence === 'string' ? body.course_confidence : undefined
  const course_confidence: WieCourseConfidence =
    confidenceRaw === 'known' || confidenceRaw === 'not_sure' || confidenceRaw === 'none'
      ? confidenceRaw
      : types.length
        ? 'known'
        : 'none'
  const notes =
    typeof body.completed_course_notes === 'string' ? body.completed_course_notes.trim() : undefined

  return {
    completed_course_types: types,
    course_confidence,
    completed_course_notes: notes || undefined,
  }
}

/**
 * POST library-path match: { field_id, specialism_id, stage_id, completed_course_types?, ... }
 * Field → Specialism → Stage → Completed courses → Roles + training recommendations.
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
    return NextResponse.json({ error: 'Not available.', code: 'feature_disabled' }, { status: 403 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career matching is temporarily unavailable.', code: 'unavailable' },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.', code: 'bad_json' }, { status: 400 })
  }

  const field_id = typeof body.field_id === 'string' ? body.field_id : ''
  const specialism_id = typeof body.specialism_id === 'string' ? body.specialism_id : ''
  const stage_id = typeof body.stage_id === 'string' ? body.stage_id : ''
  const completed = parseCompleted(body)

  const includeDrafts =
    typeof body.includeDrafts === 'boolean' ? body.includeDrafts : includeDraftsDefault() || isAdmin

  console.info('[wie-library/match] start', {
    field_id: field_id || null,
    specialism_id: specialism_id || null,
    stage_id: stage_id || null,
    completed_count: completed.completed_course_types.length,
    course_confidence: completed.course_confidence,
  })

  try {
    const run = await matchLibraryPath(
      supabase,
      {
        field_id,
        specialism_id,
        stage_id,
      },
      {
        includeDrafts,
        yearsRelevantExperience: 0,
        completedTrainingCount: completed.completed_course_types.length,
      }
    )

    if (!run.ok) {
      return NextResponse.json(
        { error: run.errors[0] || 'Could not match.', code: run.code || 'match_failed' },
        { status: run.status }
      )
    }

    const assessment = assessmentResultFromLibraryMatch(run.result, run.selection)

    let training_recommendations = null as ReturnType<typeof buildWieTrainingRecommendations> | null
    try {
      const [opportunities, publishedCourses] = await Promise.all([
        loadServerOpportunityPool(),
        loadServerPublishedCourses(),
      ])
      training_recommendations = buildWieTrainingRecommendations({
        fieldName: run.selection.field.name,
        specialismName: run.selection.specialism.name,
        stageLabel: run.selection.stage.label,
        stageKey: run.selection.stage.stage_key,
        completed,
        opportunities,
        publishedCourses,
      })
    } catch (err) {
      console.warn('[wie-library/match] training recommendations failed', err)
    }

    const draft = buildPublicWieAssessmentResult(assessment, '', run.stage_context)
    draft.training_recommendations = training_recommendations
    const { result_token: _t, ...rest } = draft
    const token = mintWieResultToken(rest)
    const result = buildPublicWieAssessmentResult(assessment, token, run.stage_context)
    result.training_recommendations = training_recommendations

    result.headline = {
      text: `${run.selection.specialism.name}`,
      key: 'library_path.headline',
    }
    result.matched_direction = {
      field: run.selection.field.name,
      specialism: run.selection.specialism.name,
      confidence_label: 'high',
    }
    result.stage_context = run.stage_context
    result.summary_lines = [
      `Field: ${run.selection.field.name}`,
      `Specialism: ${run.selection.specialism.name}`,
      run.stage_context.stage_meaning === 'target'
        ? `Target stage: ${run.stage_context.target_stage_label}`
        : `Current stage: ${run.stage_context.current_stage_label}`,
      `Current readiness: ${run.stage_context.estimated_current_readiness}`,
      `Relevant experience: ${run.stage_context.years_relevant_experience} years`,
    ]
    if (completed.completed_course_types.length) {
      result.summary_lines.push(
        `Completed training noted: ${completed.completed_course_types.slice(0, 4).join(', ')}`
      )
    }

    void trackJazEventServer({
      event_type: 'wie_completed_courses_selected',
      event_source: 'work_in_education_library_match',
      goal_path: 'work_in_education',
      route_title: run.selection.specialism.name,
      metadata: {
        field: run.selection.field.name,
        specialism: run.selection.specialism.name,
        stage: run.selection.stage.label,
        completed_course_types: completed.completed_course_types.slice(0, 20),
        course_confidence: completed.course_confidence,
        recommended_next_count: training_recommendations?.recommended_next.length ?? 0,
        provider_not_listed_count: training_recommendations?.provider_not_listed.length ?? 0,
      },
    })

    if (training_recommendations) {
      for (const card of [
        ...training_recommendations.recommended_next,
        ...training_recommendations.optional_boosters,
      ].slice(0, 8)) {
        void trackJazEventServer({
          event_type: 'wie_course_recommended',
          event_source: 'work_in_education_library_match',
          goal_path: 'work_in_education',
          course_id: card.opportunityId || card.id,
          route_title: run.selection.specialism.name,
          metadata: {
            title: card.title,
            training_status: card.training_status,
            commercial_status: card.commercialStatus,
            field: run.selection.field.name,
          },
        })
        if (card.commercialStatus === 'no_link' || card.training_status === 'provider_not_listed') {
          void trackJazEventServer({
            event_type: 'wie_missing_provider_logged',
            event_source: 'work_in_education_library_match',
            goal_path: 'work_in_education',
            course_id: card.opportunityId || card.id,
            metadata: { title: card.title, field: run.selection.field.name },
          })
        }
      }
    }

    console.info('[wie-library/match] done', {
      field: run.selection.field.name,
      specialism: run.selection.specialism.name,
      stage: run.selection.stage.label,
      available_now: result.recommendations.available_now.length,
      training_next: training_recommendations?.recommended_next.length ?? 0,
      elapsed_ms: Date.now() - started,
    })

    return NextResponse.json({
      result,
      selection: run.selection,
    })
  } catch (err) {
    console.error('[wie-library/match] failed', err)
    return NextResponse.json(
      {
        error: 'We could not complete your pathway match right now. Please try again.',
        code: 'match_failed',
      },
      { status: 500 }
    )
  }
}
