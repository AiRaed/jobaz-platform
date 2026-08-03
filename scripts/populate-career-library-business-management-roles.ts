/**
 * Populate Business & Management roles.
 *   npx tsx scripts/populate-career-library-business-management-roles.ts
 */

import { GENERAL_LEADERSHIP_PACKS } from './career-library-business/packs-general-leadership'
import { PROJECTS_CONSULTING_PACKS } from './career-library-business/packs-projects-consulting'
import { COMMERCIAL_OPS_PACKS } from './career-library-business/packs-commercial-ops'
import { GOVERNANCE_SPECIALIST_PACKS } from './career-library-business/packs-governance-specialist'
import { runBusinessPopulate } from './career-library-business/shared'

const ALL = [
  ...GENERAL_LEADERSHIP_PACKS,
  ...PROJECTS_CONSULTING_PACKS,
  ...COMMERCIAL_OPS_PACKS,
  ...GOVERNANCE_SPECIALIST_PACKS,
]

runBusinessPopulate(ALL, 'Business & Management roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
