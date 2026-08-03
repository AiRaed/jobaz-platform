/**
 * Populate Humanities & Social Sciences roles.
 *   npx tsx scripts/populate-career-library-humanities-social-sciences-roles.ts
 */

import { HSS_PACKS } from './career-library-humanities/packs'
import { runHssPopulate } from './career-library-humanities/shared'

runHssPopulate(HSS_PACKS, 'Humanities & Social Sciences roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
