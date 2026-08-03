/**
 * RETIRED — Do not use.
 *
 * Previously backfilled Civil Engineering eligibility while resolving stages via
 * academic_level (Degree / Master's / PhD). That stage model is obsolete.
 *
 * Canonical Engineering path:
 *   1. npx tsx scripts/populate-career-library-engineering.ts
 *   2. npx tsx scripts/remap-engineering-professional-stages.ts
 *   3. npx tsx scripts/career-library-engineering/audit.ts
 *
 * Historical script archived at:
 *   scripts/career-library-engineering/legacy-archives/backfill-civil-engineering-role-eligibility.ts.archived.txt
 */

import { refuseLegacyEngineeringAcademicPopulate } from './career-library-engineering/refuseLegacyAcademicPopulate'

refuseLegacyEngineeringAcademicPopulate('backfill-civil-engineering-role-eligibility.ts')
