/**
 * Build public Extra Income result from category + option.
 */

import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { AdminCourse } from '@/lib/admin/courses/types'
import {
  getExtraIncomeCategory,
  getExtraIncomeOption,
  type ExtraIncomeCategoryId,
  type ExtraIncomeOption,
} from './extra-income-routes'
import {
  buildExtraIncomeCourseCards,
  categoryShowsCoursesFirst,
  type ExtraIncomeCourseCard,
} from './extra-income-course-alignment'

export type PublicExtraIncomeResult = {
  pathway: 'looking_for_extra_income'
  result_source: 'extra_income_library'
  headline: string
  result_framing: string
  category_id: ExtraIncomeCategoryId
  category_label: string
  option_id: string
  option_title: string
  /** e.g. "Shift work route" — used in result header with option_title. */
  option_type_label: string
  /** e.g. "Shift work route: Kitchen / Food Assistant Shifts" */
  option_display_title: string
  short_description: string
  time_fit: string
  start_speed: string
  needs_licence: boolean
  needs_short_training: boolean
  warning_note: string | null
  /** Category-specific section layout key. */
  layout:
    | 'jobs_first'
    | 'training_first'
    | 'licence_first'
    | 'online_first'
  jobs: string[]
  job_search_keywords: string[]
  first_steps: string[]
  skills_or_portfolio: string[]
  important_note: string | null
  courses_primary: ExtraIncomeCourseCard[]
  courses_boosters: ExtraIncomeCourseCard[]
  recommended_course_count: number
  missing_provider_count: number
  show_courses_button: boolean
}

export function optionTypeLabelForCategory(category: ExtraIncomeCategoryId): string {
  if (category === 'start_without_licence') return 'Job option'
  if (category === 'quick_shifts_short_training') return 'Shift work route'
  if (category === 'licence_based') return 'Licence-based work route'
  return 'Online option'
}

function layoutFor(category: ExtraIncomeCategoryId): PublicExtraIncomeResult['layout'] {
  if (category === 'start_without_licence') return 'jobs_first'
  if (category === 'quick_shifts_short_training') return 'training_first'
  if (category === 'licence_based') return 'licence_first'
  return 'online_first'
}

function framingFor(category: ExtraIncomeCategoryId, option: ExtraIncomeOption): string {
  if (category === 'start_without_licence') {
    return 'Practical UK options you can often try without a formal licence first.'
  }
  if (category === 'quick_shifts_short_training') {
    return 'Short training first, then realistic jobs this can support.'
  }
  if (category === 'licence_based') {
    return option.warning_note
      ? 'Licence or formal training comes first — this may not be an immediate start.'
      : 'Complete the required licence or training, then target matching UK roles.'
  }
  return 'Online and from-home options — build skills and a simple portfolio where it helps.'
}

export function buildExtraIncomeLibraryResult(input: {
  category_id: string
  option_id: string
  opportunities?: CourseOpportunity[]
  publishedCourses?: AdminCourse[]
}): PublicExtraIncomeResult | null {
  const category = getExtraIncomeCategory(input.category_id)
  const option = getExtraIncomeOption(input.option_id)
  if (!category || !option || option.category !== category.id) return null

  const courseBundle = buildExtraIncomeCourseCards({
    option,
    opportunities: input.opportunities ?? [],
    publishedCourses: input.publishedCourses ?? [],
  })

  const noLicenceNote =
    category.id === 'start_without_licence' && !option.needs_licence
      ? 'No formal licence usually needed to start — always check the employer listing.'
      : null

  const important_note =
    option.warning_note?.trim() ||
    noLicenceNote ||
    (category.id === 'licence_based'
      ? 'Do not apply for licensed roles until you hold the required licence or certification.'
      : null)

  const courses_primary = courseBundle.required_or_recommended
  const courses_boosters = courseBundle.optional_boosters
  const recommended_course_count = courses_primary.length + courses_boosters.length
  const option_type_label = optionTypeLabelForCategory(category.id)

  return {
    pathway: 'looking_for_extra_income',
    result_source: 'extra_income_library',
    headline: 'Your extra income option',
    result_framing: framingFor(category.id, option),
    category_id: category.id,
    category_label: category.label,
    option_id: option.id,
    option_title: option.option_title,
    option_type_label,
    option_display_title: `${option_type_label}: ${option.option_title}`,
    short_description: option.short_description,
    time_fit: option.time_fit,
    start_speed: option.start_speed,
    needs_licence: option.needs_licence,
    needs_short_training: option.needs_short_training,
    warning_note: option.warning_note ?? null,
    layout: layoutFor(category.id),
    jobs: option.possible_job_titles,
    job_search_keywords: option.job_search_keywords,
    first_steps: option.first_steps,
    skills_or_portfolio: option.skills_or_portfolio ?? [],
    important_note,
    courses_primary,
    courses_boosters,
    recommended_course_count,
    missing_provider_count: courseBundle.missing_provider_count,
    show_courses_button:
      recommended_course_count > 0 || categoryShowsCoursesFirst(category.id),
  }
}
