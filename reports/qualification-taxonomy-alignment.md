# Qualification Taxonomy Alignment

## Summary

Work in My Education now uses one shared qualification taxonomy for wizard input, profile storage, UK level normalisation, and eligibility / match scoring. Legacy `education_level` values still work via an adapter. No database migration required.

## Canonical taxonomy

**Module:** `lib/career-engine/qualification-taxonomy/`

### Groups
1. `no_formal` — No formal qualification  
2. `school` — School-level  
3. `college_vocational` — College / vocational  
4. `undergraduate` — Undergraduate  
5. `postgraduate` — Postgraduate  
6. `doctoral` — Doctoral  
7. `professional` — Professional qualification or licence  
8. `overseas` — Overseas qualification  
9. `other_unsure` — Other / unsure  

### Contextual sub-types
Examples: GCSE / A level; HNC / HND / Foundation Degree; Bachelor’s / Honours; PGCert / PGCE / PGDip / Master’s / Integrated Master’s (MEng); PhD; professional registration / statutory licence; overseas undergraduate / postgraduate + equivalence status.

### Normalized fields (additive on profile)
- `qualification_group`, `qualification_type`, `equivalence_status`
- Resolved `qualification`: `{ group, type, uk_level, kind, not_generic_masters, is_integrated_masters, equivalence_status, …, education_level_legacy }`
- Legacy `education_level` kept and derived from taxonomy

### UK levels
`entry` | `level_1`…`level_8` | `unknown` — never guessed when ambiguous (e.g. generic “Diploma”, legacy `college_or_diploma`).

| Type | UK level |
|------|----------|
| Bachelor’s / Honours | Level 6 |
| Master’s / Integrated Master’s / PGCE* | Level 7 |
| PhD | Level 8 |
| HNC | Level 4 |
| HND / Foundation Degree | Level 5 |

\*PGCE is Level 7 but **not** treated as a generic Master’s for `masters_relevant`.

## Old → new mapping

| Legacy value | Group | Type |
|--------------|-------|------|
| `college_or_diploma` / `college` | `college_vocational` | `other_vocational` (UK level **unknown**) |
| `bachelor` / `bachelors` | `undergraduate` | `bachelors` |
| `master` / `masters` | `postgraduate` | `masters` |
| `doctorate` / `phd` | `doctoral` | `phd` |
| `professional_qualification` / `professional` | `professional` | `other_professional` |
| `other` | `other_unsure` | `other` |
| `college_diploma` / `diploma_college` | `college_vocational` | `diploma` |
| `no_formal` | `no_formal` | `none` |
| `vocational` | `college_vocational` | `other_vocational` |
| `gcse_a_levels` | `school` | `a_level_l3` |

## Evaluator changes

- `qualificationSatisfiesAcademicRequirement()` uses **UK level + semantic kind + equivalence**, not the label “Bachelor’s/Master’s/PhD” alone.
- Professional registration / statutory licence **do not** satisfy academic degree requirements.
- PGCE does **not** satisfy `masters_relevant`.
- Overseas with `unsure` / `not_confirmed` equivalence → **review** (not auto UK-equivalent).
- `educationLevelRank('professional')` no longer equals bachelor (was incorrectly rank 2).
- Preferred API: `profileAcademicRank(profile)` via taxonomy.
- Wired into `evaluate-eligibility.ts` and `evaluate-role-match.ts`.

## Wizard UX

Step 1 asks “What type of qualification do you have?” then reveals contextual sub-options (and overseas equivalence when needed). Graduation status remains on the same step.

## Files changed

| Area | Paths |
|------|--------|
| Taxonomy | `lib/career-engine/qualification-taxonomy/*` |
| Profile / map / normalise | `types.ts`, `map-answers-to-profile.ts`, `normalise.ts`, `validate-answers.ts`, `blueprint.ts` |
| Eligibility / scoring | `evaluate-eligibility.ts`, `evaluate-role-match.ts` |
| Wizard | `QualificationTaxonomyStep.tsx`, `AssessmentWizard.tsx`, `wizard/steps.ts` |
| Admin harness | `TestWorkInEducationAssessmentPage.tsx` |
| Tests | `qualification-taxonomy/__tests__/run-taxonomy-unit.ts`, v2 profile helper update |
| Exports | `work-in-education/index.ts` |

## Tests completed

`npx tsx lib/career-engine/qualification-taxonomy/__tests__/run-taxonomy-unit.ts` — all 11 cases + Civil Engineering BEng manual check passed.

`npx tsx lib/career-engine/__tests__/run-evaluate-role-match-v2.ts` — all passed.

### Civil Engineering manual check
- BEng Civil Engineering, completed, UK, 0 years, no registration  
- Stored as: `undergraduate` / `bachelors` / UK **Level 6** / legacy `bachelor`

## Database migration

**None.** Additive answer/profile fields only; role `academic_requirement` CHECK unchanged.

## Out of scope (this batch)

- Course integration  
- Full Career Assistant UI redesign  
- Removing legacy compatibility  
