# Career Assistant — Eligibility & Match Scoring v2

**Date:** 2026-08-04  
**Status:** Complete  
**Scope:** Deterministic scoring + eligibility wording for Work in My Education results and Pathway Detail  

---

## Summary

Introduced a reusable **Eligibility & Match Scoring v2** layer that computes a transparent 0–100 score and canonical eligibility status from Career Knowledge Library fields + the user profile.

Primary bug fixed: match scores were stored as **0–100** but the UI treated them as **0–1**, so almost every card showed **Score 100%**.

Also fixed contradictory wording (e.g. “experience looks sufficient” with 0 years; registration “met” while chartership unconfirmed), duplicate status badges, and visible library placeholder copy.

---

## Files changed

### Core

| File | Change |
|------|--------|
| `lib/career-engine/evaluate-role-match.ts` | **New** — Scoring v2 evaluator |
| `lib/career-engine/__tests__/run-evaluate-role-match-v2.ts` | **New** — unit tests |
| `lib/career-engine/work-in-education/rank-roles.ts` | Delegates scoring/bucketing to v2 |
| `lib/career-engine/work-in-education/match.ts` | Passes field/specialism/stage into ranker |
| `lib/career-engine/work-in-education/types.ts` | `match_score` documented 0–100; optional `evaluation` |
| `lib/career-engine/work-in-education/wizard/explain-why.ts` | Prefers v2 `whyItems` (contradiction-free) |
| `lib/career-engine/work-in-education/wizard/labels.ts` | Status / section titles aligned to v2 |
| `lib/career-engine/work-in-education/public-contract.ts` | Cards consume v2 status, score, reasons |

### UI

| File | Change |
|------|--------|
| `components/career-engine/pathway/CareerPathwayCard.tsx` | Correct % score; single main status badge |
| `components/career-engine/pathway/detail/PathwayHero.tsx` | Same score scale; remove duplicate bucket badge |
| `components/.../PublicResultExperience.tsx` | Developing Matches / Future Career Options / Requirements / Review |
| `components/.../PathwayOverview.tsx` | Hide empty / placeholder sections |
| `components/.../PathwaySkills.tsx` | Hide when no library skills |
| `components/.../PathwayExpandPanel.tsx` | Skip placeholder sentences |
| `lib/.../pathway-knowledge/placeholders.ts` | Empty blocks without “coming soon” spam |
| `lib/.../pathway-knowledge/adapter.ts` | No “structured responsibilities will be added later” |
| `lib/.../pathway-knowledge/build-detail.ts` | Status label mapping for new wording |

### Tests updated

- `wizard/__tests__/run-batch-4-unit.ts`
- `pathway-knowledge/__tests__/run-batch-6-unit.ts`
- `scripts/debug-wie-dataflow.ts` (score samples)

---

## Scoring formula

| Category | Max points |
|----------|------------|
| Specialism / field relevance | 30 |
| Qualification level | 20 |
| Relevant experience | 25 |
| Career stage / seniority | 15 |
| Registration / licence readiness | 10 |
| **Total** | **100** |

### Hard caps (after weighted sum)

| Condition | Max score |
|-----------|-----------|
| Mandatory registration/licence missing | 69 |
| Mandatory qualification missing | 49 |
| Senior/principal/leadership + major experience gap | 49 |
| Manual-review regulated unresolved | 69 |
| Any unmet requirements or warnings | &lt; 100 (capped ≤99) |
| Perfect 100 only if every category full **and** no unmet/warnings | — |

Field relevance alone cannot produce 100.

### Registration normalisation (backward compatible)

| Library values | Kind |
|----------------|------|
| `required`, `mandatory`, `must` | required |
| `desirable`, `preferred`, `commonly_expected` | desirable |
| `none`, `not_required`, empty | not_required |
| Unrecognised / `unknown` | unknown (regulated → required) |

“Professional registration requirements appear met” is emitted **only** when registration is required (or confirmed desirable hold) **and** the user has explicitly confirmed the correct registration.

---

## Status / group mapping

| `eligibilityStatus` | Display | `resultGroup` | Results section |
|---------------------|---------|---------------|-----------------|
| `eligible_now` | Eligible now | `immediate` | Immediate Opportunities |
| `developing_match` | Developing match | `developing` | Developing Matches |
| `future_pathway` | Future career option | `future` | Future Career Options |
| `requirements_missing` | Requirements still needed | `blocked_or_review` | Requirements / Review |
| `needs_review` | Needs review | `blocked_or_review` | Requirements / Review |

Qualitative label (secondary, score-based):

- 85–100 Strong match  
- 70–84 Good match  
- 50–69 Developing match  
- &lt;50 Long-term / Requirements needed  

Cards show **one** primary status badge (eligibility). Pathway Detail uses the same evaluation conclusions from the shared public card / session context.

---

## Contradiction safeguards

Central `removeContradictions()` plus construction rules:

- Positives only from passed checks; unmet only from failed; warnings only from unknown/review.
- Never “experience looks sufficient” when experience is unmet or profile years are 0 against a min &gt; 0.
- Never “registration appear met” alongside chartership/registration unmet.
- Never `eligible_now` with unmet mandatory registration/qualification.
- Never score 100 with non-empty `unmetRequirements` or warnings.
- Site Engineer: do **not** auto-require Chartered status unless the role record explicitly requires it (title/note). Shared chartered stage models alone do not force that unmet.

---

## Test results

```
npx tsx lib/career-engine/__tests__/run-evaluate-role-match-v2.ts
→ All Scoring v2 unit tests passed. (10 scenarios + weights)

npx tsx .../run-batch-4-unit.ts → passed
npx tsx .../run-batch-6-unit.ts → passed
npx tsx .../run-batch-7-unit.ts → passed
npx tsx scripts/debug-wie-dataflow.ts → Civil Eng pipeline OK
```

IDE diagnostics on touched pathway/scoring files: clean.

---

## Before / after — Civil Engineering (0 years, BEng)

### Before

- Nearly all cards: **Score 100%** (UI 0–1 clamp bug).
- Possible “experience looks sufficient” on 0-year profiles.
- Duplicate badges (e.g. Future career option ×2).
- Placeholder library sentences visible.

### After (live matcher sample)

| Bucket | Example | Score | Status |
|--------|---------|-------|--------|
| Immediate | Assistant Civil Engineer | ~100 | eligible_now |
| Immediate | Site Engineer | 99 | eligible_now (warning: confirm level; not auto-Chartered) |
| Future | Asset Management Engineer | 51 | future_pathway |
| Future | Bridge Engineer | 51 | future_pathway |
| Developing / blocked | experience & registration gated roles | varied &lt;100 | developing / requirements / review |

Immediate entry roles with `minimum_experience_years = 0` can still score highly (correct). Roles needing experience or seniority move to Developing/Future with lower scores.

---

## Data records still needing admin review

- Many Civil Engineering roles remain **`draft`** with sparse metadata (skills, salary, structured responsibilities).
- Some roles may still sit on a **chartered stage model** while titled as entry/site roles — content owners should align `stage_id` / `seniority_level` / `minimum_experience_years` / `professional_registration_requirement` per role.
- `professional_registration_requirement` values should prefer the normalised set: `required` | `desirable` / `commonly_expected` | `none`.

No library rows were rewritten in this batch; normalisation is in code.

---

## Non-goals (honoured)

- No new career fields  
- No overall UI redesign  
- No course / affiliate connections  
- No LLM scoring  
- Matcher retrieval / wizard flow unchanged aside from scoring + presentation contract  
