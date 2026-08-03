/**
 * Populate Hospitality, Tourism & Events roles.
 *   npx tsx scripts/populate-career-library-hospitality-tourism-events-roles.ts
 */

import { HTE_PACKS } from './career-library-hospitality/packs'
import { runHtePopulate } from './career-library-hospitality/shared'

runHtePopulate(HTE_PACKS, 'Hospitality, Tourism & Events roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
