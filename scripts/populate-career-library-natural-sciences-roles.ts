/**
 * Populate Natural Sciences & Research roles (idempotent skip on duplicates).
 *   npx tsx scripts/populate-career-library-natural-sciences-roles.ts
 */

import { LIFE_PACKS } from './career-library-natural-sciences/packs-life'
import { CHEM_PHYS_PACKS } from './career-library-natural-sciences/packs-chem-phys'
import { MATH_EARTH_PACKS } from './career-library-natural-sciences/packs-math-earth'
import { RESEARCH_OPS_PACKS } from './career-library-natural-sciences/packs-research-ops'
import { runNaturalSciencesPopulate } from './career-library-natural-sciences/shared'

const ALL = [...LIFE_PACKS, ...CHEM_PHYS_PACKS, ...MATH_EARTH_PACKS, ...RESEARCH_OPS_PACKS]

runNaturalSciencesPopulate(ALL, 'Natural Sciences & Research roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
