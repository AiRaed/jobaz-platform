/**
 * Populate all Healthcare & Medicine Career Knowledge Library draft roles.
 *
 * Prerequisites:
 *   npx tsx scripts/seed-career-library-healthcare-medicine.ts
 *
 * Run:
 *   npx tsx scripts/populate-career-library-healthcare-medicine-roles.ts
 *
 * Does NOT modify Engineering or IT.
 */

import { CLINICAL_CORE_PACKS } from './career-library-healthcare/packs-clinical-core'
import { AHP_PACKS } from './career-library-healthcare/packs-ahp'
import { SCIENCE_MGMT_PACKS } from './career-library-healthcare/packs-science-mgmt'
import { runHealthcarePopulate } from './career-library-healthcare/shared'

const ALL_PACKS = [...CLINICAL_CORE_PACKS, ...AHP_PACKS, ...SCIENCE_MGMT_PACKS]

runHealthcarePopulate(ALL_PACKS, 'Healthcare & Medicine roles populate').catch((err) => {
  console.error(err)
  process.exit(1)
})
