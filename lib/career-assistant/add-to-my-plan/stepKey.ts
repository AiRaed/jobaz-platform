/** Stable public-safe step keys for plan dedupe. */

export function slugStepPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function buildCaStepKey(goalPath: string, kind: string, title: string): string {
  return `ca:${slugStepPart(goalPath)}:${slugStepPart(kind)}:${slugStepPart(title)}`
}
