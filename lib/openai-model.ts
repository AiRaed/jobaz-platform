/**
 * Shared OpenAI chat model configuration and error helpers.
 * Set OPENAI_MODEL in the environment to override the default.
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export const AI_MODEL_UNAVAILABLE_CODE = 'AI_MODEL_UNAVAILABLE'

export const AI_MODEL_UNAVAILABLE_MESSAGE =
  'AI service model needs updating. Please try again later.'

export function isOpenAIModelNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as {
    status?: number
    code?: string
    message?: string
    error?: { code?: string; message?: string }
  }

  if (err.status === 404) return true
  if (err.code === 'model_not_found') return true
  if (err.error?.code === 'model_not_found') return true

  const message = `${err.message ?? ''} ${err.error?.message ?? ''}`.toLowerCase()
  return (
    message.includes('model_not_found') ||
    message.includes('does not exist') ||
    message.includes('you do not have access')
  )
}

export function openAIErrorResponse(
  error: unknown,
  fallbackMessage: string
): { body: Record<string, unknown>; status: number } {
  if (isOpenAIModelNotFoundError(error)) {
    console.error('[OpenAI] Model not found or inaccessible:', error)
    return {
      body: {
        ok: false,
        error: AI_MODEL_UNAVAILABLE_MESSAGE,
        code: AI_MODEL_UNAVAILABLE_CODE,
      },
      status: 503,
    }
  }

  console.error('[OpenAI] Request failed:', error)
  const message =
    error instanceof Error ? error.message : fallbackMessage

  return {
    body: { ok: false, error: message || fallbackMessage },
    status: 500,
  }
}
