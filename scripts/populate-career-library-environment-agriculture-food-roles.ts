/**
 * Populate Environment, Agriculture & Food roles.
 *   npx tsx scripts/populate-career-library-environment-agriculture-food-roles.ts
 */

import { EAF_PACKS } from './career-library-environment/packs'
import { runEafPopulate } from './career-library-environment/shared'

runEafPopulate(EAF_PACKS, 'Environment, Agriculture & Food roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
