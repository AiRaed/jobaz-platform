# Legacy Engineering populate archives (NON-EXECUTABLE)

These files previously seeded Engineering roles using `academic_level` stages:

- Degree
- Master's
- PhD

That progression model is **retired**. Engineering now uses
`engineering_professional_route`. Academic qualifications remain role metadata
(`academic_requirement`), not stages.

## Do not run these files

They are retained only as historical role title/description references
(`.ts.archived.txt`). They are **not** TypeScript modules and cannot be executed
with `tsx`/`node`.

## Canonical Engineering path

1. `npx tsx scripts/populate-career-library-engineering.ts` — field + specialisms
2. `npx tsx scripts/remap-engineering-professional-stages.ts` — role stage remap
3. `npx tsx scripts/career-library-engineering/audit.ts` — validation

Top-level `scripts/populate-career-library-*-engineering-roles.ts` paths (and
related scripts) are now thin retirement stubs that refuse to execute.
