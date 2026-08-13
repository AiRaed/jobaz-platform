# Correction: Work in My Education — Library-Driven

## Verdict

Work in My Education now follows **Field → Specialism → Stage → Results** using the Career Knowledge Library as the only source of field/specialism/stage/role options. The qualification-group first step no longer controls this flow.

## Library tables / relations reused

```
career_library_fields
  └── career_library_specialisms.field_id
        ├── career_library_specialisms.stage_model_id
        │     └── career_library_stage_models
        │           └── career_library_stages.stage_model_id
        │                 (filtered by specialism.disabled_stage_keys)
        └── career_library_roles.specialism_id
              └── career_library_roles.stage_id → career_library_stages.id
```

Same graph as `/admin/career-library` and role filters. Adding/editing fields, specialisms, stages, or roles in admin changes this flow without frontend code changes.

## Query flow

1. `GET …/library/fields` — active fields (`active`, not `disabled`), `sort_order`
2. `GET …/library/specialisms?field_id=` — active specialisms for that field
3. `GET …/library/stages?specialism_id=` — active stages on the specialism’s stage model, minus `disabled_stage_keys`
4. `POST …/library/match` `{ field_id, specialism_id, stage_id }` — roles for specialism+stage (+ other stages as future), scored via existing eligibility + Scoring v2

Dependent reset: changing field clears specialism+stage; changing specialism clears stage.

Empty library: admin gets a data/admin message; public gets a safe unavailable message — no invented fallback options.

## Hard-coded flows removed from WIE product path

| Removed from product flow | Status |
|---------------------------|--------|
| Qualification group step (`No formal` / `Undergraduate` / …) | Not used by CA WIE client |
| Hard-coded education level option arrays in WIE journey | Replaced by `LibraryPathWizard` |
| NLP subject → field resolution for this journey | Fixed library IDs |

`lib/career-engine/qualification-taxonomy/` remains for other/legacy assessment mapping but **does not control** the Work in My Education Career Assistant journey.

Legacy `AssessmentWizard` + assessment form remain available under admin diagnostics only.

## Files changed / added

| Area | Paths |
|------|--------|
| Browse loaders | `lib/career-engine/work-in-education/library-browse.ts` |
| Match | `lib/career-engine/work-in-education/match-library-path.ts` |
| Public result adapter | `lib/career-engine/work-in-education/assessment/from-library-match.ts` |
| APIs | `app/api/.../library/{fields,specialisms,stages,match}/route.ts` |
| Wizard | `components/.../wizard/LibraryPathWizard.tsx` |
| CA entry | `WorkInEducationKnowledgeEngineClient.tsx` → `LibraryPathWizard` |
| Admin preview | `TestWorkInEducationWizardPage.tsx` |
| Tests | `lib/.../__tests__/run-library-path-unit.ts` |
| Exports | `work-in-education/index.ts`, `wizard/index.ts` |

## Test results

**Unit:** `npx tsx lib/career-engine/work-in-education/__tests__/run-library-path-unit.ts` — passed  
(no hard-coded options; client uses LibraryPathWizard; dependent clear; disabled keys; no taxonomy step)

**Live API (local):**
1. **Civil Engineering** — Field `Engineering` → Specialism `Civil Engineering` → stages from library including Foundation / Apprentice / Graduate Engineer / Chartered / … / Academic. Match returns roles for Graduate Engineer.
2. **Animation** — Field `Arts, Media & Creative Industries` → Specialism `Animation` → only Animation-linked creative stage model labels (Foundation / Creative Support, Graduate / Creative Entry, …).
3. Dependent clear — covered in unit test.
4. Disabled records — inactive/`disabled` filtered in loaders; `disabled_stage_keys` applied.
5. Admin data — stages/fields come from DB queries; new admin stages appear without frontend edits (acceptance via shared loaders).

**Lint:** clean on new wizard/match files.  
**Typecheck:** no errors reported on new library-path files (repo has pre-existing unrelated tsc failures).

## Inconsistent library records (admin cleanup optional)

- Many roles remain `draft` — public match still includes drafts when `WIE_PUBLIC_INCLUDE_DRAFTS` defaults on (same as prior WIE behaviour).
- Some specialisms may lack `stage_model_id` — API returns empty stages with an admin hint.
- Role density varies by stage (Graduate Engineer may show more `realistic_next` than `immediate` when registration/experience soft-warnings apply).

## Out of scope (as requested)

- UK/overseas qualification questions  
- Language questions  
- Course integration  
- UI redesign  
- New qualification taxonomy / invented stages  
