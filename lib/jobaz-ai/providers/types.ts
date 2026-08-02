/**
 * Centralized JobAZ AI text provider — shared types.
 */

export type AiProviderId = 'openai' | 'ollama'

/** Future providers — types only until wired in router registry. */
export type FutureAiProviderId = 'claude' | 'gemini' | 'groq' | 'together'

export type AiMessageRole = 'system' | 'user' | 'assistant'

export type AiMessage = {
  role: AiMessageRole
  content: string
}

/** Routing tiers for feature-based model selection. */
export type FeatureModelTier = 'fast' | 'quality' | 'local' | 'fallback'

/**
 * Provider model tier.
 * `default` is a legacy alias for `fast` (kept for existing API routes).
 */
export type AiModelTier = FeatureModelTier | 'default'

export type AiGenerateBaseOptions = {
  messages: AiMessage[]
  model?: string
  modelTier?: AiModelTier
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  /** OpenAI JSON mode — ignored by Ollama (prompt-driven JSON instead). */
  responseFormat?: 'text' | 'json_object'
  /** Tool/feature name for logging, e.g. `cv-improve-bullet`. */
  feature?: string
}

export type AiGenerateTextOptions = AiGenerateBaseOptions

export type AiGenerateStructuredOptions<T = unknown> = AiGenerateBaseOptions & {
  parse?: (raw: string) => T
}

export type AiStreamTextOptions = AiGenerateBaseOptions & {
  onChunk?: (chunk: string) => void
}

export type AiGenerateResult = {
  text: string
  provider: AiProviderId
  model: string
  latencyMs: number
  fallbackUsed: boolean
  fallbackFrom?: AiProviderId
  /** Resolved routing tier for this call. */
  tier?: FeatureModelTier
  feature?: string
}

export type AiStructuredResult<T> = AiGenerateResult & {
  data: T
}

export type AiStreamResult = AiGenerateResult & {
  stream: ReadableStream<Uint8Array>
}

export interface AiTextProvider {
  readonly id: AiProviderId
  isConfigured(): boolean
  isAvailable(): Promise<boolean>
  resolveModel(tier?: AiModelTier, override?: string): string
  generateText(options: AiGenerateTextOptions): Promise<AiGenerateResult>
  generateStructured<T>(options: AiGenerateStructuredOptions<T>): Promise<AiStructuredResult<T>>
  streamText(options: AiStreamTextOptions): Promise<AiStreamResult>
}

export type AiProviderRouterConfig = {
  preferredProvider: AiProviderId
  fallbackEnabled: boolean
  timeoutMs: number
  openai: {
    apiKey: string
    fastModel: string
    qualityModel: string
  }
  ollama: {
    baseUrl: string
    localModel: string
    qualityModel: string
  }
}

export type AiRouterLogEntry = {
  feature?: string
  tier: FeatureModelTier
  provider: AiProviderId | FutureAiProviderId
  model: string
  fallback: boolean
  attemptIndex?: number
}

export type AiProviderLogEntry = {
  feature?: string
  provider: AiProviderId
  model: string
  latencyMs: number
  fallbackUsed: boolean
  fallbackFrom?: AiProviderId
  ok: boolean
  error?: string
}
