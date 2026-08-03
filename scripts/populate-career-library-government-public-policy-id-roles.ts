/**
 * Populate Government, Public Policy & International Development roles.
 *   npx tsx scripts/populate-career-library-government-public-policy-id-roles.ts
 */

import { GOV_PACKS } from './career-library-government/packs'
import { runGovPopulate } from './career-library-government/shared'

runGovPopulate(
  GOV_PACKS,
  'Government, Public Policy & International Development roles populate'
).catch((e) => {
  console.error(e)
  process.exit(1)
})
