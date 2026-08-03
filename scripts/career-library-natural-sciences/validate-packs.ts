import { LIFE_PACKS } from './packs-life'
import { CHEM_PHYS_PACKS } from './packs-chem-phys'
import { MATH_EARTH_PACKS } from './packs-math-earth'
import { RESEARCH_OPS_PACKS } from './packs-research-ops'
import { normalizeSlug } from '../../lib/admin/career-library/guards'

const packs = [...LIFE_PACKS, ...CHEM_PHYS_PACKS, ...MATH_EARTH_PACKS, ...RESEARCH_OPS_PACKS]
const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of packs) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}
console.log('Packs', packs.length, 'Roles', packs.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique', seen.size, 'Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 40)) console.log(' ', d)

const expected = [
  'Biology','Biological Sciences','Molecular Biology','Cell Biology','Microbiology','Biochemistry','Biotechnology','Genetics and Genomics','Neuroscience','Zoology','Botany and Plant Science','Marine Biology','Ecology','Biomedical Science','Pharmacology','Toxicology','Immunology','Chemistry','Analytical Chemistry','Medicinal Chemistry','Materials Chemistry','Physics','Applied Physics','Astrophysics and Astronomy','Medical Physics','Nuclear Science','Materials Science','Nanoscience and Nanotechnology','Mathematics','Applied Mathematics','Statistics','Operational Research','Mathematical Modelling','Environmental Science','Earth Science','Geology','Geophysics','Geochemistry','Oceanography','Meteorology','Climate Science','Hydrology','Soil Science','Conservation Science','Laboratory Science','Scientific Research','Research Management','Science Policy','Science Communication','Scientific Publishing','Laboratory Management','Scientific Quality and Compliance',
]
const packSlugs = new Set(packs.map((p) => p.slug))
const missing: string[] = []
for (const n of expected) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(n)
}
console.log('Missing pack for specialism:', missing.length ? missing.join(', ') : 'none')
