/**
 * Deduplicate course display titles so “SIA Door Supervisor” and
 * “SIA Door Supervisor Course” resolve as one visual item.
 */

import { normalizePlanTitle, titlesMatchLoose } from './myPlanDisplayFilter'

const COURSE_NOISE = /\b(course|training|licence|license|certificate)\b/gi

export function canonicalCourseDisplayKey(title: string): string {
  return normalizePlanTitle(title).replace(COURSE_NOISE, ' ').replace(/\s+/g, ' ').trim()
}

export function dedupeByCourseIdentity<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    const key = canonicalCourseDisplayKey(item.title)
    if (!key || seen.has(key)) continue
    // Also skip near-duplicates against existing keys
    let dup = false
    for (const existing of seen) {
      if (titlesMatchLoose(existing, key) || titlesMatchLoose(item.title, existing)) {
        dup = true
        break
      }
    }
    if (dup) continue
    seen.add(key)
    out.push(item)
  }
  return out
}
