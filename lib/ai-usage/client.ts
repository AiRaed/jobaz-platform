import { AI_LIMIT_ERROR, AI_LIMIT_MESSAGES } from './types'

export { AI_LIMIT_ERROR, AI_LIMIT_MESSAGES }

type LimitPayload = {
  error?: string
  message?: string
  reason?: string
  toolCategory?: string
}

/** Friendly copy for a 429 AI_LIMIT_REACHED payload. */
export function messageFromAiLimitPayload(
  data: unknown,
  status?: number
): string | null {
  if (!data || typeof data !== 'object') {
    if (status === 429) return AI_LIMIT_MESSAGES.guest
    return null
  }
  const payload = data as LimitPayload
  if (payload.error !== AI_LIMIT_ERROR && status !== 429) return null
  if (payload.message && payload.message.trim()) return payload.message.trim()
  if (payload.toolCategory === 'apply_assistant' || payload.reason === 'login_required') {
    return AI_LIMIT_MESSAGES.apply
  }
  if (payload.reason === 'daily_limit') return AI_LIMIT_MESSAGES.daily
  return AI_LIMIT_MESSAGES.guest
}

export function aiLimitErrorFromResponse(response: Response, data: unknown): Error | null {
  const message = messageFromAiLimitPayload(data, response.status)
  if (!message) return null
  return new Error(message)
}
