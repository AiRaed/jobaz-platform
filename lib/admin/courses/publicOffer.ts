/** User-facing partner offer shown on public course cards (not commission data). */
export type CoursePublicOffer = {
  enabled: boolean
  label: string
  description: string
  code: string
  terms: string
  expiresAt: string | null
}

export type ResolvedPublicOffer = CoursePublicOffer & {
  visible: boolean
  cardHint: string
  badgeDisplay: OfferBadgeDisplay | null
}

export const JOBAZ_OFFER_BRAND = 'JobAZ Discount'

export type OfferBadgeDisplay = {
  /** Formatted primary offer text, e.g. "20% OFF" */
  mainLine: string
  /** Secondary branding line */
  brandLine: string
  /** Single-line mobile fallback, e.g. "20% OFF • JobAZ" */
  compactLine: string
  title: string
}

export type PublicOfferInput = {
  publicOfferEnabled?: boolean
  publicOfferLabel?: string
  publicOfferDescription?: string
  publicOfferCode?: string
  publicOfferTerms?: string
  publicOfferExpiresAt?: string | null
}

function trimText(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function normalizeDateInput(value: string | null | undefined): string | null {
  const raw = trimText(value)
  if (!raw) return null
  return raw.slice(0, 10)
}

export function emptyPublicOfferInput(): PublicOfferInput {
  return {
    publicOfferEnabled: false,
    publicOfferLabel: '',
    publicOfferDescription: '',
    publicOfferCode: '',
    publicOfferTerms: '',
    publicOfferExpiresAt: '',
  }
}

export const DEFAULT_CARD_OFFER_HINT = 'Partner offer via JobAZ'

const CARD_HINT_MAX_LENGTH = 52

/** Descriptions that are too short or fragmentary for a card — use default hint instead. */
function isClearOfferDescription(text: string): boolean {
  if (text.length < 14) return false

  const lower = text.toLowerCase()

  if (/partner|offer|jobaz|discount|save|booking|apply|through|access/i.test(lower)) {
    return true
  }

  if (/^(register|get|now|click|book|save)\b/i.test(lower) && text.length < 28) {
    return false
  }

  if (!text.includes(' ') && text.length < 24) {
    return false
  }

  return text.includes(' ') && text.length >= 20
}

function truncateCardHint(text: string, max = CARD_HINT_MAX_LENGTH): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

export function buildCardOfferHint(description: string | null | undefined): string {
  const trimmed = trimText(description)
  if (!trimmed || !isClearOfferDescription(trimmed)) {
    return DEFAULT_CARD_OFFER_HINT
  }
  return truncateCardHint(trimmed)
}

/**
 * Format offer label for public badge display.
 * Pure numbers like "20" become "20% OFF".
 * Labels that already include "%" or "off" are kept as entered.
 */
export function formatOfferBadgeLabel(rawLabel: string | null | undefined): string {
  const label = trimText(rawLabel)
  if (!label) return ''

  const lower = label.toLowerCase()

  if (/^\d+(\.\d+)?$/.test(label)) {
    return `${label}% OFF`
  }

  if (/%/.test(label) || /\boff\b/.test(lower)) {
    return label
  }

  return label
}

export function buildOfferBadgeDisplay(rawLabel: string | null | undefined): OfferBadgeDisplay | null {
  const mainLine = formatOfferBadgeLabel(rawLabel)
  if (!mainLine) return null

  return {
    mainLine,
    brandLine: JOBAZ_OFFER_BRAND,
    compactLine: `${mainLine} • JobAZ`,
    title: `${mainLine} — ${JOBAZ_OFFER_BRAND}`,
  }
}

export function isOfferExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const expiry = new Date(`${expiresAt}T23:59:59`)
  if (Number.isNaN(expiry.getTime())) return false
  return expiry.getTime() < Date.now()
}

export function resolvePublicOffer(input: PublicOfferInput): ResolvedPublicOffer {
  const enabled = Boolean(input.publicOfferEnabled)
  const label = trimText(input.publicOfferLabel)
  const description = trimText(input.publicOfferDescription)
  const code = trimText(input.publicOfferCode)
  const terms = trimText(input.publicOfferTerms)
  const expiresAt = normalizeDateInput(input.publicOfferExpiresAt)
  const visible = enabled && Boolean(label) && !isOfferExpired(expiresAt)
  const cardHint = buildCardOfferHint(description)
  const badgeDisplay = visible ? buildOfferBadgeDisplay(label) : null

  return {
    enabled,
    label,
    description,
    code,
    terms,
    expiresAt,
    visible,
    cardHint,
    badgeDisplay,
  }
}

export function formatOfferExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const date = new Date(`${expiresAt}T12:00:00`)
  if (Number.isNaN(date.getTime())) return expiresAt
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function mapPublicOfferRow(row: {
  public_offer_enabled?: boolean | null
  public_offer_label?: string | null
  public_offer_description?: string | null
  public_offer_code?: string | null
  public_offer_terms?: string | null
  public_offer_expires_at?: string | null
}): Pick<
  PublicOfferInput,
  | 'publicOfferEnabled'
  | 'publicOfferLabel'
  | 'publicOfferDescription'
  | 'publicOfferCode'
  | 'publicOfferTerms'
  | 'publicOfferExpiresAt'
> {
  return {
    publicOfferEnabled: Boolean(row.public_offer_enabled),
    publicOfferLabel: row.public_offer_label ?? '',
    publicOfferDescription: row.public_offer_description ?? '',
    publicOfferCode: row.public_offer_code ?? '',
    publicOfferTerms: row.public_offer_terms ?? '',
    publicOfferExpiresAt: row.public_offer_expires_at ?? '',
  }
}

export function mapPublicOfferToRow(input: PublicOfferInput): {
  public_offer_enabled: boolean
  public_offer_label: string | null
  public_offer_description: string | null
  public_offer_code: string | null
  public_offer_terms: string | null
  public_offer_expires_at: string | null
} {
  return {
    public_offer_enabled: Boolean(input.publicOfferEnabled),
    public_offer_label: trimText(input.publicOfferLabel) || null,
    public_offer_description: trimText(input.publicOfferDescription) || null,
    public_offer_code: trimText(input.publicOfferCode) || null,
    public_offer_terms: trimText(input.publicOfferTerms) || null,
    public_offer_expires_at: normalizeDateInput(input.publicOfferExpiresAt),
  }
}
