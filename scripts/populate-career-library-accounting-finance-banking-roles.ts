/**
 * Populate Accounting, Finance & Banking roles.
 *   npx tsx scripts/populate-career-library-accounting-finance-banking-roles.ts
 */

import { AFB_PACKS } from './career-library-accounting-finance/packs'
import { runAfbPopulate } from './career-library-accounting-finance/shared'

runAfbPopulate(AFB_PACKS, 'Accounting, Finance & Banking roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
