/**
 * OpenAI text provider implementation.
 */

import OpenAI from 'openai'
import {
  buildGenerateResult,
  DEFAULT_AI_TIMEOUT_MS,
  logAiProviderCall,
  parseJsonFromText,
  withTimeout,
} from './base'
import type {
  AiGenerateResult,
  AiGenerateStructuredOptions,
  AiGenerateTextOptions,
  AiModelTier,
  AiStreamResult,
  AiStreamTextOptions,
  AiStructuredResult,
  AiTextProvider,
} from './types'

export class OpenAiTextProvider implements AiTextProvider {
  readonly id = 'openai' as const

  private client: OpenAI | null = null

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
      })
    }
    return this.client
  }

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY?.trim())
  }

  async isAvailable(): Promise<boolean> {
    return this.isConfigured()
  }

  resolveModel(tier: AiModelTier = 'fast', override?: string): string {
    if (override?.trim()) return override.trim()
    if (tier === 'quality') {
      return process.env.OPENAI_MODEL_QUALITY || 'gpt-4o'
    }
    // fast, default, local (openai fallback), fallback
    return process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }

  async generateText(options: AiGenerateTextOptions): Promise<AiGenerateResult> {
    const startedAt = Date.now()
    const model = this.resolveModel(options.modelTier, options.model)
    const timeoutMs = options.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS
    const feature = options.feature

    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured (missing OPENAI_API_KEY)')
    }

    try {
      const completion = await withTimeout(
        this.getClient().chat.completions.create({
          model,
          messages: options.messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          ...(options.responseFormat === 'json_object'
            ? { response_format: { type: 'json_object' as const } }
            : {}),
        }),
        timeoutMs,
        'OpenAI generateText'
      )

      const text = completion.choices[0]?.message?.content?.trim() ?? ''
      const result = buildGenerateResult({ text, provider: this.id, model, startedAt })

      logAiProviderCall({
        feature,
        provider: this.id,
        model,
        latencyMs: result.latencyMs,
        fallbackUsed: false,
        ok: true,
      })

      return result
    } catch (err) {
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
    const startedAt = Date.now()
    const model = this.resolveModel(options.modelTier, options.model)
    const timeoutMs = options.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS
    const feature = options.feature

    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured (missing OPENAI_API_KEY)')
    }

    const stream = await withTimeout(
      this.getClient().chat.completions.create({
        model,
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
      }),
      timeoutMs,
      'OpenAI streamText'
    )

  const encoder = new TextEncoder()
  let fullText = ''

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          if (!delta) continue
          fullText += delta
          options.onChunk?.(delta)
          controller.enqueue(encoder.encode(delta))
        }
        controller.close()

        logAiProviderCall({
          feature,
          provider: 'openai',
          model,
          latencyMs: Date.now() - startedAt,
          fallbackUsed: false,
          ok: true,
        })
      } catch (err) {
        logAiProviderCall({
          feature,
          provider: 'openai',
          model,
          latencyMs: Date.now() - startedAt,
          fallbackUsed: false,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        })
        controller.error(err)
      }
    },
  })

    return {
      text: fullText,
      provider: this.id,
      model,
      latencyMs: Date.now() - startedAt,
      fallbackUsed: false,
      stream: readable,
    }
  }
}

export const openAiTextProvider = new OpenAiTextProvider()

/** OpenAI Whisper transcription — local Ollama does not support this yet. */
export async function transcribeAudioWithOpenAi(
  file: File,
  options?: { model?: string; feature?: string }
): Promise<string> {
  const startedAt = Date.now()
  const model = options?.model ?? 'whisper-1'
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('OpenAI API key required for audio transcription')
  }

  const response = await client.audio.transcriptions.create({
    file,
    model,
  })

  logAiProviderCall({
    feature: options?.feature ?? 'transcribe',
    provider: 'openai',
    model,
    latencyMs: Date.now() - startedAt,
    fallbackUsed: false,
    ok: true,
  })

  return response.text
}
