/**
 * Shared retirement guard for legacy Engineering academic-stage populate scripts.
 *
 * Canonical Engineering path (do not use Degree / Master's / PhD as stages):
 *   1. npx tsx scripts/populate-career-library-engineering.ts
 *      → field + specialisms on engineering_professional_route
 *   2. npx tsx scripts/remap-engineering-professional-stages.ts
 *      → role stage_id remapped to professional stages
 *   3. npx tsx scripts/career-library-engineering/audit.ts
 *
 * Historical role title/description lists (non-executable archive):
 *   scripts/career-library-engineering/legacy-archives/
 */

export function refuseLegacyEngineeringAcademicPopulate(scriptLabel: string): never {
  const message = [
    '',
    `RETIRED: ${scriptLabel}`,
    '',
    'This script previously assigned Degree / Master\'s / PhD as career stages',
    'via academic_level. That model is obsolete for Engineering.',
    '',
    'Canonical Engineering seed / remap path:',
    '  1. npx tsx scripts/populate-career-library-engineering.ts',
    '  2. npx tsx scripts/remap-engineering-professional-stages.ts',
    '  3. npx tsx scripts/career-library-engineering/audit.ts',
    '',
    'Archived historical role lists (do not execute):',
    '  scripts/career-library-engineering/legacy-archives/',
    '',
  ].join('\n')
  console.error(message)
  throw new Error(
    `Refused to run retired Engineering academic-stage populate: ${scriptLabel}`
  )
}
