import {
  AI_MODEL_UNAVAILABLE_CODE,
  AI_MODEL_UNAVAILABLE_MESSAGE,
} from '@/lib/openai-model'

type AiErrorPayload = {
  error?: string
  code?: string
}

/** User-facing message from an AI API JSON body. */
export function getAiApiErrorMessage(
  data: AiErrorPayload | null | undefined,
  fallback: string
): string {
  if (data?.code === AI_MODEL_UNAVAILABLE_CODE) {
    return AI_MODEL_UNAVAILABLE_MESSAGE
  }
  return data?.error || fallback
}

export function isAiModelUnavailableResponse(
  data: AiErrorPayload | null | undefined
): boolean {
  return data?.code === AI_MODEL_UNAVAILABLE_CODE
}

/** Throw when an AI API response indicates failure (includes model-unavailable). */
export function throwOnAiApiFailure(
  data: (AiErrorPayload & { ok?: boolean }) | null | undefined,
  fallback: string
): void {
  if (!data || data.ok === false || (data as { ok?: boolean }).ok === false) {
    const err = new Error(getAiApiErrorMessage(data, fallback)) as Error & {
      code?: string
    }
    err.code = data?.code
    throw err
  }
}

/** Returns true if the error was handled inline (model unavailable). */
export function handleAiClientError(
  error: unknown,
  setInlineError: (message: string) => void,
  fallbackAlert: (message: string) => void
): void {
  const err = error as Error & { code?: string }
  if (
    err?.code === AI_MODEL_UNAVAILABLE_CODE ||
    err?.message === AI_MODEL_UNAVAILABLE_MESSAGE
  ) {
    setInlineError(AI_MODEL_UNAVAILABLE_MESSAGE)
    return
  }
  fallbackAlert(err?.message || 'Something went wrong. Please try again.')
}
