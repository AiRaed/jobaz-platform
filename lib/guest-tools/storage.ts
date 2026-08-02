import {
  GUEST_BANNER_DISMISS_PREFIX,
  GUEST_DRAFT_KEYS,
  GUEST_USAGE_KEYS,
  type GuestToolId,
} from './constants'

export function readGuestDraft<T>(tool: GuestToolId): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GUEST_DRAFT_KEYS[tool])
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeGuestDraft(tool: GuestToolId, data: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GUEST_DRAFT_KEYS[tool], JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

export function hasGuestDraft(tool: GuestToolId): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem(GUEST_DRAFT_KEYS[tool]))
}

export function clearGuestDraft(tool: GuestToolId): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_DRAFT_KEYS[tool])
}

export function isGuestBannerDismissed(tool: GuestToolId): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`${GUEST_BANNER_DISMISS_PREFIX}${tool}`) === '1'
}

export function dismissGuestBanner(tool: GuestToolId): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${GUEST_BANNER_DISMISS_PREFIX}${tool}`, '1')
}

type GuestUsage = {
  generations?: number
  analyses?: number
  questionsAnswered?: number
}

export function readGuestUsage(tool: GuestToolId): GuestUsage {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(GUEST_USAGE_KEYS[tool])
    if (!raw) return {}
    return JSON.parse(raw) as GuestUsage
  } catch {
    return {}
  }
}

export function writeGuestUsage(tool: GuestToolId, usage: GuestUsage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GUEST_USAGE_KEYS[tool], JSON.stringify(usage))
  } catch {
    // ignore
  }
}

export function incrementGuestUsage(
  tool: GuestToolId,
  field: keyof GuestUsage,
  by = 1
): GuestUsage {
  const current = readGuestUsage(tool)
  const next = { ...current, [field]: (current[field] ?? 0) + by }
  writeGuestUsage(tool, next)
  return next
}
