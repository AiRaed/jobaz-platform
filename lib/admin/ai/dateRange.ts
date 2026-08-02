/** Admin AI date range helpers */

export type AdminAiDateRange = 'today' | '7d' | '30d' | 'all'

export const ADMIN_AI_DATE_RANGES: Array<{ id: AdminAiDateRange; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
]

export const DEFAULT_ADMIN_AI_DATE_RANGE: AdminAiDateRange = '7d'

/** Inclusive lower bound ISO string, or null for all-time. */
export function rangeStartIso(range: AdminAiDateRange, now = new Date()): string | null {
  if (range === 'all') return null
  const d = new Date(now)
  if (range === 'today') {
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  const days = range === '7d' ? 7 : 30
  d.setTime(d.getTime() - days * 24 * 60 * 60 * 1000)
  return d.toISOString()
}

export function parseAdminAiDateRange(value: string | null | undefined): AdminAiDateRange {
  if (value === 'today' || value === '7d' || value === '30d' || value === 'all') return value
  return DEFAULT_ADMIN_AI_DATE_RANGE
}

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development'
}
