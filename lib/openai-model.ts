/**
 * Central OpenAI model selection for JobAZ API routes.
 * Delegates to the centralized AI provider config when available.
 */

import { getAiProviderConfig } from '@/lib/jobaz-ai/providers'

/** Default chat model — fast, cost-effective. */
export function getOpenAiModel(): string {
  return getAiProviderConfig().openai.fastModel
}

/** Higher-quality chat model for complex generation and evaluation. */
export function getOpenAiQualityModel(): string {
  return getAiProviderConfig().openai.qualityModel
}

/** Whether any AI text provider is configured for server routes. */
export function isAiTextConfigured(): boolean {
  const config = getAiProviderConfig()
  if (config.preferredProvider === 'openai') {
    return Boolean(config.openai.apiKey)
  }
  return true
}
