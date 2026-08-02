/**
 * JobAZ centralized AI text provider layer.
 *
 * Tools import:
 *   import { aiProvider } from '@/lib/jobaz-ai/providers'
 *
 * Career assessment providers remain available from the same module.
 */

export { aiProvider, getAiProviderRouter, getAiProviderConfig, resolveModelTier } from './router'
export { openAiTextProvider, ollamaTextProvider } from './router'
export { isOllamaAvailable, generateWithOllama, getOllamaBaseUrl, resolveOllamaModelName } from './ollama'
export { transcribeAudioWithOpenAi } from './openai'

export type {
  AiProviderId,
  AiMessage,
  AiMessageRole,
  AiModelTier,
  FeatureModelTier,
  FutureAiProviderId,
  AiGenerateTextOptions,
  AiGenerateStructuredOptions,
  AiStreamTextOptions,
  AiGenerateResult,
  AiStructuredResult,
  AiStreamResult,
  AiTextProvider,
  AiProviderRouterConfig,
  AiProviderLogEntry,
  AiRouterLogEntry,
} from './types'

export {
  FEATURE_MODEL_MAP,
  FEATURE_ROUTING_GROUPS,
  getTierFallbackChain,
  lookupFeatureTier,
  normalizeFeatureKey,
  normalizeModelTier,
  resolveProviderIdForTier,
  mapTierToProviderModelTier,
} from './featureModelMap'

export {
  getAiUsageSummary,
  resetAiUsageSummary,
  recordAiUsage,
  resolveCostBucket,
  type AiUsageSummary,
  type AiCostBucket,
} from './usageTracker'

export {
  FUTURE_PROVIDER_REGISTRY,
  isFutureProviderConfigured,
  listFutureProviders,
} from './futureProviders'

export {
  DEFAULT_AI_TIMEOUT_MS,
  extractJsonFromText,
  parseJsonFromText,
  resolvePreferredProviderId,
  isFallbackEnabled,
  withTimeout,
  logAiRouterDecision,
  logAiCallComplete,
} from './base'

export {
  CV_WRITER_SYSTEM,
  COVER_LETTER_SYSTEM,
  WRITING_REVIEW_SYSTEM,
  INTERVIEW_COACH_SYSTEM,
  CAREER_ASSESSMENT_SYSTEM,
  JSON_ONLY_SUFFIX,
} from './prompts'

export {
  generateCareerAssessment,
  getCareerAssessmentProvider,
  setCareerAssessmentProvider,
  resetCareerAssessmentProvider,
  ruleBasedCareerAssessmentProvider,
  createOllamaCareerAssessmentProvider,
  createLocalLLMCareerAssessmentProvider,
  createVLLMCareerAssessmentProvider,
} from './assessment'
