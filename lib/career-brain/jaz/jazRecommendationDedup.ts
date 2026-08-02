/**
 * De-duplication for career recommendations — normalises titles before render.
 */

import type { CareerBrainRecommendation } from '../types'

/** Normalise role titles so "Teaching Assistant" and "Teacher Assistant" dedupe. */
export function normalizeRoleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\bteacher assistant\b/g, 'teaching assistant')
    .replace(/\bteaching assistant\b/g, 'teaching assistant')
    .replace(/\s+/g, ' ')
    .trim()
}

export function dedupeRoleTitles(titles: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of titles) {
    const title = raw.trim()
    if (!title) continue
    const key = normalizeRoleKey(title)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(title)
  }
  return out
}

export function dedupeRecommendations(recommendations: CareerBrainRecommendation[]): CareerBrainRecommendation[] {
  const seen = new Set<string>()
  const out: CareerBrainRecommendation[] = []
  for (const rec of recommendations) {
    const key = `${rec.track}:${normalizeRoleKey(rec.title)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(rec)
  }
  return out
}
