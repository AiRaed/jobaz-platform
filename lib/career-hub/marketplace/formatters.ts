/**
 * Marketplace display formatters — human-readable labels for course fields.
 */

export function formatProviderName(name: string | null | undefined): string {
  const v = name?.trim()
  return v || 'No provider listed'
}

export function formatPrice(price: string | null | undefined): string {
  const v = price?.trim()
  if (!v) return 'Contact provider for pricing'
  if (/^price:/i.test(v)) return v
  if (/^£/.test(v)) return v
  if (/^\d/.test(v)) return `£${v}`
  if (/free|funded|grant/i.test(v)) return v
  return v
}

export function formatPriceLabel(price: string | null | undefined): string {
  const formatted = formatPrice(price)
  if (formatted.startsWith('£') || formatted.startsWith('Contact')) return formatted
  return formatted
}

export function formatDuration(duration: string | null | undefined): string {
  const v = duration?.trim()
  if (!v) return 'Duration on request'
  if (/^duration:/i.test(v)) return v
  if (/day|week|month|hour|year|session/i.test(v)) return v
  if (/^\d+$/.test(v)) return `${v} days`
  return v
}

export function formatDurationLabel(duration: string | null | undefined): string {
  const formatted = formatDuration(duration)
  if (/^duration:/i.test(formatted)) return formatted
  return `Duration: ${formatted}`
}

export function formatLevel(level: string | null | undefined): string {
  const v = level?.trim()
  if (!v) return 'All levels'
  if (/^level:/i.test(v)) return v
  return v
}

export function formatLevelLabel(level: string | null | undefined): string {
  const formatted = formatLevel(level)
  if (/^level:/i.test(formatted)) return formatted
  return `Level: ${formatted}`
}

export function formatFundingType(funding: string | null | undefined, price?: string): string {
  const v = funding?.trim()
  if (v) return v
  const p = price?.trim()
  if (p && /fund|grant|employer|free/i.test(p)) return p
  return 'Funding details on request'
}

export function formatFundingLabel(funding: string | null | undefined, price?: string): string {
  const formatted = formatFundingType(funding, price)
  return formatted
}

export function formatLocation(location: string | null | undefined): string {
  const v = location?.trim()
  return v || 'Location on request'
}

export function formatDeliveryModesLabel(modes: string[] | null | undefined): string {
  const labels = (modes ?? [])
    .map((mode) => formatDeliveryMode(mode))
    .filter((label) => label && label !== 'Delivery mode on request')
  if (!labels.length) return 'Delivery not specified'
  return labels.join(' · ')
}

export function formatDeliveryMode(mode: string | null | undefined): string {
  const v = (mode ?? '').trim().toLowerCase()
  if (v === 'online') return 'Online'
  if (v === 'in_person' || v === 'in-person') return 'In-person'
  if (v === 'hybrid') return 'Hybrid'
  if (v === 'virtual') return 'Virtual'
  if (v === 'classroom') return 'Classroom'
  if (v === 'exam_in_person' || v === 'exam-in-person') return 'In-person exam'
  if (!v) return 'Delivery mode on request'
  return mode!.replace(/_/g, ' ')
}

export function formatDeliveryModeLabel(mode: string | null | undefined): string {
  return formatDeliveryMode(mode)
}
