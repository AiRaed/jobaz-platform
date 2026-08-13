export type {
  CareerGoalPath,
  WieAdminBadge,
  WieAlignmentAuditSummary,
  WieCourseAlignment,
  WieCourseAlignmentInput,
  WieCoursePurpose,
  WieRecommendContext,
  WieRecommendationStrength,
  WieUserStageFit,
} from './types'
export { WIE_GOAL } from './types'
export {
  classifyWieCourse,
  classifyOpportunityLike,
  isEligibleForWieRecommendation,
} from './classify'
export {
  filterCoursesForWorkInEducation,
  isTitleSafeForWorkInEducation,
} from './filter-recommendations'
export { buildWieCourseAlignmentAudit, formatWieAuditMarkdown } from './audit'
export { PURPOSE_LABELS } from './purpose-rules'
export { CONTAMINATION_RULES, matchContamination } from './contamination'
export {
  buildWieCourseCoverageAudit,
  lookupWieCoverageForRoute,
  formatWieCoverageMarkdown,
  type WieCoverageAudit,
  type WieCoverageStatus,
  type WieFieldCoverage,
  type WieSpecialismCoverage,
} from './coverage'
export {
  suggestCourseTypesForWieRoute,
  type SuggestedCourseType,
} from './suggested-course-types'
export {
  buildWieMissingCourseTypeCards,
  wieMatchTierBoost,
} from './gap-cards'
export {
  findCatalogPacksForFieldName,
  allCatalogCourseTitles,
  WIE_GENERATED_SOURCE,
  WIE_GAP_COURSE_CATALOG,
} from './gap-course-catalog'
export {
  buildWieCompletedCourseOptions,
  normalizeCompletedCoursesSelection,
  buildWieTrainingRecommendations,
  nextTrainingTitlesForPlan,
  completedTrainingForCv,
  WIE_COMPLETED_NONE_ID,
  WIE_COMPLETED_NOT_SURE_ID,
  WIE_COMPLETED_OTHER_ID,
  type WieCompletedCoursesAnswers,
  type WieCompletedCourseOption,
  type WieTrainingRecommendations,
  type WieTrainingCard,
  type WieTrainingCategory,
  type WieCourseConfidence,
} from './completed-courses'
export {
  inferWieTrainingItemType,
  groupTrainingCardsByItemType,
  trainingItemTypeLabel,
  isProviderEligibleType,
  isCompletionTrackableType,
  type WieTrainingItemType,
  type WieTrainingItemTypeMeta,
} from './training-item-type'

export const WIE_ADMIN_BADGE_LABELS: Record<string, string> = {
  work_in_education_aligned: 'Work in My Education aligned',
  not_for_work_in_education: 'Not for Work in Education',
  needs_education_field_mapping: 'Needs education-field mapping',
  needs_specialism_mapping: 'Needs specialism mapping',
  needs_stage_mapping: 'Needs stage mapping',
  possible_contamination_risk: 'Possible contamination risk',
}
