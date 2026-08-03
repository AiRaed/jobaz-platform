/**
 * Validate LSCT packs for duplicate titles and Work in My Education balance.
 *   npx tsx scripts/career-library-logistics/validate-packs.ts
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { LSCT_PACKS, LSCT_SPEC_DEFS } from './packs'

const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of LSCT_PACKS) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

const allRoles = LSCT_PACKS.flatMap((p) => p.roles)
const lowBarrier = allRoles.filter((r) => r.meta?.lowBarrierOperational)
const primary = allRoles.filter((r) => r.meta?.workInMyEducationPriority === 'primary')
const driverLike = allRoles.filter((r) =>
  /\b(truck driver|hgv driver|forklift|warehouse operative|courier|delivery driver|taxi driver|bus driver|train driver)\b/i.test(
    r.name
  )
)

console.log('Packs', LSCT_PACKS.length)
console.log('Defs', LSCT_SPEC_DEFS.length)
console.log('Roles', allRoles.length)
console.log('Unique', seen.size)
console.log('Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 60)) console.log(' ', d)

const packSlugs = new Set(LSCT_PACKS.map((p) => p.slug))
const missing: string[] = []
for (const n of LSCT_SPEC_DEFS.map((d) => d.label)) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(`${n} => ${slug}`)
}
console.log('Missing packs:', missing.length ? missing.join('; ') : 'none')
console.log('Low-barrier operational:', lowBarrier.length)
console.log('Work in My Education primary:', primary.length)
console.log('Driver/operative titles:', driverLike.length)
if (driverLike.length) for (const r of driverLike) console.log(' ', r.name)

const byDomain: Record<string, number> = {}
for (const p of LSCT_PACKS) {
  byDomain[p.domainTag] = (byDomain[p.domainTag] ?? 0) + p.roles.length
}
console.log('Roles by domain:', byDomain)
