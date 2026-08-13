import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { isAdminUser } from '@/lib/auth/adminEmails'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import { buildWieCompletedCourseOptions } from '@/lib/career-engine/work-in-education/course-alignment'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'

export const dynamic = 'force-dynamic'

/**
 * GET completed-course options for library path wizard.
 * Query: field_id, specialism_id, stage_id (ids from Career Knowledge Library).
 */
export async function GET(req: Request) {
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

  const url = new URL(req.url)
  const fieldId = url.searchParams.get('field_id')?.trim() || ''
  const specialismId = url.searchParams.get('specialism_id')?.trim() || ''
  const stageId = url.searchParams.get('stage_id')?.trim() || ''

  if (!fieldId) {
    return NextResponse.json({ error: 'field_id is required.', code: 'bad_request' }, { status: 400 })
  }

  try {
    const { data: field, error: fieldErr } = await supabase
      .from('career_library_fields')
      .select('id, name')
      .eq('id', fieldId)
      .maybeSingle()
    if (fieldErr || !field) {
      return NextResponse.json({ error: 'Field not found.', code: 'not_found' }, { status: 404 })
    }

    let specialismName: string | null = null
    if (specialismId) {
      const { data: spec } = await supabase
        .from('career_library_specialisms')
        .select('id, name')
        .eq('id', specialismId)
        .maybeSingle()
      specialismName = spec?.name ?? null
    }

    let stageLabel: string | null = null
    let stageKey: string | null = null
    if (stageId) {
      const { data: stage } = await supabase
        .from('career_library_stages')
        .select('id, label, stage_key')
        .eq('id', stageId)
        .maybeSingle()
      stageLabel = stage?.label ?? null
      stageKey = stage?.stage_key ?? null
    }

    const options = buildWieCompletedCourseOptions({
      fieldName: field.name,
      specialismName,
      stageLabel,
      stageKey,
      limit: 12,
    })

    void trackJazEventServer({
      event_type: 'wie_courses_question_shown',
      event_source: 'work_in_education_library_wizard',
      goal_path: 'work_in_education',
      metadata: {
        field: field.name,
        specialism: specialismName,
        stage: stageLabel,
        option_count: options.filter((o) => o.kind === 'course').length,
      },
    })

    return NextResponse.json({
      options,
      field: { id: field.id, name: field.name },
      specialism: specialismName ? { id: specialismId, name: specialismName } : null,
      stage: stageLabel ? { id: stageId, label: stageLabel, stage_key: stageKey } : null,
      question: 'Have you completed any related courses, training, or certificates?',
    })
  } catch (err) {
    console.error('[wie-library/completed-courses] failed', err)
    return NextResponse.json(
      { error: 'Could not load course options.', code: 'load_failed' },
      { status: 500 }
    )
  }
}
