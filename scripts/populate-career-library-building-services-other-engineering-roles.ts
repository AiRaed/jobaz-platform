/**
 * RETIRED — Do not use.
 *
 * Previously assigned Degree / Master's / PhD as career stages (academic_level).
 * Canonical Engineering path:
 *   1. npx tsx scripts/populate-career-library-engineering.ts
 *   2. npx tsx scripts/remap-engineering-professional-stages.ts
 *   3. npx tsx scripts/career-library-engineering/audit.ts
 *
 * Historical role data archived at:
 *   scripts/career-library-engineering/legacy-archives/populate-career-library-building-services-other-engineering-roles.ts.archived.txt
 */

import { refuseLegacyEngineeringAcademicPopulate } from './career-library-engineering/refuseLegacyAcademicPopulate'

refuseLegacyEngineeringAcademicPopulate(
  'populate-career-library-building-services-other-engineering-roles.ts'
)
