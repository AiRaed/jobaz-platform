# Work in My Education — Integration Batch 7

**Date:** 2026-08-03  
**Status:** Complete  
**Title:** Career Pathway Detail Experience — Knowledge-First Role Guidance  

---

## 1. Implementation summary

Batch 7 turns **View pathway** into a dedicated, refresh-safe Career Pathway Detail experience.

- Route: `/career-assistant/work-in-my-education/pathway/[roleId]`
- Data: Career Knowledge Library via existing pathway API/adapter only (no client Supabase, no LLM)
- Assessment match context preserved from results session for personalised “Your position” panel
- **Back to results** restores the existing public result handoff (no wizard restart)
- Matcher, assessment, scoring, wizard, and eligibility logic were **not** changed

---

## 2. Files created or changed

### Created

| Path | Purpose |
|------|---------|
| `lib/career-engine/pathway-knowledge/detail-types.ts` | Pathway detail contract |
| `lib/career-engine/pathway-knowledge/build-detail.ts` | Pure builders (status labels, match explanation, missing sections) |
| `lib/career-engine/pathway-knowledge/__tests__/run-batch-7-unit.ts` | Batch 7 unit tests |
| `app/career-assistant/work-in-my-education/pathway/[roleId]/page.tsx` | Dedicated pathway route |
| `components/career-engine/pathway/detail/*` | Modular UI (Hero, Eligibility, Overview, Requirements, Skills, Progression, Salary, Learning, Actions, DataNotice, Experience shell) |

### Updated

| Path | Change |
|------|--------|
| `lib/career-engine/pathway-knowledge/adapter.ts` | `loadPathwayDetailFromLibrary`, `fetchPathwayDetail`, progression `role_id`, salary missing copy |
| `lib/career-engine/pathway-knowledge/types.ts` | Progression roles may include `role_id` |
| `lib/career-engine/pathway-knowledge/index.ts` | Export detail APIs/types |
| `app/api/.../pathway/route.ts` | `?detail=1` returns `PathwayDetailResponse` (+ 404 when not found) |
| `components/career-engine/pathway/CareerPathwayCard.tsx` | View pathway → detail route + saves match context |
| `lib/.../wizard/session.ts` | Pathway match context + find role in result handoff |

---

## 3. API / data-contract changes

### `GET /api/career-assistant/work-in-my-education/pathway?id=<roleId>`

Unchanged Batch 6 behaviour: `{ pathway: CareerPathwayKnowledge }`

### `GET .../pathway?id=<roleId>&detail=1` (Batch 7)

Returns:

```ts
{
  detail: PathwayDetailResponse
  pathway: CareerPathwayKnowledge // convenience for clients that still expect pathway
}
```

`PathwayDetailResponse`:

- `found`
- `role` — id, title, field, specialism, stage, category, seniority, experience, registration, flags, library status
- `match` — optional assessment-derived explanation (never invents eligibility)
- `knowledge` — existing `CareerPathwayKnowledge` blocks (overview, skills, salary, progression, learning, …)
- `provenance` — source, missing sections, match context source
- `error_code` — `not_found` | `invalid_id` | …

Missing library fields stay **null / empty / `is_placeholder: true`** — never fabricated.

Optional query hints (`category`, `eligibility`, `score`, …) are display-only. Client session match context is preferred when opening from results.

---

## 4. Screens / routes

| Route | Role |
|-------|------|
| `/career-assistant/work-in-my-education/pathway/[roleId]` | Pathway detail (Batch 7) |
| `/career-assistant/work-in-my-education/result` | Results (Back to results target) |
| Existing result cards | **View pathway** navigates to detail URL |

Page sections:

1. Hero / role summary  
2. Your position on this path  
3. About this role  
4. Entry requirements  
5. Skills  
6. Career progression (library-linked roles)  
7. Salary (library only; no £0 / invented averages)  
8. Learning & qualifications (library only; no affiliates)  
9. JobAZ next actions (real routes; “Coming later” where needed)  
10. About this guidance  

---

## 5. Tests run and results

```
npx tsx lib/career-engine/pathway-knowledge/__tests__/run-batch-7-unit.ts
→ All Batch 7 unit tests passed. (12 cases)

npx tsx lib/career-engine/pathway-knowledge/__tests__/run-batch-6-unit.ts
→ All Batch 6 unit tests passed.
```

Coverage includes:

1. Civil Engineering immediate / Eligible now  
2. Chartered/future — blockers, not eligible now  
3. Nursing regulated — conditional + blockers  
4. Overseas Medicine — Needs review  
5. Broad Law safety — Good Match alone ≠ Eligible now  
6. Academic / research label  
7. Missing knowledge placeholders  
8. Unknown role → not_found  
9. Role row mapping  
10. Assessment session context without re-match  
11. No Supabase in pure builders  
12. Blockers not upgraded to eligible  

IDE diagnostics on touched pathway files: clean.

Live API smoke:

- Civil role `561b3bf4-…` → `found: true`, title Assistant Civil Engineer, stage Graduate Engineer, source partial  
- Unknown UUID → `404` / `not_found`

Production build: not run (large repo; not required to unblock Batch 7). Dev server served the new route/API successfully.

---

## 6. Missing Career Knowledge Library fields discovered

For Assistant Civil Engineer (typical draft enrichment):

| Section | Status |
|---------|--------|
| Overview / description | Partial (role fields present) |
| Structured responsibilities | Often placeholder |
| Salary | **Missing** (shows “Salary information has not yet been added.”) |
| Skills | **Missing** |
| Licences | **Missing** |
| Learning options | **Missing** (no affiliate fill-in) |
| Employers | **Missing** |
| Progression siblings | Present when other specialism roles exist |

No schema migration was added. Enrichment remains a library content task.

---

## 7. Manual test notes

### Civil Engineering — immediate role

1. Complete Work in My Education as Civil Engineering (0 years).  
2. Open an Immediate Opportunities card → **View pathway**.  
3. Expect URL `/career-assistant/work-in-my-education/pathway/<uuid>`.  
4. Hero shows role, Engineering / Civil Engineering, stage, match status.  
5. Refresh page → still loads (API by role id).  
6. **Back to results** → returns to saved results handoff.

### Civil Engineering — future / chartered-style role

1. From Future Progression bucket, open a senior/chartered-style role.  
2. Status must **not** read unrestricted “Eligible now”.  
3. Blockers / chartership / experience gaps remain visible in “Your position” and requirements.

### Nursing — regulated

1. Adult Nursing with/without NMC as appropriate.  
2. Regulated badge / registration requirements visible.  
3. Conditional or requirements-needed status is not upgraded to eligible now.

### Overseas Medicine — review

1. Overseas medicine profile → Needs review / recognition warnings.  
2. Page must not claim UK acceptance unless the library explicitly states it.

### Direct link / invalid id

1. Open a known role UUID in a new tab → loads library detail (match panel may be generic without session).  
2. Invalid UUID → friendly not-found, with restart / back links.

---

## 8. Safety / non-goals (confirmed)

- No LLM  
- No affiliate / marketplace course matching  
- No new CV / cover / interview / jobs / save backends  
- No matcher or wizard behaviour changes  
- Regulated / review / experience blockers remain explicit  
- Batch 8 not started  

---

## 9. Acceptance checklist

| Criterion | Status |
|-----------|--------|
| View pathway opens stable direct-link experience | Done |
| Refresh does not lose pathway | Done (role id URL + API) |
| Back to results preserves assessment | Done (session handoff) |
| Loads via pathway API/adapter | Done |
| Role / field / specialism / stage / status / match explanation | Done |
| Requirements & blockers clear | Done |
| Library sections render when present; missing is explicit | Done |
| JobAZ actions safe / real routes | Done |
| No LLM / no affiliates | Done |
| Matcher/wizard unchanged | Done |
| Regulated & review protected | Done |
