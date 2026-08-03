/**
 * Validate Arts packs for duplicate titles and coverage.
 *   npx tsx scripts/career-library-arts/validate-packs.ts
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { ARTS_PACKS, ARTS_SPEC_DEFS } from './packs'

const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of ARTS_PACKS) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

console.log('Packs', ARTS_PACKS.length)
console.log('Defs', ARTS_SPEC_DEFS.length)
console.log('Roles', ARTS_PACKS.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique', seen.size)
console.log('Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 60)) console.log(' ', d)

const packSlugs = new Set(ARTS_PACKS.map((p) => p.slug))
const missing: string[] = []
for (const n of ARTS_SPEC_DEFS.map((d) => d.label)) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(`${n} => ${slug}`)
}
console.log('Missing packs:', missing.length ? missing.join('; ') : 'none')
console.log(
  'Empty packs:',
  ARTS_PACKS.filter((p) => p.roles.length === 0)
    .map((e) => e.slug)
    .join(', ') || 'none'
)
