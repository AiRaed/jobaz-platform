import type { FeedPostType } from './dbTypes'

/** Improve Pulse post text — Ollama-ready via API */
export async function improvePulsePost(text: string, postType?: FeedPostType): Promise<string | null> {
  if (!text.trim()) return text
  try {
    const res = await fetch('/api/ai/improve-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context: 'pulse_post',
        postType: postType ?? 'discussion',
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as { improved?: string; text?: string }
      return data.improved ?? data.text ?? null
    }
  } catch {
    /* unavailable */
  }
  return null
}
