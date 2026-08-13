# Work in My Education — Dataflow Debug Report

**Date:** 2026-08-03  
**Status:** Root cause confirmed and fixed  
**Scope:** Public Career Assistant wizard → assessment → matcher → CareerPathwayCard  

---

## Verdict

The Batch 6 result UI was correct. **Matcher roles were never loaded** on the public path when draft library rows were excluded (`includeDrafts: false` / approved-only query).

Admin matcher defaults `includeDrafts: true` → Civil Engineering returns Immediate + Future roles.  
Public CA previously loaded **0 candidates** → empty buckets → summary-only look.

Scoring / ranking / eligibility algorithms were **not** reimplemented. The same `matchWorkInEducation` grouped response is mapped 1:1 into the public contract.

---

## 1. Data flow (exact pipeline)

```
Wizard answers (AssessmentWizard)
  → POST /api/career-assistant/work-in-my-education/assessment
  → runWorkInEducationAssessment
       → validateWorkInEducationAnswers
       → mapWorkInEducationAnswersToProfile   // profile only
       → matchWorkInEducation                 // SAME matcher as admin
            → resolveFieldAndSpecialism
            → loadRolesForSpecialisms(includeDrafts)
            → evaluateRoleEligibility
            → rankAndBucketRoles              // grouped buckets
       → buildAssessmentPresentation          // copy only; does not invent roles
  → buildPublicWieAssessmentResult
       → mapMatcherRecommendationsToPublic    // rename only; no re-match
  → PublicResultExperience
       → CareerPathwayCard (per role)
```

**No second matcher runs on the result page.** Pathway expand loads knowledge by `pathway_id` only.

---

## 2. Bucket vocabulary (matcher → public → UI)

| Matcher (admin / internal) | Public CA key | UI section |
|----------------------------|---------------|------------|
| `immediate` | `available_now` | Immediate Opportunities |
| `realistic_next` | `realistic_next` | Realistic Next Step |
| `future_progression` | `future_options` | Future Progression |
| `academic_or_research` | `academic_research` | Academic & Research |
| `blocked_or_needs_review` | `requirements_needed` | Requirements Still Needed |

CamelCase names from the brief (`immediateRoles`, `futureProgressionRoles`, …) are **aliases only** in the renderer fallback — they are not produced by the matcher.

Public response also includes `role_counts` mirrored from matcher meta:

- `immediate`, `realistic_next`, `future_progression`, `academic_or_research`, `blocked_or_needs_review`
- `candidate_roles_considered`
- `include_drafts`

---

## 3. Admin matcher vs public CA comparison (Civil Engineering)

### Profile / answers (aligned)

| Field | Admin match UI | Wizard / public assessment |
|-------|----------------|----------------------------|
| subject | Civil Engineering | Civil Engineering |
| qualification_title | BEng Civil Engineering | BEng Civil Engineering |
| education_level | bachelor | bachelor |
| years_relevant_experience | 0 | 0 |
| specialisation | null / empty | null |

### Library inventory

| Specialism | Roles | Status |
|------------|-------|--------|
| Civil Engineering (`a914204e-…`) | 30 | all `draft\|active=true` |
| Civil Service | 12 | draft (unrelated) |

### Side-by-side run (`scripts/debug-wie-dataflow.ts`)

| Path | includeDrafts | candidates | immediate | future | blocked |
|------|---------------|------------|-----------|--------|---------|
| Admin `matchWorkInEducation` | **true** | 30 | **3** | **5** | 3 |
| Admin `matchWorkInEducation` | **false** | **0** | 0 | 0 | 0 |
| `runWorkInEducationAssessment` | **true** | 30 | **3** | **5** | 3 |
| `runWorkInEducationAssessment` | **false** | **0** | 0 | 0 | 0 |
| `buildPublicWieAssessmentResult` (from assessment true) | — | — | available_now **3** | future_options **5** | requirements_needed **3** |

### Live public API (after fix)

`POST /api/career-assistant/work-in-my-education/assessment`

```json
{
  "status": "complete",
  "matched_direction": {
    "field": "Engineering",
    "specialism": "Civil Engineering",
    "confidence_label": "high"
  },
  "role_counts": {
    "immediate": 3,
    "realistic_next": 0,
    "future_progression": 5,
    "academic_or_research": 0,
    "blocked_or_needs_review": 3,
    "candidate_roles_considered": 30,
    "include_drafts": true
  },
  "lengths": {
    "available_now": 3,
    "realistic_next": 0,
    "future_options": 5,
    "academic": 0,
    "requirements": 3
  },
  "sample": [
    { "title": "Assistant Civil Engineer", "pathway_id": "561b3bf4-…" },
    { "title": "Structural Design Assistant (Civil)", "pathway_id": "1649a01c-…" },
    { "title": "Water / Wastewater Engineer (Graduate)", "pathway_id": "9b76d5ed-…" }
  ]
}
```

---

## 4. Wizard / matcher / renderer snapshots

### Wizard output (answers → profile)

```
subject: Civil Engineering
specialisation: null
education_level: bachelor
years_relevant_experience: 0
```

### Matcher output (grouped)

```
immediate: 3
realistic_next: 0
future_progression: 5
academic_or_research: 0
blocked_or_needs_review: 3
candidate_roles_considered: 30
include_drafts: true
```

### Renderer input (`PublicResultExperience`)

```
available_now.length = 3
realistic_next.length = 0
future_options.length = 5
academic_research.length = 0
requirements_needed.length = 3
```

Each non-empty item is a `PublicRoleCard` with `pathway_id` (= matcher `role_id`) for View pathway.

---

## 5. Root cause (why public looked “field/specialism only”)

1. Civil Engineering library roles are **100% draft**.
2. `loadRolesForSpecialisms({ includeDrafts: false })` queries `status = 'approved'` → **0 rows**.
3. Matcher still resolved field/specialism correctly → headline + confidence rendered.
4. All role buckets stayed `[]` → UI showed sections with “(0)”.
5. Admin test page sent `includeDrafts: true` → appeared “broken only on public CA”.

Earlier live log (before draft default):

```
available_now: 0, realistic_next: 0, future: 0, requirements: 0
field: Engineering, specialism: Civil Engineering
```

That was empty **matcher candidates**, not a CareerPathwayCard remapping bug.

Secondary footgun: wizard cached a previous empty `publicResult` via `lastRunKey` and could skip re-fetch after the API fix.

---

## 6. Fixes applied (no re-matching)

| Change | Purpose |
|--------|---------|
| Public assessment defaults `includeDrafts` **true** unless `WIE_PUBLIC_INCLUDE_DRAFTS` is explicitly false/0/no/off | Same library visibility as admin matcher |
| Wizard defaults `includeDrafts: true` in CA mode | Body aligns with admin behaviour |
| `mapMatcherRecommendationsToPublic` + fallback to `assessment.recommendations` | Exact grouped matcher pass-through (rename only) |
| Public `role_counts` from matcher meta | Debug visibility without internals dump |
| Skip wizard cache when role total is 0 | Prevent stale empty results after fixes |
| Renderer accepts matcher-key aliases | Safety if wrong shape is passed |

**Unchanged:** eligibility scoring, ranking, field resolution, assessment blueprint.

---

## 7. How to re-verify

1. Hard-refresh / clear session for Work in My Education (or Start again).
2. Complete Civil Engineering through public CA.
3. Expect Immediate ≈ 3, Future ≈ 5, Requirements ≈ 3 (draft library).
4. Server log should show `include_drafts: true`, `candidates: 30`.
5. Compare with `/admin/career-library/test-work-in-education` (include drafts on).

Diagnostic script: `npx tsx scripts/debug-wie-dataflow.ts`

---

## 8. Production note

When roles are approved for publish:

```env
WIE_PUBLIC_INCLUDE_DRAFTS=false
```

Until then, public KE must include drafts or every section stays empty.
