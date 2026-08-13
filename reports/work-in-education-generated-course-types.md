# Work in My Education — Generated Course Types

## Purpose

Add **missing course type / learning option names** for expanded Work in My Education fields and specialisms.

These are **not** published courses and **not** affiliate offers.

## Safety guarantees

Generated rows always have:

| Field | Value |
|-------|--------|
| `opportunityStatus` | Need provider |
| `visibilityStatus` | recommendation_only |
| `commercialStatus` | no_link |
| `publishStatus` | Not published |
| `providers` | `[]` (no fake provider) |
| `referral_url` | none |
| `goals` | `work_in_education` only |
| `source` marker | `generated_from_work_in_education_course_gap` |

Public display: **Coming soon / Provider not listed yet** — never Apply Now.

## How to generate

Admin → Course Opportunities → **Generate missing WIE course types**

API: `POST /api/admin/course-opportunities/seed-wie-generated-course-types`

## Catalog packs

Defined in `lib/career-engine/work-in-education/course-alignment/gap-course-catalog.ts`:

Engineering, IT, Healthcare, Natural Sciences, Business, Accounting, Law, Education, Arts/Media, Languages, Humanities, Environment, Government, Hospitality, Architecture, Psychology, Public Health, Logistics, HR, Marketing.

## Contamination avoided by default

Not auto-added for WIE:

- SIA Door Supervisor / Security Guard  
- Forklift / Taxi / PHV  
- Generic warehouse / bar / hospitality job-entry  
- Food Hygiene except hospitality/food/agriculture packs  
- CSCS only in Architecture/Built Environment pack (site note)  
- ECS / 18th Edition not in default non-electrical packs  

## Deduplication

Uses `titleNormalization` canonical groups + per-run title dedupe. Existing titles get **mapping merges** (education fields / specialisms / WIE goal) instead of new rows.

## Admin badges / filters

- Badge: **Generated WIE course type** (+ Need provider / Recommendation-only / No link / Not published)  
- Quick view: **Generated WIE types** (`wie-generated`)

## Files

| Path | Role |
|------|------|
| `gap-course-catalog.ts` | Course type catalog by field family |
| `seedWieGeneratedCourseTypes.ts` | Plan create/update/skip |
| `seed-wie-generated-course-types/route.ts` | Admin seed API |
| `reports/work-in-education-generated-course-types.md` | This report |

## Tests

```bash
npx tsx lib/admin/opportunities/__tests__/run-wie-generated-course-types-unit.ts
```

## After generating (live)

1. Open quick view **Generated WIE types**.  
2. Research real providers for high-priority rows.  
3. Only add referral URLs when a real partner link exists.  
4. Re-run coverage audit: `GET /api/admin/course-opportunities/wie-alignment-audit`.  

## Counts (from unit planner — empty library)

Run the generate action in Admin for live counts. Unit planner against Psychology + Accounting alone creates many recommendation-only types with zero providers.

Do **not** delete existing courses. Do **not** remap Security/Forklift/Taxi into WIE. Other goal paths are untouched.
