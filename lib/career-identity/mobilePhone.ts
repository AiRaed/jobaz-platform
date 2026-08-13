/**
 * Light mobile phone validation for Career Identity.
 * Empty is allowed. No SMS sending — storage/consent only.
 */

export type MobilePhoneValidation =
  | { ok: true; value: string | null }
  | { ok: false; error: string }

/** Allowed: +, digits, spaces, brackets, hyphens. At least 7 digits when non-empty. */
export function normalizeMobilePhone(raw: unknown): MobilePhoneValidation {
  if (raw == null) return { ok: true, value: null }
  const trimmed = String(raw).trim()
  if (!trimmed) return { ok: true, value: null }

  if (!/^[+0-9()\s\-]+$/.test(trimmed)) {
    return {
      ok: false,
      error: 'Mobile number can only include digits, spaces, +, brackets, or hyphens',
    }
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 7) {
    return {
      ok: false,
      error: 'Enter a valid mobile number (at least 7 digits), or leave it blank',
    }
  }

  if (digits.length > 15) {
    return {
      ok: false,
      error: 'Mobile number looks too long — please check and try again',
    }
  }

  return { ok: true, value: trimmed.slice(0, 40) }
}

export function normalizeMobileCountryCode(raw: unknown): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim().slice(0, 8)
  if (!trimmed) return null
  if (!/^\+?[0-9]{1,4}$/.test(trimmed)) return null
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}
