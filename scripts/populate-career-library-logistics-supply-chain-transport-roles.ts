/**
 * Populate Logistics, Supply Chain & Transport Management roles.
 *   npx tsx scripts/populate-career-library-logistics-supply-chain-transport-roles.ts
 */

import { LSCT_PACKS } from './career-library-logistics/packs'
import { runLsctPopulate } from './career-library-logistics/shared'

runLsctPopulate(
  LSCT_PACKS,
  'Logistics, Supply Chain & Transport Management roles populate'
).catch((e) => {
  console.error(e)
  process.exit(1)
})
