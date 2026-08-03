/**
 * Populate Arts, Media & Creative Industries roles.
 *   npx tsx scripts/populate-career-library-arts-media-creative-roles.ts
 */

import { ARTS_PACKS } from './career-library-arts/packs'
import { runArtsPopulate } from './career-library-arts/shared'

runArtsPopulate(ARTS_PACKS, 'Arts, Media & Creative Industries roles populate').catch((e) => {
  console.error(e)
  process.exit(1)
})
