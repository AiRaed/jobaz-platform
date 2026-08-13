/**
 * Filter course recommendations for Work in My Education goal path.
 */

import { classifyWieCourse, isEligibleForWieRecommendation } from './classify'
import { matchContamination, fieldContextBlob } from './contamination'
import type { WieCourseAlignment, WieRecommendContext } from './types'
import { WIE_GOAL } from './types'

export type FilterableCourse = {
  title: string
  shortLabel?: string | null
  coursePurpose?: string | null
  educationFields?: string[] | null
  specialisations?: string[] | null
  goalKeys?: string[] | null
  routeLabels?: string[] | null
  commercialStatus?: string | null
  adminNotes?: string | null
  matchScore?: number
}

export type WieFilteredCourse<T extends FilterableCourse> = T & {
  wie_alignment: WieCourseAlignment
  wie_rank_boost: number
}

/**
 * Rank boost: specialism > field > workplace bridge > general booster.
 */
function rankBoost(alignment: WieCourseAlignment, ctx: WieRecommendContext, title: string): number {
  const user = fieldContextBlob([ctx.educationField, ctx.specialism]).toLowerCase()
  const specs = alignment.specialism.map((s) => s.toLowerCase())
  const fields = alignment.education_field.map((s) => s.toLowerCase())
  let boost = 0

  if (ctx.specialism && specs.some((s) => user.includes(s) || s.includes(user))) boost += 40
  else if (ctx.educationField && fields.some((f) => user.includes(f) || f.includes(user))) boost += 25

  if (alignment.purpose === 'career_bridge') boost += 12
  if (alignment.purpose === 'uk_workplace_bridge') boost += 10
  if (alignment.purpose === 'technical_skill_booster') boost += 8
  if (alignment.purpose === 'professional_pathway') boost += 6
  if (alignment.purpose === 'cpd_add_on') boost += 4

  if (alignment.recommendation_strength === 'high') boost += 8
  if (alignment.recommendation_strength === 'medium') boost += 4

  // Soft title overlap with specialism
  if (ctx.specialism && new RegExp(ctx.specialism.split(/\s+/)[0] ?? '', 'i').test(title)) {
    boost += 5
  }

  return boost
}

export function filterCoursesForWorkInEducation<T extends FilterableCourse>(
  courses: T[],
  ctx: WieRecommendContext = {}
): WieFilteredCourse<T>[] {
  const userFieldBlob = fieldContextBlob([
    ctx.educationField,
    ctx.specialism,
    ctx.stageKey,
    ctx.stageLabel,
  ])

  const out: WieFilteredCourse<T>[] = []

  for (const course of courses) {
    const alignment = classifyWieCourse({
      title: course.title,
      shortLabel: course.shortLabel,
      coursePurpose: course.coursePurpose,
      educationFields: course.educationFields,
      specialisations: course.specialisations,
      goalKeys: course.goalKeys,
      routeLabels: course.routeLabels,
      commercialStatus: course.commercialStatus,
      adminNotes: course.adminNotes,
      stageHints: ctx.stageLabel ? [ctx.stageLabel] : null,
    })

    // User-context contamination gate (e.g. SIA while studying Accounting)
    const hit = matchContamination(course.title, userFieldBlob)
    if (hit && !hit.allowedForField) continue

    if (!isEligibleForWieRecommendation(alignment, ctx, course.title)) continue
    if (!alignment.recommended_for_goal.includes(WIE_GOAL)) continue

    out.push({
      ...course,
      wie_alignment: alignment,
      wie_rank_boost: rankBoost(alignment, ctx, course.title),
    })
  }

  return out.sort(
    (a, b) =>
      b.wie_rank_boost - a.wie_rank_boost ||
      (b.matchScore ?? 0) - (a.matchScore ?? 0)
  )
}

/** Quick title-only gate for library learning options / loose lists. */
export function isTitleSafeForWorkInEducation(
  title: string,
  ctx: WieRecommendContext = {}
): boolean {
  const userFieldBlob = fieldContextBlob([
    ctx.educationField,
    ctx.specialism,
    ctx.stageKey,
    ctx.stageLabel,
  ])
  const hit = matchContamination(title, userFieldBlob)
  if (hit && !hit.allowedForField) return false
  return true
}
