/**
 * JobAZ AI Intelligence Engine — unified career profile system.
 */

export type {
  AiSignalType,
  EngineInsights,
  JourneyEntry,
  EmitAiSignalOptions,
  UpdateUserProfileInput,
} from './types'

export { AI_SIGNAL_RULES, normalizeSignal } from './signals'
export {
  calculateBaseReadiness,
  applyReadinessDelta,
  deriveReadinessAfterSignal,
  deriveStrongestWeakest,
} from './calculateReadiness'
export {
  calculateBaseEngagement,
  applyEngagementDelta,
  applyInactivityPenalty,
  deriveEngagementAfterSignal,
} from './calculateEngagement'
export {
  generateSmartRecommendations,
  generateNextAction,
  generateRecommendationReason,
  generateWeeklyFocus,
  generateEngineInsightsFromProfile,
} from './generateInsights'
export { generateWeeklyPlan } from './generateWeeklyPlan'
export { updateUserProfile, notifyProfileUpdated } from './updateUserProfile'
export { evolveAiStage, EVOLUTION_STAGE_LABELS, parseEvolutionStage } from './evolveStage'
export {
  baselineEnglishConfidence,
  getEnglishConfidenceScore,
  isEnglishConfidenceStrong,
} from './englishConfidence'
export {
  getJobSearchActivityScore,
  hasJobSearchActivity,
  isLowJobActivity,
} from './jobSearchActivity'
export {
  shouldEmitSignal,
  recordSignalEmission,
  isHighValueSignal,
  getSignalCooldownMinutes,
  dedupeTimelineEvents,
} from './shouldEmitSignal'
export type { AiEvolutionStage } from './evolveStage'
