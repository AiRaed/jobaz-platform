/**
 * Ollama local text provider — real inference via POST /api/generate.
 */

import {
  buildGenerateResult,
  DEFAULT_AI_TIMEOUT_MS,
  logAiProviderCall,
  normalizeOllamaModel,
  parseJsonFromText,
} from './base'
import type {
  AiGenerateResult,
  AiGenerateStructuredOptions,
  AiGenerateTextOptions,
  AiMessage,
  AiModelTier,
  AiStreamResult,
  AiStreamTextOptions,
  AiStructuredResult,
  AiTextProvider,
} from './types'

type OllamaTagsResponse = {
  models?: Array<{ name: string }>
}

type OllamaGenerateResponse = {
  model?: string
  response?: string
  done?: boolean
  eval_count?: number
  prompt_eval_count?: number
}

export function getOllamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')
}

export function resolveOllamaModelName(tier: AiModelTier = 'local', override?: string): string {
  if (override?.trim()) return normalizeOllamaModel(override)
  if (tier === 'quality') {
    return normalizeOllamaModel(
      process.env.OLLAMA_MODEL_QUALITY || process.env.OLLAMA_MODEL || 'llama3'
    )
  }
  return normalizeOllamaModel(process.env.OLLAMA_MODEL || 'llama3')
}

async function ollamaFetch(path: string, init?: RequestInit, timeoutMs?: number): Promise<Response> {
  const url = `${getOllamaBaseUrl()}${path}`
  const ms = timeoutMs ?? DEFAULT_AI_TIMEOUT_MS
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, ms)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if (timedOut || (err instanceof Error && err.name === 'AbortError')) {
      throw new Error(`Ollama request timed out after ${ms}ms (${path})`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function logOllamaCall(entry: {
  model: string
  durationMs: number
  tokens?: number
  fallback?: boolean
  ok: boolean
  feature?: string
  error?: string
}): void {
  const parts = [
    `model=${entry.model}`,
    `duration=${entry.durationMs}ms`,
    `tokens=${entry.tokens ?? 'n/a'}`,
    `fallback=${entry.fallback ?? false}`,
    entry.feature ? `feature=${entry.feature}` : null,
    entry.ok ? 'ok' : `error=${entry.error ?? 'unknown'}`,
  ].filter(Boolean)

  if (entry.ok) {
    console.info('[OLLAMA]', parts.join(' | '))
  } else {
    console.warn('[OLLAMA]', parts.join(' | '))
  }
}

function modelNameMatches(available: string, target: string): boolean {
  const base = available.split(':')[0]?.toLowerCase()
  const want = target.split(':')[0]?.toLowerCase()
  return base === want || available.toLowerCase().startsWith(want)
}

/** Check Ollama is reachable and the configured model is pulled. */
export async function isOllamaAvailable(modelOverride?: string): Promise<boolean> {
  try {
    const res = await ollamaFetch('/api/tags', { method: 'GET' }, 5_000)
    if (!res.ok) return false

    const payload = (await res.json()) as OllamaTagsResponse
    const models = payload.models ?? []
    if (models.length === 0) return false

    const target = resolveOllamaModelName('local', modelOverride)
    return models.some((m) => modelNameMatches(m.name, target))
  } catch {
    return false
  }
}

function messagesToPrompt(messages: AiMessage[]): string {
  const parts: string[] = []
  for (const message of messages) {
    if (message.role === 'system') {
      parts.push(`System:\n${message.content}`)
    } else if (message.role === 'user') {
      parts.push(`User:\n${message.content}`)
    } else {
      parts.push(`Assistant:\n${message.content}`)
    }
  }
  parts.push('Assistant:')
  return parts.join('\n\n')
}

export type OllamaGenerateOptions = {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  feature?: string
  /** When set, Ollama constrains output (faster + more reliable for structured plans). */
  format?: 'json'
}

/** Real Ollama inference — POST /api/generate, streaming=false. */
export async function generateWithOllama(
  options: OllamaGenerateOptions
): Promise<{
  text: string
  model: string
  latencyMs: number
  tokens?: number
}> {
  const startedAt = Date.now()
  const model = resolveOllamaModelName('local', options.model)
  const timeoutMs = options.timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS ?? DEFAULT_AI_TIMEOUT_MS)

  const body = {
    model,
    prompt: options.prompt,
    stream: false,
    ...(options.format ? { format: options.format } : {}),
    options: {
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.maxTokens !== undefined ? { num_predict: options.maxTokens } : {}),
      // Smaller context = faster local CPU inference for career JSON.
      num_ctx: 2048,
    },
  }

  // Single timeout via AbortController (clearer than double withTimeout + abort).
  const res = await ollamaFetch(
    '/api/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    timeoutMs
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    const latencyMs = Date.now() - startedAt
    logOllamaCall({
      model,
      durationMs: latencyMs,
      fallback: false,
      ok: false,
      feature: options.feature,
      error: errText.slice(0, 200),
    })
    throw new Error(`Ollama generate failed (${res.status}): ${errText}`)
  }

  const payload = (await res.json()) as OllamaGenerateResponse
  const text = payload.response?.trim() ?? ''
  const tokens = payload.eval_count ?? payload.prompt_eval_count
  const latencyMs = Date.now() - startedAt

  logOllamaCall({
    model: payload.model ?? model,
    durationMs: latencyMs,
    tokens,
    fallback: false,
    ok: true,
    feature: options.feature,
  })

  return {
    text,
    model: payload.model ?? model,
    latencyMs,
    tokens,
  }
}

export class OllamaTextProvider implements AiTextProvider {
  readonly id = 'ollama' as const

  isConfigured(): boolean {
    return Boolean(getOllamaBaseUrl())
  }

  async isAvailable(): Promise<boolean> {
    return isOllamaAvailable()
  }

  resolveModel(tier?: AiModelTier, override?: string): string {
    return resolveOllamaModelName(tier, override)
  }

  async generateText(options: AiGenerateTextOptions): Promise<AiGenerateResult> {
    const startedAt = Date.now()
    const model = this.resolveModel(options.modelTier, options.model)
    const timeoutMs = options.timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS ?? DEFAULT_AI_TIMEOUT_MS)
    const feature = options.feature

    try {
      const available = await isOllamaAvailable(model)
      if (!available) {
        throw new Error(`Ollama unavailable or model "${model}" not found`)
      }

      const { text, model: usedModel, latencyMs, tokens } = await generateWithOllama({
        prompt: messagesToPrompt(options.messages),
        model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        timeoutMs,
        feature,
      })

      const result = buildGenerateResult({
        text,
        provider: this.id,
        model: usedModel,
        startedAt,
      })

      logAiProviderCall({
        feature,
        provider: this.id,
        model: usedModel,
        latencyMs: result.latencyMs,
        fallbackUsed: false,
        ok: true,
      })

      void tokens
      return result
    } catch (err) {
      logOllamaCall({
        model,
        durationMs: Date.now() - startedAt,
        fallback: true,
        ok: false,
        feature,
        error: err instanceof Error ? err.message : String(err),
      })
      logAiProviderCall({
        feature,
        provider: this.id,
        model,
        latencyMs: Date.now() - startedAt,
        fallbackUsed: false,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  async generateStructured<T>(
    options: AiGenerateStructuredOptions<T>
  ): Promise<AiStructuredResult<T>> {
    const result = await this.generateText(options)
    const parse = options.parse ?? ((raw: string) => parseJsonFromText<T>(raw))
    const data = parse(result.text)
    return { ...result, data }
  }

  async streamText(options: AiStreamTextOptions): Promise<AiStreamResult> {
    const result = await this.generateText({ ...options, feature: options.feature })
    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(result.text))
        controller.close()
      },
    })
    return { ...result, stream: readable }
  }
}

export const ollamaTextProvider = new OllamaTextProvider()
