/** Helpers for persisting specialism disabled stage keys (column or description marker). */

export const DISABLED_STAGE_MARKER_RE = /\[\[disabled_stage_keys:([a-z0-9_,]+)\]\]/i

export function stripDisabledStageMarker(description: string): string {
  return description.replace(DISABLED_STAGE_MARKER_RE, '').replace(/\n{3,}/g, '\n\n').trim()
}

export function withDisabledStageMarker(description: string, keys: string[]): string {
  const cleaned = stripDisabledStageMarker(description)
  if (!keys.length) return cleaned
  return `${cleaned}\n\n[[disabled_stage_keys:${keys.join(',')}]]`
}

export function isMissingDisabledStageKeysColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42703' ||
    Boolean(error.message?.includes('disabled_stage_keys')) ||
    Boolean(error.message?.includes('column') && error.message?.includes('disabled_stage_keys'))
  )
}
