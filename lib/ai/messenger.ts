/**
 * JobAZ Work Messenger AI helpers — Ollama-ready abstraction with safe fallbacks
 */

export type MessengerAiContext = {
  conversationType?: string
  opportunityTitle?: string | null
}

export type MessengerAiResult = {
  ok: boolean
  text?: string
  reason?: string
}

const AI_INACTIVE = 'AI message help is not active yet.'

function ruleBasedImprove(text: string): MessengerAiResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, reason: 'Enter a message first.' }
  const improved = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  const withPeriod = /[.!?]$/.test(improved) ? improved : `${improved}.`
  return { ok: true, text: `Hi — ${withPeriod} I'd appreciate the chance to connect professionally on JobAZ.` }
}

function ruleBasedSafety(text: string): MessengerAiResult {
  const lower = text.toLowerCase()
  if (lower.includes('free money') || lower.includes('crypto giveaway')) {
    return { ok: false, reason: 'Message may look like spam. Please revise before sending.' }
  }
  return { ok: true }
}

export async function improveMessage(
  text: string,
  _context: MessengerAiContext = {}
): Promise<MessengerAiResult> {
  try {
    const res = await fetch('/api/ai/messenger/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context: _context }),
    })
    if (res.ok) {
      const data = (await res.json()) as { text?: string }
      if (data.text) return { ok: true, text: data.text }
    }
  } catch {
    /* fallback below */
  }
  const fallback = ruleBasedImprove(text)
  if (!fallback.ok) return fallback
  return { ok: false, reason: AI_INACTIVE, text: fallback.text }
}

export async function suggestReply(_conversationContext: string): Promise<MessengerAiResult> {
  return { ok: false, reason: AI_INACTIVE }
}

export async function summarizeConversation(_conversationId: string): Promise<MessengerAiResult> {
  return { ok: false, reason: AI_INACTIVE }
}

export async function safetyCheckMessage(text: string): Promise<MessengerAiResult> {
  try {
    const res = await fetch('/api/ai/messenger/safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      const data = (await res.json()) as { approved?: boolean; reason?: string }
      if (data.approved === false) return { ok: false, reason: data.reason ?? 'Message blocked by safety check.' }
      return { ok: true }
    }
  } catch {
    /* fallback */
  }
  return ruleBasedSafety(text)
}
