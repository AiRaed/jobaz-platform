/** @deprecated Import from @/lib/ai/moderation — kept for backward compatibility */
export {
  moderatePulseContent,
  moderatePulseContentSync,
  type PulseModerationResult,
  type PulseModerationContext,
} from '@/lib/ai/moderation'

import { moderatePulseContentSync } from '@/lib/ai/moderation'

export type ModerationResult = { ok: true } | { ok: false; reason: string }

export function moderateFeedContent(content: string): ModerationResult {
  const r = moderatePulseContentSync(content)
  if (r.approved) return { ok: true }
  return { ok: false, reason: r.reason ?? 'Content blocked.' }
}
