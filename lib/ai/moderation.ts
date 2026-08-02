/**
 * Pulse content moderation — Ollama-ready abstraction (rule-based fallback)
 */

export type ModerationVerdict = 'approved' | 'needs_review' | 'blocked'

export type PulseModerationResult = {
  approved: boolean
  verdict: ModerationVerdict
  reason?: string
  category?: string
}

export type PulseModerationContext = {
  kind?: 'post' | 'comment' | 'opportunity'
  postType?: string
}

const BANNED_PHRASES = [
  'spam',
  'scam link',
  'free money guaranteed',
  'click here now',
  'crypto giveaway',
]

const MAX_LENGTH = 2000
const MAX_LINKS = 8

function countLinks(text: string): number {
  const matches = text.match(/https?:\/\/|www\./gi)
  return matches?.length ?? 0
}

function ruleBasedModeration(text: string): PulseModerationResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { approved: false, verdict: 'blocked', reason: 'Content cannot be empty.', category: 'empty' }
  }
  if (trimmed.length > MAX_LENGTH) {
    return {
      approved: false,
      verdict: 'blocked',
      reason: `Content must be ${MAX_LENGTH} characters or less.`,
      category: 'length',
    }
  }
  if (countLinks(trimmed) > MAX_LINKS) {
    return {
      approved: false,
      verdict: 'blocked',
      reason: 'Too many links in one post.',
      category: 'links',
    }
  }

  const lower = trimmed.toLowerCase()
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        approved: false,
        verdict: 'blocked',
        reason: 'Content contains blocked phrases.',
        category: 'banned_phrase',
      }
    }
  }

  if (/(.)\1{12,}/.test(trimmed)) {
    return {
      approved: false,
      verdict: 'needs_review',
      reason: 'Content looks repetitive.',
      category: 'spam_pattern',
    }
  }

  return { approved: true, verdict: 'approved' }
}

/** Moderate Pulse post/comment/opportunity text — tries Ollama API when available */
export async function moderatePulseContent(
  text: string,
  context: PulseModerationContext = {}
): Promise<PulseModerationResult> {
  const fallback = ruleBasedModeration(text)
  if (!fallback.approved) return fallback

  try {
    const res = await fetch('/api/ai/pulse/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
    })
    if (res.ok) {
      const data = (await res.json()) as PulseModerationResult & { ok?: boolean }
      if (data.verdict) return data
    }
  } catch {
    /* rule fallback */
  }

  return fallback
}

/** Sync validation for server routes */
export function moderatePulseContentSync(text: string): PulseModerationResult {
  return ruleBasedModeration(text)
}
