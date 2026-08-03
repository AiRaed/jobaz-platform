/**
 * Populate Languages & Literature roles.
 *   npx tsx scripts/populate-career-library-languages-literature-roles.ts
 */

import { LANG_PACKS } from './career-library-languages/packs'
import { runLangPopulate } from './career-library-languages/shared'

runLangPopulate(LANG_PACKS, 'Languages & Literature roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
