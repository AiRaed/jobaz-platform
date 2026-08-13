# Work in My Education — Integration Batch 3

**Date:** 2026-08-03  
**Status:** Complete  
**Scope:** Assessment blueprint, answer→profile mapping, clarification loop, admin preview, deterministic presenter  
**Out of scope (confirmed):** Public Career Assistant, public wizard, LLM explanations, course recommendations, answer persistence

---

## 1. Architecture created

```
Assessment Blueprint (typed config v1)
  → Answer Validation
  → Answer Normalisation / mapWorkInEducationAnswersToProfile()
  → Existing Knowledge Matcher (matchWorkInEducation)
  → Deterministic Result Presenter
  → Structured assessment output
```

Matching logic is **not** duplicated. Batch 1–2 engine remains source of truth for field/specialism resolution, eligibility, ranking, registration safety, and buckets.

Clarification loop: second request may include `clarification_answers.selected_specialism_id`, validated against matcher clarification options via `MatchOptions.forceSpecialismId`.

---

## 2. Files changed

### New

| Path | Role |
|------|------|
| `lib/career-engine/work-in-education/assessment/types.ts` | Contracts |
| `lib/career-engine/work-in-education/assessment/blueprint.ts` | Typed blueprint `wie-assessment-v1.0.0` |
| `lib/career-engine/work-in-education/assessment/conditions.ts` | `show_when` evaluation |
| `lib/career-engine/work-in-education/assessment/validate-answers.ts` | Server-side answer validation |
| `lib/career-engine/work-in-education/assessment/map-answers-to-profile.ts` | Deterministic mapper + provenance |
| `lib/career-engine/work-in-education/assessment/build-assessment-result.ts` | Non-LLM presenter |
| `lib/career-engine/work-in-education/assessment/run-assessment.ts` | `runWorkInEducationAssessment()` |
| `lib/career-engine/work-in-education/assessment/index.ts` | Barrel |
| `lib/career-engine/work-in-education/assessment/__tests__/run-batch-3-unit.ts` | Unit tests |
| `app/api/admin/career-library/work-in-education/assessment/route.ts` | Admin API |
| `app/admin/career-library/test-work-in-education-assessment/page.tsx` | Admin route |
| `components/admin/career-library/TestWorkInEducationAssessmentPage.tsx` | Preview UI |
| `scripts/test-work-in-education-batch-3.ts` | DB scenario tests |
| `reports/work-in-education-batch-3-perf.json` | Perf snapshot |
| `reports/work-in-education-integration-batch-3.md` | This report |

### Updated

| Path | Change |
|------|--------|
| `lib/career-engine/work-in-education/types.ts` | `forceSpecialismId` on `MatchOptions` |
| `lib/career-engine/work-in-education/match.ts` | Apply forced clarification specialism safely |
| `lib/career-engine/work-in-education/index.ts` | Export assessment API |
| `components/admin/career-library/AdminCareerLibraryPage.tsx` | Link to assessment preview |

### Unchanged (confirmed)

- Public Career Assistant routes/components
- Raw matcher page `/admin/career-library/test-work-in-education`
- Legacy DB Assessment Blueprint / report-rules path

---

## 3. Blueprint version and question list

**Version:** `wie-assessment-v1.0.0`  
**Active:** true  
**Created:** 2026-08-03  

Stable question IDs (examples): `wie_q_education_level`, `wie_q_subject`, `wie_q_nursing_scope`, …

| Key | Required | Notes |
|-----|----------|-------|
| `education_level` | yes | college_or_diploma → maps to `college`, etc. |
| `qualification_title` | yes | |
| `subject` | yes | |
| `specialisation` | no | |
| `qualification_country` | yes | |
| `graduation_status` | yes | |
| `graduation_year` | no | shown when completed/studying |
| `years_relevant_experience` | yes | |
| `current_job_title` | no | |
| `has_uk_experience` | no | |
| `registration.*` | conditional | body/status/scope |
| `engineering_registration` | conditional | CEng/IEng/EngTech |
| `qts_status` | conditional | teaching |
| `uk_recognition_confirmed` | conditional | non-UK country |
| `licences` / `skills` / `english_level` | no | |
| `preferences.*` | no | academic shown for master/doctorate |

Readiness notes embedded in blueprint for later Admin CRUD under Career Knowledge Library → Assessment Blueprint. No new DB tables in this batch.

---

## 4. Conditional question logic

Deterministic `show_when` (and/or, equals/in/contains/truthy):

- Nursing subject/title → registration + NMC scope options  
- Medicine/Law/Engineering/Teaching signals → registration prompts  
- Engineering titles → CEng/IEng/EngTech optional  
- Teaching/PGCE → QTS  
- Non-UK country → UK recognition confirmed  
- Studying/completed → graduation year  
- Master/doctorate → academic route preference  

---

## 5. Answer validation

- Required visible fields enforced  
- Enum checks for education/graduation  
- Year/experience bounds  
- Unknown top-level keys **stripped** (forward compatible), not hard-failed  
- Missing subject → `assessment_status: invalid`  

---

## 6. Mapping logic

`mapWorkInEducationAnswersToProfile()`:

- No LLM, no role matching, no DB writes  
- Trims text, normalises UK country aliases  
- Maps education enums, registration → `professional_registration[]` with scope  
- Engineering registration / QTS → registration entries  
- Preferences → `career_preferences`  
- Returns `mapping_warnings` + `mapping_provenance[]`  

---

## 7. Clarification loop

1. Broad Law (etc.) → `needs_clarification` + options  
2. Client resubmits same answers + `clarification_answers.selected_specialism_id`  
3. Matcher forces specialism only if ID is in clarification options (or already primary/alt)  
4. Arbitrary UUIDs rejected  

Admin preview includes radio selection + re-run.

---

## 8. Assessment execution service

`runWorkInEducationAssessment(supabase, request)`:

1. Load blueprint by version  
2. Validate answers  
3. Map to profile  
4. Call `matchWorkInEducation` (optional force specialism)  
5. Build presentation + summary + next actions  
6. Return structured result with timing trace  

---

## 9. Admin preview route

`/admin/career-library/test-work-in-education-assessment`

Shows: questions (conditional), blueprint version, validation, mapped profile, resolution, clarification panel, human summary, role buckets, next actions, collapsible raw JSON.

Fixtures: UK Civil Eng, Animation MSc, Broad LLB, Overseas Medicine, Adult Nursing + NMC, PhD Biology, missing subject.

---

## 10. Internal API route

`POST /api/admin/career-library/work-in-education/assessment`

- `requireAdminApiUser()`  
- Service-role via `getCareerLibrarySupabase()` (not exposed to client)  
- Structured logs only: pathway, blueprint version, status, field/specialism IDs, counts, timings  
- No answer persistence; no registration numbers / free-text profile dumps  

---

## 11. Result presentation structure

```json
{
  "headline_key": "assessment.headline.matched",
  "headline_params": { "specialism": "…" },
  "headline": "Your qualification most closely matches …",
  "summary_items": [{ "message_key": "…", "params": {}, "text": "…" }],
  "next_action_items": [{ "type": "clarification|registration|recognition|experience|review", "message_key": "…", "params": {}, "text": "…" }]
}
```

No free-form LLM prose. No course recommendations.

---

## 12. Test results

### Unit (`npx tsx lib/career-engine/work-in-education/assessment/__tests__/run-batch-3-unit.ts`)

All passed: blueprint, conditions, validation, mapping, presenter, determinism.

### DB (`npx tsx scripts/test-work-in-education-batch-3.ts`)

| # | Scenario | Result |
|---|----------|--------|
| 1 | UK Civil Engineering graduate | complete; imm=3, future=5, blocked=3 |
| 2 | UK Animation MSc | Animation resolved; imm=2 |
| 3 | Broad LLB Law | needs_clarification; 10 options |
| 4 | Clarified Commercial Law | Commercial Law forced |
| 4b | Arbitrary specialism ID | rejected |
| 5 | Overseas Medicine no GMC | imm=0 clinical; recognition actions |
| 6 | UK Adult Nursing + NMC Adult | no Mental Health immediate |
| 7 | PhD Biology academic | academic_count=3 |
| 8 | Missing subject | invalid |
| 9 | Unknown registration body | regulated_safety=PASS; blocked bucket used |
| 10 | Repeated identical answers | identical counts/resolution/headline |

### Batch 2 matcher regressions

`npx tsx scripts/test-work-in-education-batch-2.ts` — **all passed** (assessment only adds safe `forceSpecialismId`).

### TypeScript

Assessment module type error fixed. Remaining repo `tsc` noise is pre-existing (unrelated modules).

---

## 13. Performance results

From `reports/work-in-education-batch-3-perf.json` (dev, cold-ish first call):

| Scenario | total_ms | Notes |
|----------|----------|-------|
| Civil Eng (first) | ~1831 | cold matcher/DB |
| Animation | ~737 | |
| Determinism run1/run2 | ~328 / ~317 | warm under ~1s |
| Broad Law clarify | ~246 | |
| Clarified Commercial | ~338 | |
| Overseas Medicine | ~355 | |
| Adult Nursing | ~328 | |
| PhD Biology | ~385 | |

Mapping typically ≤2ms. Warm assessment runs typically under 1s after first library load. Full Career Library is **not** loaded client-side.

---

## 14. Security / privacy confirmation

- Admin auth required on API  
- No public route uses assessment service  
- Answers not stored permanently in this batch  
- No OpenAI / Ollama / external AI  
- Logs exclude full names, registration numbers, detailed free-text answers  
- Structured diagnostic events only  

---

## 15. Known limitations

- Blueprint is typed code/config, not Admin CRUD yet  
- Separate from legacy `career_library_questions` report-rule blueprint  
- No multi-step public wizard  
- Clarification is admin/backend only  
- First cold DB match can exceed 1s  
- Psychology registration prompts not fully specialised beyond generic registration heuristics  
- Course / recognition content still out of scope  

---

## 16. Public Career Assistant unchanged

Confirmed: no public Career Assistant wiring; assessment is admin/internal only. Raw matcher harness unchanged and still linked separately.

---

## 17. Recommended Batch 4

1. Optional feature-flagged path from Career Assistant → assessment service (still knowledge-first; no LLM role invention)  
2. Admin Assessment Blueprint CRUD (reuse stable question IDs; migrate config → DB carefully)  
3. Engineering stage/title conflict cleanup from Batch 2 audit JSON (data, not matcher)  
4. Nursing branch specialisms / metadata refinement if library structure allows  
5. Clarification UX polish for eventual public multi-step flow  
6. Qualification recognition content pages + next-action deep links  
7. Course / learning options only after recognition + registration gaps are productised  

**Stop after Integration Batch 3.**
