/**
 * Populate Education & Teaching roles.
 *   npx tsx scripts/populate-career-library-education-teaching-roles.ts
 */

import { EDU_PACKS } from './career-library-education/packs'
import { runEduPopulate } from './career-library-education/shared'

runEduPopulate(EDU_PACKS, 'Education & Teaching roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
