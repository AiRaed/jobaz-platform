/**
 * JobAZ reusable career route-stage framework.
 *
 * Pattern: User Goal → Work Now → Training Upgrade → After Training
 * + CV stages, job search terms, course CTAs, My Plan fields, trust rules.
 *
 * @example
 * import { resolveCareerRouteStage, careerRouteStageRules } from '@/lib/career-routes'
 */

export type {
  CareerUserGoal,
  CareerRouteStageId,
  CareerRouteStageRule,
  CareerRouteImplementation,
  CareerSummaryTemplate,
  CareerCvStageConfig,
  CareerTrainingUpgrade,
  CareerRecommendedCourse,
  CareerRouteTrustRules,
  CareerRouteAnalyticsKeys,
  ResolvedCareerRouteStage,
  TrainingMentionStatus,
  CourseCtaMode,
} from './types'

export { careerRouteStageRules, fullCareerRouteStageRules } from './registry'
export {
  findCareerRouteStageRule,
  resolveCareerRouteStage,
  resolveUpgradeTrainingStatus,
  primaryTrainingUpgrade,
  type ResolveCareerRouteStageInput,
} from './resolve'
export {
  incompleteTrainingPhrase,
  trainedClaim,
  canClaimCompleted,
  resolveCourseCtaMode,
} from './trust'
export { securityExtraIncomeRoute } from './rules/securityExtraIncome'
export {
  careRouteStub,
  warehouseRouteStub,
  constructionRouteStub,
  hospitalityRouteStub,
  customerServiceRouteStub,
  digitalItRouteStub,
  routeStageStubs,
} from './rules/stubs'
