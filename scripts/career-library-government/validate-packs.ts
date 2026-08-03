/**
 * Validate GOV packs for duplicate titles and coverage.
 *   npx tsx scripts/career-library-government/validate-packs.ts
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { GOV_PACKS, GOV_SPEC_DEFS } from './packs'

const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of GOV_PACKS) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

console.log('Packs', GOV_PACKS.length)
console.log('Defs', GOV_SPEC_DEFS.length)
console.log('Roles', GOV_PACKS.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique', seen.size)
console.log('Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 80)) console.log(' ', d)

const packSlugs = new Set(GOV_PACKS.map((p) => p.slug))
const missing: string[] = []
for (const n of GOV_SPEC_DEFS.map((d) => d.label)) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(`${n} => ${slug}`)
}
console.log('Missing packs:', missing.length ? missing.join('; ') : 'none')

const byDomain: Record<string, number> = {}
for (const p of GOV_PACKS) {
  byDomain[p.domainTag] = (byDomain[p.domainTag] ?? 0) + p.roles.length
}
console.log('Roles by domain:', byDomain)

const elected = GOV_PACKS.flatMap((p) => p.roles).filter((r) =>
  /\b(mp|councillor|mayor|elected)\b/i.test(r.name)
)
console.log('Elected-looking titles:', elected.length ? elected.map((r) => r.name) : 'none')
