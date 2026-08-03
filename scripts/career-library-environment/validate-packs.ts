/**
 * Validate EAF packs for duplicate titles and coverage.
 *   npx tsx scripts/career-library-environment/validate-packs.ts
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { EAF_PACKS, EAF_SPEC_DEFS } from './packs'

const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of EAF_PACKS) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

console.log('Packs', EAF_PACKS.length)
console.log('Defs', EAF_SPEC_DEFS.length)
console.log('Roles', EAF_PACKS.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique', seen.size)
console.log('Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 50)) console.log(' ', d)

const packSlugs = new Set(EAF_PACKS.map((p) => p.slug))
const missing: string[] = []
for (const n of EAF_SPEC_DEFS.map((d) => d.label)) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(`${n} => ${slug}`)
}
console.log('Missing packs:', missing.length ? missing.join('; ') : 'none')
