/**
 * Work in My Profession course / licence alignment (public barrel).
 */

export { WIP_GOAL, WIP_GENERATED_SOURCE, WIP_GAP_COURSE_CATALOG } from './gap-course-catalog'
export type {
  WipCourseGroup,
  WipGapCourseType,
  WipGapCatalogPack,
} from './gap-course-catalog'
export {
  findWipCatalogPack,
  allWipCatalogCourseTitles,
  courseMatchesHints,
} from './gap-course-catalog'
export {
  matchWipContamination,
  isTitleSafeForWorkInProfession,
  WIP_CONTAMINATION_RULES,
} from './contamination'
export { buildWipMissingCourseTypeCard, groupLabel } from './gap-cards'
export {
  buildWipTrainingRecommendations,
} from './build-training'
export type {
  WipTrainingRecommendations,
  WipTrainingCard,
  WipTrainingCategory,
} from './build-training'
