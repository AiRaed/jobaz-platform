export const DEFAULT_LOCATION_SUMMARY = 'Location varies'

/** Parse comma-separated or one-per-line location input into a clean unique list. */
export function parseAvailableLocationsInput(text: string | null | undefined): string[] {
  const parts = (text ?? '')
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const result: string[] = []
  for (const part of parts) {
    const key = part.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(part)
  }
  return result
}

export function normalizeAvailableLocations(values: string[] | null | undefined): string[] {
  if (!values?.length) return []
  return parseAvailableLocationsInput(values.join('\n'))
}

export function formatAvailableLocationsForInput(locations: string[] | null | undefined): string {
  return (locations ?? []).join('\n')
}

/**
 * Short label for cards and detail hero.
 * Fallback: location_summary → legacy location → default.
 */
export function resolveLocationSummary(
  locationSummary: string | null | undefined,
  legacyLocation: string | null | undefined
): string {
  const summary = (locationSummary ?? '').trim()
  if (summary) return summary

  const legacy = (legacyLocation ?? '').trim()
  if (legacy) return legacy

  return DEFAULT_LOCATION_SUMMARY
}
