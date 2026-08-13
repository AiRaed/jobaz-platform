/**
 * Looking for Extra Income library MVP (public barrel).
 */

export {
  EXTRA_INCOME_CATEGORIES,
  EXTRA_INCOME_OPTIONS,
  listExtraIncomeCategories,
  listExtraIncomeOptions,
  getExtraIncomeCategory,
  getExtraIncomeOption,
  getExtraIncomeOptionByTitle,
} from './extra-income-routes'
export type {
  ExtraIncomeCategoryId,
  ExtraIncomeCategory,
  ExtraIncomeOption,
  ExtraIncomeStartSpeed,
} from './extra-income-routes'

export { buildExtraIncomeLibraryResult, optionTypeLabelForCategory } from './extra-income-result-builder'
export type { PublicExtraIncomeResult } from './extra-income-result-builder'

export {
  buildExtraIncomeCourseCards,
  isCourseTitleAllowedForOption,
  categoryShowsCoursesFirst,
} from './extra-income-course-alignment'
export type { ExtraIncomeCourseCard } from './extra-income-course-alignment'
