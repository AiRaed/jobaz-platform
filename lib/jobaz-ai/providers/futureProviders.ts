/**
 * Future AI provider registry — Claude, Gemini, Groq, TogetherAI.
 * Implementations plug in here without changing tool/API route code.
 */

import type { FutureAiProviderId } from './types'

export type FutureProviderStatus = 'planned' | 'beta' | 'active'

export type FutureProviderDefinition = {
  id: FutureAiProviderId
  status: FutureProviderStatus
  envKey: string
  fastModelEnv?: string
  qualityModelEnv?: string
}

/** Registry for upcoming providers — router can extend resolveProviderIdForTier. */
export const FUTURE_PROVIDER_REGISTRY: Record<FutureAiProviderId, FutureProviderDefinition> = {
  claude: {
    id: 'claude',
    status: 'planned',
    envKey: 'ANTHROPIC_API_KEY',
    qualityModelEnv: 'ANTHROPIC_MODEL_QUALITY',
    fastModelEnv: 'ANTHROPIC_MODEL',
  },
  gemini: {
    id: 'gemini',
    status: 'planned',
    envKey: 'GOOGLE_AI_API_KEY',
    qualityModelEnv: 'GEMINI_MODEL_QUALITY',
    fastModelEnv: 'GEMINI_MODEL',
  },
  groq: {
    id: 'groq',
    status: 'planned',
    envKey: 'GROQ_API_KEY',
    fastModelEnv: 'GROQ_MODEL',
  },
  together: {
    id: 'together',
    status: 'planned',
    envKey: 'TOGETHER_API_KEY',
    fastModelEnv: 'TOGETHER_MODEL',
  },
}

export function isFutureProviderConfigured(id: FutureAiProviderId): boolean {
  const def = FUTURE_PROVIDER_REGISTRY[id]
  return Boolean(process.env[def.envKey]?.trim())
}

export function listFutureProviders(): FutureProviderDefinition[] {
  return Object.values(FUTURE_PROVIDER_REGISTRY)
}
