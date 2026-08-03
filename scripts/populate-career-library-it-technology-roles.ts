/**
 * Populate all IT & Technology Career Knowledge Library draft roles.
 *
 * Prerequisites:
 *   npx tsx scripts/seed-career-library-it-technology.ts
 *
 * Run:
 *   npx tsx scripts/populate-career-library-it-technology-roles.ts
 *
 * Uses it_skill_experience. Does not modify Engineering data.
 * If roles were seeded under legacy experience_level, run:
 *   npx tsx scripts/remap-it-skill-experience-stages.ts
 */

import { SOFTWARE_PACKS } from './career-library-it/packs-software'
import { INFRA_PACKS } from './career-library-it/packs-infra'
import { DATA_PACKS } from './career-library-it/packs-data'
import { SPECIALIST_PACKS } from './career-library-it/packs-specialist'
import { runItPopulate } from './career-library-it/shared'

const ALL_PACKS = [...SOFTWARE_PACKS, ...INFRA_PACKS, ...DATA_PACKS, ...SPECIALIST_PACKS]

runItPopulate(ALL_PACKS, 'IT & Technology roles populate').catch((err) => {
  console.error(err)
  process.exit(1)
})
