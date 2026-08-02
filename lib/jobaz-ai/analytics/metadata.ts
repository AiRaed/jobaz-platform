/** Short human-readable summary for activity feed rows. */
export function summarizeEventMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata || typeof metadata !== 'object') return '—'

  const priorityKeys = [
    'current_step',
    'tool_name',
    'recommended_path',
    'destination',
    'question_id',
    'selected_answer',
    'source',
  ] as const

  const parts: string[] = []
  for (const key of priorityKeys) {
    const value = metadata[key]
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${key}: ${String(value)}`)
    }
  }

  if (parts.length > 0) return parts.join(' · ')

  const keys = Object.keys(metadata).filter((k) => k !== 'source')
  if (keys.length === 0) return '—'

  const raw = JSON.stringify(metadata)
  return raw.length > 100 ? `${raw.slice(0, 97)}...` : raw
}
