# Work in My Education — Course Alignment

## Summary

Adds a **computed** Work in My Education course alignment layer over the existing Course Opportunities / Course Library.

- Does **not** reorganise or delete course rows
- Does **not** change Start New Career / Extra Income / Work in Experience mappings
- Filters WIE recommendations so practical job-entry courses (SIA, Forklift, Taxi, generic warehouse, Food Hygiene outside hospitality) are excluded unless the education field clearly allows them

## Module

`lib/career-engine/work-in-education/course-alignment/`

| File | Role |
|------|------|
| `types.ts` | Alignment schema (purpose, goals, badges, audit) |
| `contamination.ts` | Route ownership / contamination rules |
| `purpose-rules.ts` | Purpose A–F + field include patterns |
| `classify.ts` | `classifyWieCourse` / eligibility |
| `filter-recommendations.ts` | Recommend-time filter + ranking boost |
| `audit.ts` | Admin/dev audit summary |

## Wired into

- `lib/recommendations/matchEducationRecommendations.ts` — when `goalKey === work_in_education`
- `lib/career-engine/pathway-knowledge/adapter.ts` — library learning option title safety
- Admin Course Opportunity Tracker — WIE badges, quick views, audit strip
- `GET /api/admin/course-opportunities/wie-alignment-audit` — JSON or `?format=markdown`

## Purposes

- `career_bridge`
- `uk_workplace_bridge`
- `technical_skill_booster`
- `professional_pathway`
- `cpd_add_on`
- `not_suitable_for_work_in_education`

## Commercial rules (unchanged)

Apply Now only with a real `referral_url`; otherwise Coming Soon / no fake Apply Now.

## Tests

```bash
npx tsx lib/career-engine/work-in-education/course-alignment/__tests__/run-wie-course-alignment-unit.ts
```
