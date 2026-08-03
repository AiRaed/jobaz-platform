/**
 * Populate Law, Legal & Justice roles.
 *   npx tsx scripts/populate-career-library-law-legal-justice-roles.ts
 */

import { LAW_PACKS } from './career-library-law/packs'
import { runLawPopulate } from './career-library-law/shared'

runLawPopulate(LAW_PACKS, 'Law, Legal & Justice roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
