/**
 * JobAZ AI Profile — dashboard personalization and long-term user intelligence.
 *
 * Later: AI-generated plans, AI conversations, memory context, predictive recommendations,
 * custom career journeys.
 */

export { getUserAiProfile } from './getUserAiProfile'
export { getRecentAiCareerEvents, type AiCareerTimelineEvent } from './recentEvents'
export {
  generateDashboardRecommendations,
  getStrongestArea,
  getWeakestArea,
  resolveContinuePathFromProfile,
  AI_CAREER_PATH_FINDER_HREF,
} from './recommendations'
export { generateAiActionPlan } from './actionPlan'
export {
  updateProfileProgression,
  triggerProfileProgression,
  emitAiSignal,
  type ProgressionTriggerEvent,
} from './progression'
export type { ProgressionMeta } from './types'
export {
  careerStageFromReadiness,
  clampScore,
  computeProgressTrend,
  PROGRESS_TREND_LABELS,
  type CareerStage,
  type ProgressTrend,
} from './careerStage'
export {
  trackAiDashboardEvent,
  AI_DASHBOARD_PAGE,
  AI_DASHBOARD_SOURCE,
} from './dashboardEvents'
export type {
  AiUserProfile,
  AiUserProfileTool,
  AiActionPlan,
  AiActionPlanTask,
  AiActionPlanPriority,
  DashboardAiInsights,
  DashboardRecommendation,
  DashboardRecommendationType,
} from './types'
export type { AiDashboardEventName, AiDashboardEventMetadata } from './dashboardEvents'
