import { NextResponse } from 'next/server'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'
import {
  DEFAULT_PROFESSION_GOAL,
  buildWipTrainingRecommendations,
  getProfessionFieldById,
  getProfessionFieldBySlug,
  getSpecialismBySlug,
  loadProfessionKnowledge,
  matchProfessionLibrary,
  resolveExperienceSelection,
} from '@/lib/career-engine/work-in-profession'
import {
  loadServerOpportunityPool,
  loadServerPublishedCourses,
} from '@/lib/recommendations/opportunityPool'

export const dynamic = 'force-dynamic'

/**
 * POST Work in My Profession match + training/licence alignment.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.', code: 'bad_json' }, { status: 400 })
  }

  const fieldId = typeof body.field_id === 'string' ? body.field_id.trim() : ''
  const fieldSlugIn = typeof body.field_slug === 'string' ? body.field_slug.trim() : ''
  const specialismId = typeof body.specialism_id === 'string' ? body.specialism_id.trim() : ''
  const specialismSlugIn =
    typeof body.specialism_slug === 'string' ? body.specialism_slug.trim() : ''
  const experienceOptionId =
    typeof body.experience_option_id === 'string' ? body.experience_option_id.trim() : ''
  const levelRaw =
    typeof body.professional_level === 'string' ? body.professional_level.trim() : ''

  const field =
    (fieldId && getProfessionFieldById(fieldId)) ||
    (fieldSlugIn && getProfessionFieldBySlug(fieldSlugIn)) ||
    null

  if (!field) {
    return NextResponse.json(
      { error: 'Please select a profession field.', code: 'missing_field' },
      { status: 400 }
    )
  }

  let specialismSlug = specialismSlugIn
  if (!specialismSlug && specialismId) {
    const spec = loadProfessionKnowledge().specialisms.find((s) => s.id === specialismId)
    specialismSlug = spec?.slug || ''
  }

  const specialism = specialismSlug
    ? getSpecialismBySlug(field.slug, specialismSlug)
    : null

  if (!specialism) {
    return NextResponse.json(
      { error: 'Please select a specialism.', code: 'missing_specialism' },
      { status: 400 }
    )
  }

  const resolved = resolveExperienceSelection(
    field.slug,
    experienceOptionId || null,
    levelRaw || null
  )

  if (!resolved) {
    return NextResponse.json(
      { error: 'Please select what best describes your experience.', code: 'missing_level' },
      { status: 400 }
    )
  }

  const result = matchProfessionLibrary({
    field_slug: field.slug,
    specialism_slug: specialism.slug,
    experience_option_id: resolved.option.id,
    professional_level: resolved.option.mapped_level,
    selected_goal: DEFAULT_PROFESSION_GOAL,
  })

  try {
    const [opportunities, publishedCourses] = await Promise.all([
      loadServerOpportunityPool(),
      loadServerPublishedCourses(),
    ])
    result.training_recommendations = buildWipTrainingRecommendations({
      fieldSlug: field.slug,
      fieldName: field.name,
      specialismSlug: specialism.slug,
      specialismName: specialism.name,
      experienceOptionId: resolved.option.id,
      professionalLevel: resolved.option.mapped_level,
      roleLicenceHints: result.roles
        .map((r) => r.licence_or_check)
        .filter((v): v is string => Boolean(v)),
      opportunities,
      publishedCourses,
    })
  } catch (err) {
    console.warn('[wip-library/match] training alignment failed', err)
    result.training_recommendations = null
  }

  void trackJazEventServer({
    event_type: 'career_plan_generated',
    event_source: 'work_in_profession_library',
    goal_path: 'work_in_profession',
    page_path: '/career-engine/work-in-profession',
    route_title: result.roles[0]?.role_title ?? result.specialism,
    metadata: {
      profession_field: result.profession_field,
      specialism: result.specialism,
      professional_level: result.professional_level_key,
      experience_option_id: result.experience_option_id,
      experience_mode: result.experience_mode,
      selected_goal: DEFAULT_PROFESSION_GOAL,
      matched_role_count: result.matched_role_count,
      training_required: result.training_recommendations?.required_licence.length ?? 0,
      training_next: result.training_recommendations?.recommended_next.length ?? 0,
      result_source: 'work_in_profession_library',
      fallback_used: result.fallback_used,
    },
  })

  return NextResponse.json({ result })
}
