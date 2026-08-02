/**
 * JobAZ AI — independent engine and provider layer.
 *
 * Architecture:
 *   UI / features → providers → engines → structured results
 *
 * Swap providers (Ollama, vLLM, local models) without changing pages.
 */

export type {
  AssessmentAnswers,
  CareerAssessmentResult,
  CareerAssessmentScores,
  CareerPathType,
  RecommendedTool,
  SituationAnswer,
  ExperienceAnswer,
  EnglishAnswer,
  CvAnswer,
  HelpNextAnswer,
  CareerAssessmentProvider,
} from './types'

export {
  aiProvider,
  getAiProviderRouter,
  getAiProviderConfig,
  resolveModelTier,
  generateCareerAssessment,
  getCareerAssessmentProvider,
  setCareerAssessmentProvider,
  resetCareerAssessmentProvider,
  ruleBasedCareerAssessmentProvider,
  createOllamaCareerAssessmentProvider,
  createLocalLLMCareerAssessmentProvider,
  createVLLMCareerAssessmentProvider,
} from './providers'

export type { FeatureModelTier } from './providers'

export type {
  AiProviderId,
  AiMessage,
  AiGenerateTextOptions,
  AiGenerateStructuredOptions,
  AiGenerateResult,
} from './providers'

export { runCareerAssessmentEngine } from './engines/careerAssessmentEngine'
export { generateRichCareerInsights,
  type RichCareerInsights,
  type RichActionPlanTask,
  type StoredRichActionPlan,
} from './engines/careerAssessment/richInsights'

export {
  emitAiSignal,
  notifyProfileUpdated,
  shouldEmitSignal,
  recordSignalEmission,
  isHighValueSignal,
  getSignalCooldownMinutes,
  type EmitAiSignalInput,
  type EmitSignalMetadata,
  type EmitSignalImpact,
  type AiSignalType,
} from './emitSignal'

export {
  emitInterviewStarted,
  emitInterviewQuestionAnswered,
  emitInterviewCompleted,
  emitVoiceTrainingCompleted,
  emitMockInterviewCompleted,
} from './interviewCoachSignals'

export {
  emitSkillPathViewed,
  emitSkillPathStarted,
  emitSkillGoalSelected,
  emitLessonCompleted,
} from './skillPathSignals'

export {
  updateUserProfile,
  generateSmartRecommendations,
  generateWeeklyPlan,
  type JourneyEntry,
} from './engine'

export {
  getOrCreateAnonymousId,
  getOrCreateSessionId,
  trackAiCareerEvent,
  saveAiCareerAssessment,
  updateAiUserProfileFromAssessment,
  computeReadinessScore,
  computeEngagementScore,
  AI_CAREER_SOURCE,
  AI_CAREER_PAGE,
} from './memory'

export type {
  AiCareerEventName,
  AiCareerEventMetadata,
  SaveAiCareerAssessmentInput,
  UpdateAiUserProfileInput,
  EngagementSignals,
} from './memory'

export {
  getAiAnalyticsOverview,
  getAiProfilesOverview,
  getCareerPathStats,
  getToolStats,
  getFunnelStats,
  getDropoffStats,
  getRecentAiEvents,
  getAiAnalyticsDashboardData,
} from './analytics'

export type {
  AiAnalyticsOverview,
  AiProfilesOverview,
  AiAnalyticsDashboardData,
  CareerPathStatRow,
  DropoffStepStat,
  FunnelStatRow,
  RecentAiEventRow,
  ToolStatRow,
} from './analytics'

export {
  getUserAiProfile,
  generateDashboardRecommendations,
  trackAiDashboardEvent,
  AI_DASHBOARD_PAGE,
  AI_DASHBOARD_SOURCE,
} from './profile'

export type {
  AiUserProfile,
  DashboardAiInsights,
  DashboardRecommendation,
  AiDashboardEventName,
  AiDashboardEventMetadata,
} from './profile'
