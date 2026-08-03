# Work in My Education — Integration Batch 1 Report

**Pathway:** `work_in_my_education`  
**Date:** 2026-08-03  
**Principle:** Knowledge first → deterministic rules second → AI explanation later  
**Public Career Assistant:** unchanged / not connected

---

## 1. Architecture created

Server-only matching stack under `lib/career-engine/work-in-education/`:

```
profile validate → normalise (+ aliases)
  → resolve field/specialism (confidence + clarification)
  → bounded role load (resolved specialisms only)
  → eligibility + effective fit (no stored-fit mutation)
  → rank + diversity buckets
  → structured JSON result
```

Admin API + diagnostic UI for internal testing only.

---

## 2. Files changed / created

### Engine
- `lib/career-engine/work-in-education/types.ts`
- `lib/career-engine/work-in-education/aliases.ts`
- `lib/career-engine/work-in-education/normalise.ts`
- `lib/career-engine/work-in-education/validate.ts`
- `lib/career-engine/work-in-education/resolve-field.ts`
- `lib/career-engine/work-in-education/resolve-specialism.ts` (re-export)
- `lib/career-engine/work-in-education/evaluate-eligibility.ts`
- `lib/career-engine/work-in-education/classify-fit.ts` (re-export)
- `lib/career-engine/work-in-education/rank-roles.ts`
- `lib/career-engine/work-in-education/load-knowledge.ts`
- `lib/career-engine/work-in-education/match.ts`
- `lib/career-engine/work-in-education/build-result.ts` (re-export)
- `lib/career-engine/work-in-education/index.ts`

### API / Admin UI
- `app/api/admin/career-library/work-in-education/match/route.ts`
- `app/admin/career-library/test-work-in-education/page.tsx`
- `components/admin/career-library/TestWorkInEducationPage.tsx`
- `components/admin/career-library/AdminCareerLibraryPage.tsx` (link to harness)

### Tests / indexes / report
- `lib/career-engine/work-in-education/__tests__/fixtures.ts`
- `lib/career-engine/work-in-education/__tests__/run-unit-fixtures.ts`
- `scripts/test-work-in-education-match.ts`
- `supabase/migrations/20250804090000_career_library_work_in_education_retrieval_indexes.sql`
- `reports/work-in-education-integration-batch-1.md` (this file)

---

## 3. API route created

`POST /api/admin/career-library/work-in-education/match`

- Auth: `requireAdminApiUser()` (cookie session + admin allowlist)
- Data: service-role Supabase via `getCareerLibrarySupabase()` (key never to client)
- Body: `{ profile, includeDrafts?, limits? }`
- Response: `{ match: WorkInEducationMatchResult }`
- Logs: admin id, education_level, timings — **no raw private profile dump**

---

## 4. Admin test harness route

`/admin/career-library/test-work-in-education`

Displays normalised profile, field/specialism resolution, confidence, role buckets, gaps, provenance IDs, and collapsible raw JSON. Preset scenarios included. Linked from Career Library admin header.

---

## 5. Input / output contracts

**Input:** `WorkInEducationProfile` (validated server-side; optional fields allowed).  
**Output:** `WorkInEducationMatchResult` with:

- `resolution` (primary/alternatives, confidence, `needs_clarification`)
- `recommendations` buckets: immediate / realistic_next / future_progression / academic_or_research / blocked_or_needs_review
- `qualification_recognition`, `overall_gaps`, `warnings`
- `data_provenance` with field/specialism/role UUIDs
- `meta.query_count`, `meta.elapsed_ms`

---

## 6. Matching algorithm

1. Normalise titles/subjects via alias index (seed aliases; Admin-manageable later).
2. Score every active specialism (exact, alias target, token Jaccard, description, skills, job title, field alignment).
3. Aggregate to fields; pick primary specialism by score.
4. If confidence &lt; **0.42**, or missing subject, or near-tied alternatives → `needs_clarification` with options from existing specialisms only.
5. Load roles only for primary + up to 3 related specialisms (≤60 roles each, draft allowed for admin tests).

---

## 7. Eligibility gate logic

Per role:

- Education vs `academic_requirement`
- Experience vs `minimum_experience_years` / seniority
- Registration vs `professional_registration_requirement` + regulated flags
- Licence heuristic from eligibility notes
- Overseas qualification → `country_recognition_review_needed`

Statuses: `eligible` | `conditionally_eligible` | `not_yet_eligible` | `needs_review`.

---

## 8. Regulated-role safety behaviour

- Matching degree alone never unlocks unrestricted immediate access for regulated roles.
- Healthcare (and similar) with missing/unknown registration → `needs_review` / `blocked_until_requirement`, never unrestricted `immediate`.
- Overseas regulated pathways flag recognition review.
- Senior/leadership titles with low experience forced off `immediate`.

---

## 9. Ranking logic

Weighted score (0–100): specialism rank, field match, education, experience, registration, skills, preferences, progression realism, library priority, UK confidence.

Diversity: near-identical title stems limited per bucket. Default limits: 5 / 5 / 5 / 3 / 5. Empty buckets allowed.

**Stored `fit_classification` is not mutated** — only `effective_fit` is computed.

---

## 10. Database queries and indexes

Typical match: **~4–7 queries** (fields, specialisms, N× roles by specialism, stages).

Added safe indexes (migration `20250804090000_...`):

- `career_library_roles (specialism_id, active, status, priority)`
- `career_library_specialisms (field_id, active)` partial
- `career_library_fields (active)` partial

No destructive schema changes.

---

## 11. Test scenarios and results

### Unit (no DB) — all passed
`npx tsx lib/career-engine/work-in-education/__tests__/run-unit-fixtures.ts`

Covers validation, aliases, clarification, civil resolve, senior≠immediate, regulated gates, NMC, PhD research, ranking diversity, determinism, overseas medicine.

### DB integration — all passed
`npx tsx scripts/test-work-in-education-match.ts`

| Fixture | Result |
|---------|--------|
| UK Civil BEng, 0 exp | Engineering / civil, conf=1 |
| UK Animation MSc | Resolved (arts/creative/animation) |
| Overseas Law, no reg | Law field; recognition review; no unrestricted immediate |
| Overseas Medicine | Healthcare/medicine; blocked/needs_review safety |
| UK Nursing + NMC | Nursing specialism |
| PhD Biology research | Biology / natural sciences |
| Business 3y | Business field |
| CS graduate portfolio | IT/software path |
| Tourism Management | Hospitality/tourism |
| Ambiguous missing subject | `needs_clarification` |
| Regulated reg unknown | Safety gate holds |
| Overqualified inexperienced | No senior immediate |

Repeated runs produce identical primary specialism id + confidence.

---

## 12. Performance results

From DB fixture run (service-role, local):

| Case | Queries | Elapsed |
|------|--------:|--------:|
| Civil (cold-ish) | 4 | ~1.8s |
| Typical subsequent | 4–7 | ~280–520ms |

Candidate roles considered: bounded (not full 9,083). Client never loads full library.

---

## 13. Known limitations

- Alias list is seed-only (not Admin CRUD UI yet).
- Specialism scoring is lexical/alias — not semantic embeddings.
- CS→software confidence can still be borderline vs other IT specialisms; clarification may appear.
- Licence matching is note-heuristic, not a full licence registry.
- Draft roles included by default in admin match for testing.
- Healthcare audit critical findings still unresolved — conservative gates remain.
- No LLM explanation layer yet (by design).

---

## 14. Audit findings deliberately left unresolved

- Healthcare `registration.regulated_immediate_without_pathway_clarity` (40 critical)
- Fit / PhD / duplicate / cross-field quality highs & mediums
- Remaining non-structural role-quality work

---

## 15. Confirmation — public Career Assistant unchanged

- No changes to public Career Assistant routes/components.
- No connection from live education-path UI to this matcher.
- No Ollama/OpenAI explanation wiring.
- Legacy `lib/career-engine/education-path` left intact.

---

## 16. Recommended Integration Batch 2

1. Wire Assessment Blueprint outcomes → this matcher (still no public UI).
2. Admin-managed alias tables CRUD.
3. Tighten Healthcare registration pathway metadata (audit batch).
4. Optional approved-only public-read path behind feature flag (still no Assistant).
5. Course recommendation hooks using `overall_gaps` + specialism IDs.
6. Report Rules consumption of match JSON.

---

**Stop:** Work in My Education Integration Batch 1 complete.
