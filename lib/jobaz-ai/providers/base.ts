/**
 * Shared provider utilities — timeout, JSON extraction, logging.
 */

import type { AiGenerateResult, AiProviderId, AiProviderLogEntry, FeatureModelTier } from './types'

export const DEFAULT_AI_TIMEOUT_MS = Number(process.env.AI_PROVIDER_TIMEOUT_MS ?? 60_000)

const OLLAMA_MODEL_ALIASES: Record<string, string> = {
  llama3: 'llama3',
  mistral: 'mistral',
  deepseek: 'deepseek-r1',
  'deepseek-r1': 'deepseek-r1',
  'deepseek-coder': 'deepseek-coder',
}

export function normalizeOllamaModel(model: string): string {
  const key = model.trim().toLowerCase()
  return OLLAMA_MODEL_ALIASES[key] ?? model.trim()
}

export function resolvePreferredProviderId(): AiProviderId {
  const raw = (process.env.AI_PROVIDER ?? '').trim().toLowerCase()
  if (raw === 'ollama') return 'ollama'
  if (raw === 'openai') return 'openai'
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai'
  return 'ollama'
}

export function isFallbackEnabled(): boolean {
  const raw = (process.env.AI_PROVIDER_FALLBACK ?? 'true').trim().toLowerCase()
  return raw !== 'false' && raw !== '0'
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export function extractJsonFromText(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) return objectMatch[0]

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrayMatch) return arrayMatch[0]

  return trimmed
}

export function parseJsonFromText<T>(raw: string): T {
  const jsonStr = extractJsonFromText(raw)
  return JSON.parse(jsonStr) as T
}

export function logAiRouterDecision(entry: {
  feature?: string
  tier: FeatureModelTier
  provider: string
  model: string
  fallback: boolean
}): void {
  console.info(
    '[AI Router]',
    [
      `feature=${entry.feature ?? 'unknown'}`,
      `tier=${entry.tier}`,
      `provider=${entry.provider}`,
      `model=${entry.model}`,
      `fallback=${entry.fallback}`,
    ].join(' | ')
  )
}

/** Unified post-call log — every routed AI request. */
export function logAiCallComplete(entry: {
  feature?: string
  tier?: FeatureModelTier
  provider: string
  model: string
  fallbackUsed: boolean
  latencyMs?: number
}): void {
  console.info(
    '[JobAZ AI]',
    [
      `feature=${entry.feature ?? 'unknown'}`,
      `tier=${entry.tier ?? 'unknown'}`,
      `provider=${entry.provider}`,
      `model=${entry.model}`,
      `fallbackUsed=${entry.fallbackUsed}`,
      entry.latencyMs != null ? `${entry.latencyMs}ms` : null,
    ]
      .filter(Boolean)
      .join(' | ')
  )
}

export function logAiProviderCall(entry: AiProviderLogEntry): void {
  const prefix = '[JobAZ AI Provider]'
  const parts = [
    `provider=${entry.provider}`,
    `model=${entry.model}`,
    `${entry.latencyMs}ms`,
    entry.feature ? `feature=${entry.feature}` : null,
    entry.fallbackUsed
      ? `fallback=true from=${entry.fallbackFrom ?? 'unknown'}`
      : 'fallback=false',
    entry.ok ? 'ok' : `error=${entry.error ?? 'unknown'}`,
  ].filter(Boolean)

  if (entry.ok) {
    console.info(prefix, parts.join(' | '))
  } else {
    console.warn(prefix, parts.join(' | '))
  }
}

export function buildGenerateResult(params: {
  text: string
  provider: AiProviderId
  model: string
  startedAt: number
  fallbackUsed?: boolean
  fallbackFrom?: AiProviderId
}): AiGenerateResult {
  return {
    text: params.text,
    provider: params.provider,
    model: params.model,
    latencyMs: Date.now() - params.startedAt,
    fallbackUsed: params.fallbackUsed ?? false,
    fallbackFrom: params.fallbackFrom,
  }
}
