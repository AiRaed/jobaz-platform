export type {
  CvPlanStageId,
  CvSummarySuggestionId,
  CvRouteSuggestionRule,
  ResolvedCvSuggestions,
  TrainingMentionStatus,
} from './types'
export { cvSuggestionRules, securityExtraIncomeRule } from './securityExtraIncome'
export {
  findCvSuggestionRule,
  resolveCvSuggestions,
  resolveUpgradeTrainingStatus,
  toCareerStageId,
  toCvPlanStageId,
} from './resolveCvSuggestions'

/** Prefer this for new code — shared route-stage framework. */
export {
  careerRouteStageRules,
  resolveCareerRouteStage,
  resolveCourseCtaMode,
} from '@/lib/career-routes'
