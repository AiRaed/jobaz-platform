import { CLINICAL_CORE_PACKS } from './packs-clinical-core'
import { AHP_PACKS } from './packs-ahp'
import { SCIENCE_MGMT_PACKS } from './packs-science-mgmt'
import { normalizeSlug } from '../../lib/admin/career-library/guards'

const packs = [...CLINICAL_CORE_PACKS, ...AHP_PACKS, ...SCIENCE_MGMT_PACKS]
const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of packs) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

const expected = [
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Dentistry',
  'Midwifery',
  'Physiotherapy',
  'Occupational Therapy',
  'Radiography',
  'Paramedic Science',
  'Biomedical Science',
  'Public Health',
  'Healthcare Science',
  'Speech and Language Therapy',
  'Dietetics',
  'Optometry',
  'Orthoptics',
  'Prosthetics & Orthotics',
  'Clinical Psychology',
  'Healthcare Management',
  'Clinical Research',
]

console.log('Packs:', packs.length)
console.log('Roles:', packs.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique titles:', seen.size)
console.log('Dupes:', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 30)) console.log(' ', d)

const packSlugs = new Set(packs.map((p) => p.slug))
for (const n of expected) {
  const slug = normalizeSlug(undefined, n)
  console.log(`${slug} | pack=${slug && packSlugs.has(slug) ? 'yes' : 'MISSING'}`)
}
