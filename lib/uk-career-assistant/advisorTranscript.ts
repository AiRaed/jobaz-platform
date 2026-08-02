/**
 * Append JAZ advisor messages to chat transcript without duplicates.
 */

export type TranscriptMessage = { role: 'user' | 'assistant'; content: string }

const SKIP_PATTERNS = [
  /^next:\s/i,
  /^here are your recommendations/i,
]

export function shouldShowAdvisorMessage(content: string | undefined | null): boolean {
  if (!content?.trim()) return false
  const t = content.trim()
  if (t.length < 18) return false
  return !SKIP_PATTERNS.some((p) => p.test(t))
}

export function appendAdvisorTranscriptMessage(
  prev: TranscriptMessage[],
  content: string | undefined | null
): TranscriptMessage[] {
  if (!shouldShowAdvisorMessage(content)) return prev
  const msg = content!.trim()
  const last = prev[prev.length - 1]
  if (last?.role === 'assistant' && last.content === msg) return prev
  if (prev.some((m) => m.role === 'assistant' && m.content === msg)) return prev
  return [...prev, { role: 'assistant', content: msg }]
}
