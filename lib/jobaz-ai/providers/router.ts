/**
 * JobAZ AI provider router — feature-based tier routing with local → fast → quality fallback.
 */

import { isFallbackEnabled, logAiCallComplete, logAiRouterDecision, resolvePreferredProviderId } from './base'
import {
  getTierFallbackChain,
  mapTierToProviderModelTier,
  resolveModelTier,
  resolveProviderIdForTier,
} from './featureModelMap'
import { ollamaTextProvider } from './ollama'
import { openAiTextProvider } from './openai'
import { recordAiUsage, recordLocalSkipped, resolveCostBucket } from './usageTracker'
import type {
  AiGenerateResult,
  AiGenerateStructuredOptions,
  AiGenerateTextOptions,
  AiModelTier,
  AiProviderId,
  AiProviderRouterConfig,
  AiStreamTextOptions,
  AiStructuredResult,
  AiTextProvider,
  FeatureModelTier,
} from './types'

function getProviderById(id: AiProviderId): AiTextProvider {
  return id === 'ollama' ? ollamaTextProvider : openAiTextProvider
}

export function getAiProviderConfig(): AiProviderRouterConfig {
  return {
    preferredProvider: resolvePreferredProviderId(),
    fallbackEnabled: isFallbackEnabled(),
    timeoutMs: Number(process.env.AI_PROVIDER_TIMEOUT_MS ?? 60_000),
    openai: {
      apiKey: process.env.OPENAI_API_KEY?.trim() ?? '',
      fastModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      qualityModel: process.env.OPENAI_MODEL_QUALITY || 'gpt-4o',
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      localModel: process.env.OLLAMA_MODEL || 'llama3',
      qualityModel:
        process.env.OLLAMA_MODEL_QUALITY || process.env.OLLAMA_MODEL || 'llama3',
    },
  }
}

class AiProviderRouter implements AiTextProvider {
  readonly id = resolvePreferredProviderId()

  isConfigured(): boolean {
    if (openAiTextProvider.isConfigured()) return true
    if (ollamaTextProvider.isConfigured()) return true
    return false
  }

  async isAvailable(): Promise<boolean> {
    if (await openAiTextProvider.isAvailable()) return true
    if (await ollamaTextProvider.isAvailable()) return true
    return false
  }

  resolveModel(tier?: AiModelTier, override?: string): string {
    const resolved = resolveModelTier(undefined, tier)
    const providerId = resolveProviderIdForTier(resolved)
    const providerTier = mapTierToProviderModelTier(resolved)
    return getProviderById(providerId).resolveModel(providerTier, override)
  }

  private async executeWithTierChain<T extends AiGenerateResult>(
    options: AiGenerateTextOptions,
    run: (provider: AiTextProvider, routed: AiGenerateTextOptions) => Promise<T>
  ): Promise<T> {
    const feature = options.feature
    const preferredTier = resolveModelTier(feature, options.modelTier)
    const chain = getTierFallbackChain(preferredTier, feature)
    const fallbackEnabled = isFallbackEnabled()

    let lastError: unknown
    let attemptIndex = 0

    for (const tier of chain) {
      const providerId = resolveProviderIdForTier(tier)
      const provider = getProviderById(providerId)

      if (!(await provider.isAvailable())) {
        if (tier === 'local' && providerId === 'ollama') {
          recordLocalSkipped()
        }
        if (!fallbackEnabled) {
          lastError = new Error(`${providerId} unavailable for tier=${tier}`)
          break
        }
        continue
      }

      const providerTier = mapTierToProviderModelTier(tier)
      const model = provider.resolveModel(providerTier, options.model)
      const isFallback = attemptIndex > 0

      logAiRouterDecision({
        feature,
        tier,
        provider: providerId,
        model,
        fallback: isFallback,
      })

      const routedOptions: AiGenerateTextOptions = {
        ...options,
        modelTier: providerTier,
      }

      try {
        const result = await run(provider, routedOptions)
        const finalResult = {
          ...result,
          tier,
          feature,
          fallbackUsed: isFallback,
          fallbackFrom: isFallback
            ? resolveProviderIdForTier(chain[attemptIndex - 1] ?? tier)
            : undefined,
        }

        logAiCallComplete({
          feature,
          tier,
          provider: finalResult.provider,
          model: finalResult.model,
          fallbackUsed: finalResult.fallbackUsed,
          latencyMs: finalResult.latencyMs,
        })

        recordAiUsage({
          feature: feature ?? 'unknown',
          tier,
          provider: finalResult.provider,
          model: finalResult.model,
          fallbackUsed: finalResult.fallbackUsed,
          latencyMs: finalResult.latencyMs,
          costBucket: resolveCostBucket(finalResult.provider, tier),
        })

        return finalResult
      } catch (err) {
        lastError = err
        if (!fallbackEnabled) throw err
        attemptIndex += 1
      }
    }

    throw (
      lastError ??
      new Error(`No AI provider available (feature=${feature ?? 'unknown'}, tier=${preferredTier})`)
    )
  }

  generateText(options: AiGenerateTextOptions) {
    return this.executeWithTierChain(options, (provider, routed) =>
      provider.generateText(routed).then((result) => ({
        ...result,
        provider: provider.id,
      }))
    )
  }

  generateStructured<T>(options: AiGenerateStructuredOptions<T>): Promise<AiStructuredResult<T>> {
    return this.executeWithTierChain(options, (provider, routed) =>
      provider.generateStructured(routed).then((result) => ({
        ...result,
        provider: provider.id,
      }))
    ) as Promise<AiStructuredResult<T>>
  }

  streamText(options: AiStreamTextOptions) {
    return this.executeWithTierChain(options, (provider, routed) =>
      provider.streamText(routed).then((result) => ({
        ...result,
        provider: provider.id,
      }))
    )
  }

  /** Audio transcription — OpenAI Whisper only (no tier routing). */
  async transcribeAudio(file: File, options?: { model?: string; feature?: string }): Promise<string> {
    const { transcribeAudioWithOpenAi } = await import('./openai')
    return transcribeAudioWithOpenAi(file, options)
  }
}

export const aiProvider = new AiProviderRouter()

export function getAiProviderRouter(): AiProviderRouter {
  return aiProvider
}

export { resolveModelTier } from './featureModelMap'
export {
  FEATURE_MODEL_MAP,
  FEATURE_ROUTING_GROUPS,
  getTierFallbackChain,
  lookupFeatureTier,
  normalizeFeatureKey,
} from './featureModelMap'

export { openAiTextProvider, transcribeAudioWithOpenAi } from './openai'
export { ollamaTextProvider, isOllamaAvailable, generateWithOllama } from './ollama'
