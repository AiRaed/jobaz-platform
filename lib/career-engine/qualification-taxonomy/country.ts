/** Lightweight UK country hint (shared; avoids circular imports with WIE normalise). */

const UK_KEYS = new Set([
  'uk',
  'gb',
  'united kingdom',
  'great britain',
  'britain',
  'england',
  'scotland',
  'wales',
  'northern ireland',
])

export function isUkCountryHint(value: string | null | undefined): boolean {
  if (!value) return false
  return UK_KEYS.has(value.trim().toLowerCase())
}
