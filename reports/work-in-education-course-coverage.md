# Work in My Education — Course Coverage Audit

## Purpose

Compare the **Career Knowledge Library** (fields / specialisms / stages) against the **Course Library / Course Opportunities** table.

This is a **coverage + gap** system. It does **not** rewrite or delete existing course rows, and it does **not** change Start New Career, Work in Experience, or Extra Income mappings.

## How it works

Module: `lib/career-engine/work-in-education/course-alignment/`

| Piece | Role |
|-------|------|
| `coverage.ts` | Field/specialism ↔ opportunity match tiers + coverage status |
| `suggested-course-types.ts` | Suggested course *types* for missing routes (no fake providers) |
| `gap-cards.ts` | Public “Coming soon / Provider not listed” cards |
| `coverage-server.ts` | Loads library + opportunities for admin audit |

### Coverage status

- **covered** — enough specialism and/or field-level WIE-safe courses
- **partially_covered** — field-level / bridge / CPD only, or weak specialism depth
- **missing_course_coverage** — no safe WIE course yet
- **contaminated_only** — only unrelated job-entry courses nearby (SIA / Forklift / Taxi / etc.)

### Match tiers (prefer in order)

1. Exact specialism  
2. Field-level  
3. UK workplace bridge  
4. Professional pathway  
5. CPD add-on  
6. No match → suggested course types (Coming soon)

## Safety rules (Career Assistant)

When `goal_path = work_in_education`:

- Prefer specialism → field → bridge → professional → CPD
- Never fall back to unrelated high-commercial courses
- If no safe match: show **Recommended course type** + **Coming soon** / save interest
- Apply Now only when a real `referral_url` exists

Learning Loop: `course_missing_affiliate_detected` is emitted for gap / no-link WIE cards (`event_source: work_in_education_course_coverage`).

## Admin

- Course Opportunity Tracker: WIE alignment strip + **Library field ↔ course coverage** panel
- Quick views: WIE aligned / not for WIE / needs mapping / contamination / needs provider
- API: `GET /api/admin/course-opportunities/wie-alignment-audit`  
  - JSON includes `summary` (alignment) + `coverage`  
  - `?format=markdown` for a combined report

## Suggested course types (examples for missing fields)

| Field area | Suggested types (research providers — do not invent Apply Now) |
|------------|------------------------------------------------------------------|
| Psychology | Mental Health Awareness, Counselling Skills, Safeguarding, Research Methods |
| Biology / Life Sciences | Laboratory Skills, H&S, Data Analysis, Research Assistant bridge |
| Architecture / Built Environment | AutoCAD, Revit/BIM, Portfolio, CSCS if site |
| Media / Animation | Portfolio, Adobe, Motion Graphics, UX/UI |
| Business / Management | Project Management, Excel, Business Admin |
| HR | CIPD Foundation, Recruitment, Employment Law basics |
| Law | Paralegal, Legal Secretary, UK Legal System, Compliance |
| Public Health | Health Promotion, Safeguarding, Data Analysis |

## Next admin actions

1. Open Admin → Course Opportunities → review **Missing** fields in the coverage panel.  
2. Map `education_fields` / `specialisations` on existing WIE-aligned rows where badges show gaps.  
3. Research providers for high-priority suggested types; link only when a real referral/official URL exists.  
4. Keep SIA / Forklift / Taxi / Warehouse excluded from WIE unless the education field logically supports them.  
5. Treat UK workplace bridges as optional when specialism coverage is weak — not as primary “exact match” cards.

## Tests

```bash
npx tsx lib/career-engine/work-in-education/course-alignment/__tests__/run-wie-course-alignment-unit.ts
npx tsx lib/career-engine/work-in-education/course-alignment/__tests__/run-wie-course-coverage-unit.ts
```

## Live coverage snapshot

Run as admin (dev):

`GET /api/admin/course-opportunities/wie-alignment-audit?format=markdown`

Paste or save the markdown output here after major library expansions.
