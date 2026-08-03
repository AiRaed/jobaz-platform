/**
 * Validate HSS packs for duplicate titles and coverage.
 *   npx tsx scripts/career-library-humanities/validate-packs.ts
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { HSS_PACKS, HSS_SPEC_DEFS } from './packs'

const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of HSS_PACKS) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

const entryReg = HSS_PACKS.flatMap((p) =>
  p.roles.filter(
    (r) =>
      (r.stageKey === 'foundation_social_support' ||
        r.stageKey === 'graduate_social_sciences_entry') &&
      r.professionalRegistrationRequirement !== 'none'
  )
)

console.log('Packs', HSS_PACKS.length)
console.log('Defs', HSS_SPEC_DEFS.length)
console.log('Roles', HSS_PACKS.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique', seen.size)
console.log('Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 40)) console.log(' ', d)
console.log('Entry roles requiring registration (should be 0):', entryReg.length)

const packSlugs = new Set(HSS_PACKS.map((p) => p.slug))
const missing: string[] = []
for (const n of HSS_SPEC_DEFS.map((d) => d.label)) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(`${n} => ${slug}`)
}
console.log('Missing packs:', missing.length ? missing.join('; ') : 'none')
