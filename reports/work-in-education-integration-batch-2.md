# Work in My Education — Integration Batch 2 Report

**Focus:** Recommendation quality gates and specialism safety  
**Date:** 2026-08-03  
**Public Career Assistant:** unchanged / not connected

---

## 1. Files changed

### New
- `lib/career-engine/work-in-education/thresholds.ts`
- `lib/career-engine/work-in-education/qualification-scope.ts`
- `lib/career-engine/work-in-education/professional-stage-gate.ts`
- `lib/career-engine/work-in-education/__tests__/run-batch-2-unit.ts`
- `scripts/test-work-in-education-batch-2.ts`
- `reports/work-in-education-quality-gate-conflicts.json`
- `reports/work-in-education-integration-batch-2.md` (this file)

### Updated
- `lib/career-engine/work-in-education/types.ts` — registration scope, structured gaps, QA summary, retrieval provenance
- `lib/career-engine/work-in-education/resolve-field.ts` — broad-subject ambiguity + exact specialisation force
- `lib/career-engine/work-in-education/evaluate-eligibility.ts` — scope + stage gates; demotion priority
- `lib/career-engine/work-in-education/match.ts` — specialism-first retrieval; QA summary
- `lib/career-engine/work-in-education/rank-roles.ts` — blocker score caps
- `lib/career-engine/work-in-education/validate.ts` / `normalise.ts`
- `lib/career-engine/work-in-education/index.ts`
- `components/admin/career-library/TestWorkInEducationPage.tsx` — scope field, QA panel, demotion/provenance

---

## 2. Ambiguity logic

Configurable thresholds (`QUALITY_GATE_THRESHOLDS`):

- min specialism confidence: **0.42**
- min score margin: **0.12**
- broad-subject ambiguity window: **0.10**

Broad subjects (Law, Engineering, Business, Biology, Nursing, Computing, Art, Languages, Education, …) do **not** force a narrow specialism when several peers score closely and there is no discriminating evidence.

When ambiguous:

- `primary_specialism = null`
- `needs_clarification = true`
- `clarification_reason = broad_subject_multiple_valid_specialisms` (or missing_subject / low_confidence / close_score_margin)
- clarification options from the resolved **field** only
- **no role retrieval** from an arbitrary narrow specialism

Exact evidence still resolves (e.g. specialisation / title “Commercial Law”, “Civil Engineering”, “Adult Nursing”).

---

## 3. Qualification-scope architecture

Reusable `evaluateQualificationScope()` with:

- `qualification_scope_match`: matched | adjacent | mismatched | unknown  
- `registration_scope_match`: matched | mismatched | unknown  

Profile registration entries may include optional `registration_scope` (never logged; `registration_number` accepted but nulled).

Cautious inference from qualification titles only (e.g. BSc Adult Nursing → `adult_nursing`). Generic “Nursing” alone does **not** infer a branch.

---

## 4. Nursing branch safety

Role-title branch detection (DB currently stores branch roles under a single `nursing` specialism):

- Adult / Mental Health / Children’s / Learning Disability / Midwifery / Nursing Associate / general

Rules enforced:

- mismatched regulated branch → not Immediate (`blocked_until_requirement`)
- unknown scope + branch-specific title → `needs_review`
- Midwifery not interchangeable with Nursing
- Nursing Associate distinct

---

## 5. Engineering professional-stage gate

`evaluateProfessionalStageGate()` for `engineering`:

- Explicit CEng/IEng/chartered titles without status → blocked
- Roles on `chartered_professional_route` without explicit chartership → warnings (`stage_professional_status_not_confirmed`, `role_stage_metadata_review_needed`)
- Zero-experience graduates: entryish titles may remain Immediate; general titles on chartered stage demoted from “accessible professional”
- Does **not** mark every Engineering role regulated

---

## 6. Retrieval changes

- Primary resolved specialism only by default
- Related specialisms: only high-confidence peers; **blocked** for healthcare / law / engineering (strict fields)
- Ambiguous broad subjects: **zero** role pool until clarification
- Each recommendation carries `retrieval_source`, `relation_reason`, `scope_gate`, `professional_stage_gate`, `demotion_reasons`

---

## 7. Effective-fit changes

Priority order:

1. Legal/professional registration block  
2. Scope mismatch  
3. Stage/professional-status block  
4. Experience / seniority  
5. Stored fit  
6. Ranking score (cannot override blockers)

---

## 8. Test harness changes

`/admin/career-library/test-work-in-education` now shows:

- Registration scope selector  
- QA summary (PASS/WARNING/FAIL)  
- Clarification panel with reasons/margins  
- Scope + stage gates per role  
- Retrieval source + demotion reasons  

---

## 9. Regression test results

### Unit (`run-batch-2-unit.ts` + Batch 1 fixtures)
All passed.

### DB (`scripts/test-work-in-education-batch-2.ts`)
| Scenario | Result |
|----------|--------|
| A Broad LLB Law | Field=law-legal-justice; clarify; no primary specialism; no immediate roles |
| B Commercial Law | Resolved `commercial-law`; overseas recognition warning |
| C Adult Nursing + NMC adult | Immediate excludes MH/children/midwife branches |
| E Unknown NMC scope | No branch-specific unrestricted immediate |
| F Civil graduate 0y | Civil specialism; no senior/chartered immediate; QA all PASS |
| H Overseas Medicine | Regulated safety PASS |
| I Animation MSc | arts-media + animation preserved |
| J PhD Biology | academic_or_research bucket populated |
| Determinism | Repeated Law clarification identical |

---

## 10. Targeted metadata conflicts

`reports/work-in-education-quality-gate-conflicts.json` — **102** findings (sampled/capped), mainly Engineering:

- entryish titles on `chartered_professional_engineer`
- general titles on chartered stage with low `minimum_experience_years`

**No mass data edits** in this batch — engine gates compensate; later data cleanup recommended.

---

## 11. Performance impact

Typical Batch 2 match: **~0.3–0.7s**, **fewer** role queries when clarification short-circuits retrieval (Law ambiguity: field resolve only). Civil/Animation still ~4 queries.

---

## 12. Known limitations

- Nursing branches are title-inferred within one specialism (no separate DB specialisms yet)
- Alias admin CRUD still seed-only
- Licence matching remains note-heuristic
- Engineering stage metadata conflicts remain in library data
- Healthcare audit critical findings still unresolved (conservative gates remain)
- No LLM / public Assistant / courses

---

## 13. Confirmation — public Career Assistant unchanged

No public Career Assistant routes, education-path UI, or LLM providers were modified.

---

## 14. Recommendation for Integration Batch 3

1. Wire Assessment Blueprint answers → this matcher (still admin/internal).  
2. Optional user-selected clarification specialism in harness + API.  
3. Targeted Engineering stage remaps for conflict JSON entries.  
4. Split Nursing into branch specialisms **or** add role metadata `registration_scope` in library.  
5. Admin-managed aliases.  
6. Only then consider a feature-flagged, non-public preview path toward Assistant.

---

**Stop:** Integration Batch 2 complete.
