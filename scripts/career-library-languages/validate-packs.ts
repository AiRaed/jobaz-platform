/**
 * Validate Languages packs for duplicate titles and coverage.
 *   npx tsx scripts/career-library-languages/validate-packs.ts
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { LANG_PACKS, LANG_SPEC_DEFS } from './packs'

const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of LANG_PACKS) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

console.log('Packs', LANG_PACKS.length)
console.log('Defs', LANG_SPEC_DEFS.length)
console.log('Roles', LANG_PACKS.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique', seen.size)
console.log('Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 60)) console.log(' ', d)

const packSlugs = new Set(LANG_PACKS.map((p) => p.slug))
const missing: string[] = []
for (const n of LANG_SPEC_DEFS.map((d) => d.label)) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(`${n} => ${slug}`)
}
console.log('Missing packs:', missing.length ? missing.join('; ') : 'none')
console.log(
  'Empty packs:',
  LANG_PACKS.filter((p) => p.roles.length === 0)
    .map((e) => e.slug)
    .join(', ') || 'none'
)
