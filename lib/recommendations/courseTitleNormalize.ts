/**
 * Shared course-title normalisation + aliases for Career Coach resolution.
 * Used by every path — not per-route hardcoded matching.
 */

const NOISE_WORDS =
  /\b(course|courses|training|licence|license|certificate|certification|foundation|operator|qualifi)\b/gi

/** Groups of titles that should resolve to the same canonical course. */
export const COURSE_TITLE_ALIAS_GROUPS: string[][] = [
  ['SIA Door Supervisor Course', 'SIA Door Supervisor', 'Door Supervisor'],
  ['SIA Security Guard Course', 'SIA Security Guard', 'Security Guard'],
  ['SIA CCTV Operator Course', 'SIA CCTV Operator', 'SIA CCTV', 'CCTV Licence', 'CCTV Operator', 'CCTV'],
  ['SIA Close Protection Training', 'SIA Close Protection', 'Close Protection'],
  ['APM Project Management', 'APM', 'APM Project Management Foundation'],
  ['PRINCE2 Foundation', 'PRINCE2'],
  ['18th Edition Wiring Regulations', '18th Edition', '18th Edition Wiring'],
  ['ECS Card', 'ECS', 'ECS Gold Card'],
  ['AutoCAD', 'Auto CAD'],
  ['CSCS Card', 'CSCS'],
  ['Food Hygiene Certificate Level 2', 'Food Hygiene', 'Food Safety Level 2', 'Food Safety'],
  ['First Aid at Work', 'First Aid', 'Emergency First Aid at Work'],
  ['Care Certificate', 'The Care Certificate'],
  [
    'Level 2 Diploma in Care',
    'Level 2 Care',
    'Qualifi Level 2 Diploma in Care',
    'Qualifi Level 2 Care',
  ],
  ['Forklift Counterbalance', 'Forklift', 'Counterbalance Forklift'],
  ['IOSH Managing Safely', 'IOSH'],
  ['NEBOSH General Certificate', 'NEBOSH'],
]

export function normalizeCourseTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(NOISE_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Soft key used for fuzzy containment checks (noise words stripped). */
export function softCourseTitleKey(title: string): string {
  return normalizeCourseTitle(title)
}

function buildAliasLookup(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const group of COURSE_TITLE_ALIAS_GROUPS) {
    const keys = group.map(softCourseTitleKey).filter(Boolean)
    const shared = new Set(keys)
    for (const key of keys) {
      const existing = map.get(key) ?? new Set<string>()
      for (const s of shared) existing.add(s)
      map.set(key, existing)
    }
  }
  return map
}

const ALIAS_LOOKUP = buildAliasLookup()

export function aliasKeysForTitle(title: string): Set<string> {
  const key = softCourseTitleKey(title)
  if (!key) return new Set()
  const fromAlias = ALIAS_LOOKUP.get(key)
  if (fromAlias) return new Set(fromAlias)
  return new Set([key])
}

/** True when two titles belong to the same alias group or soft-match each other. */
export function courseTitlesMatch(a: string, b: string): boolean {
  const keyA = softCourseTitleKey(a)
  const keyB = softCourseTitleKey(b)
  if (!keyA || !keyB) return false
  if (keyA === keyB) return true

  const aliasesA = aliasKeysForTitle(a)
  if (aliasesA.has(keyB)) return true
  const aliasesB = aliasKeysForTitle(b)
  if (aliasesB.has(keyA)) return true

  // Containment soft match for longer official names vs short recommendations
  if (keyA.length >= 6 && keyB.length >= 6) {
    if (keyA.includes(keyB) || keyB.includes(keyA)) {
      const shorter = keyA.length < keyB.length ? keyA : keyB
      const longer = keyA.length < keyB.length ? keyB : keyA
      const shortTokens = shorter.split(' ').filter(Boolean)
      const longTokens = longer.split(' ').filter(Boolean)
      // Require the shorter phrase to be a contiguous token run in the longer title
      const shortJoined = shortTokens.join(' ')
      if (longer.includes(shortJoined) && shortTokens.length >= 2) return true
      // Single-token containment only when that token is long enough (e.g. "autocad")
      if (shortTokens.length === 1 && shortTokens[0]!.length >= 6 && longTokens.includes(shortTokens[0]!)) {
        return true
      }
    }
  }

  return false
}
