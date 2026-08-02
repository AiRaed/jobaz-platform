/**
 * JAZ Career Engine — public internal exports.
 */

export { analyseCareerGoal } from './analyseCareerGoal'
export { mapJazAnalyseToJobAZPlan } from './mapJazAnalyseToJobAZPlan'
export { buildJazAnalyseInputFromAnswers } from './buildInputFromAnswers'
export { buildFallbackBrainReasoning } from './fallbackPlan'
export { attachJazToCareerResult } from './attachJazToCareerResult'
export { buildJazInputForGoal } from './goalInput'
export { preferJazOrLegacyPlan } from './preferJazPlan'
export { applySafetyToReasoning, finalizeSafetyOnResult, routeAllowsSia } from './safetyRules'
export { loadJazCourseInventory, adaptAdminCourse } from './courseInventoryAdapter'
export { matchCourseTypesToInventory, courseRelevanceScore } from './courseMatcher'
export {
  resolveCommercialPresentation,
  rankRelevantCourses,
  assertNoFakeApplyNow,
} from './commercialMatcher'
export type {
  JazAnalyseInput,
  JazAnalyseResult,
  JazBrainReasoning,
  JazMatchedCourse,
  JazRecommendedCourseType,
} from './types'
export type { JazPlanSource, JazAttachedFields } from './attachJazToCareerResult'
export { JAZ_ENGINE_VERSION, JAZ_CAREER_ANALYSE_FEATURE } from './types'
