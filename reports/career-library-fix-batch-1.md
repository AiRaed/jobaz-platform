# Career Knowledge Library — Fix Batch 1 Report

**Scope:** Structural blockers only (IT stage-model mismatches + Engineering legacy seed regression risk).  
**Date:** 2026-08-03  
**Full audit:** Not claimed resolved.

Source audits before fix: `reports/career-library-audit.json` / `.md` (pre-batch).  
Re-audit after fix: same paths (regenerated 2026-08-03T20:04:28.897Z).

---

## 1. Files changed

### Created
| File | Purpose |
|------|---------|
| `scripts/remap-it-skill-experience-stages.ts` | Idempotent IT role remap `experience_level` → `it_skill_experience` |
| `scripts/career-library-it/mapLegacyExperienceStage.ts` | Mapping rules (title, seniority, years, fit, category, legacy stage) |
| `scripts/career-library-engineering/refuseLegacyAcademicPopulate.ts` | Shared retirement guard |
| `scripts/career-library-engineering/legacy-archives/README.md` | Documents non-executable archives + canonical Eng path |
| `reports/it-stage-remap-batch-1.json` | Remap counts + ambiguous roles |
| `reports/career-library-fix-batch-1.md` | This report |

### Updated
| File | Change |
|------|--------|
| `scripts/populate-career-library-engineering.ts` | Removed `academic_level` fallback; canonical professional model only |
| `scripts/populate-career-library-it-technology-roles.ts` | Docs point at `it_skill_experience` + remap script |
| `scripts/career-library-it/packs-{software,data,infra,specialist}.ts` | Seed stage keys remapped to `it_skill_experience` keys |
| `scripts/audit-career-library.ts` | Ignores Engineering retirement stubs when scanning legacy seeds |
| Top-level Eng populate/backfill stubs (19 files) | Refuse to run; point at canonical path + archives |

### Archived (non-executable)
Moved then renamed under `scripts/career-library-engineering/legacy-archives/*.ts.archived.txt` (19 historical scripts). Not runnable via `tsx`/`node`.

---

## 2. Migrations / scripts created

No new Supabase migration (IT model `it_skill_experience` and Eng model `engineering_professional_route` already existed).

**Repair scripts:**
- `npx tsx scripts/remap-it-skill-experience-stages.ts` (`--dry-run` supported)
- Engineering retirement stubs + `refuseLegacyEngineeringAcademicPopulate`

**Canonical Engineering path (explicit):**
1. `npx tsx scripts/populate-career-library-engineering.ts`
2. `npx tsx scripts/remap-engineering-professional-stages.ts`
3. `npx tsx scripts/career-library-engineering/audit.ts`

---

## 3. IT roles remapped

| Metric | Count |
|--------|------:|
| IT roles inspected | 860 |
| Already on `it_skill_experience` | 101 |
| Remapped | 759 |
| Active still on `experience_level` after remap | **0** |
| Active orphan / wrong-model stage | **0** |
| Active on `it_skill_experience` after remap | **860** |

### Mapping counts (old → new)

| Legacy (`experience_level`) | New (`it_skill_experience`) | Count |
|-----------------------------|-----------------------------|------:|
| entry → entry_trainee | | 105 |
| junior → junior | | 108 |
| junior → entry_trainee | | 1 |
| mid_level → practitioner | | 125 |
| senior → senior | | 99 |
| senior → lead_principal | | 5 |
| senior → architect_specialist | | 10 |
| lead → lead_principal | | 74 |
| lead → architect_specialist | | 4 |
| architect → architect_specialist | | 75 |
| architect → lead_principal | | 1 |
| manager → manager_head | | 76 |
| manager → architect_specialist | | 2 |
| director → director_executive | | 59 |
| academic_research → academic_research | | 15 |

Preserved: role IDs, titles, specialism links, status, active flag. Metadata updated with `progression_model`, `legacy_experience_stage`, `remap_reason`, `remapped_at`.

Detail: `reports/it-stage-remap-batch-1.json`.

---

## 4. IT ambiguous roles

**138** roles flagged for optional manual review (mostly `mid_level` @ ~3 years → `practitioner`, plus a smaller set of title/legacy conflicts such as architect titles on non-architect legacy stages).

Full list (capped to 200 in JSON): `reports/it-stage-remap-batch-1.json` → `ambiguous`.

No DB roles were left unmapped; ambiguity is documentation for later quality passes, not a structural blocker.

---

## 5. Engineering legacy scripts found

Audit previously listed ~20 executable scripts encoding Degree / Master's / PhD as stages, including:

- `scripts/populate-career-library-*-engineering-roles.ts` (and related discipline packs)
- `scripts/populate-career-library-{architecture,quantity-surveying,marine-naval-renewable,materials-biomedical-nuclear,mining-railway-fire,structural-geotechnical-water}-roles.ts`
- `scripts/backfill-civil-engineering-role-eligibility.ts`
- `scripts/populate-career-library-engineering.ts` (had `academic_level` fallback)

---

## 6. Engineering scripts rewritten / retired / removed

| File | Previous risk | Action taken | Current canonical replacement |
|------|---------------|--------------|-------------------------------|
| `populate-career-library-aerospace-engineering-roles.ts` | Assigns Degree/Master's/PhD stages | **C** Retired stub (refuses) | Canonical Eng path + archive `.ts.archived.txt` |
| `populate-career-library-architecture-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-automotive-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-building-services-other-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-chemical-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-civil-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-electrical-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-electronic-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-environmental-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-industrial-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-marine-naval-renewable-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-materials-biomedical-nuclear-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-mechanical-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-mechatronics-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-mining-railway-fire-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-petroleum-engineering-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-quantity-surveying-roles.ts` | Same | **C** Retired stub | Same |
| `populate-career-library-structural-geotechnical-water-roles.ts` | Same | **C** Retired stub | Same |
| `backfill-civil-engineering-role-eligibility.ts` | Resolves stages via `academic_level` | **C** Retired stub | Same |
| `populate-career-library-engineering.ts` | Fallback to `academic_level` | **A** Rewritten — professional model only | Self (canonical step 1) |
| Archives under `legacy-archives/*.ts.archived.txt` | Historical bodies | **C** Non-executable text archives | README documents retention |

Verified: re-running a retired stub exits non-zero and writes nothing.

---

## 7. Code references updated

- No `package.json` scripts pointed at legacy Eng populates (none found).
- IT populate docs updated to `it_skill_experience` + remap.
- Audit scanner skips retirement stubs; reports `legacy_seed_scripts: []`.
- Codebase `.ts` search: no executable Eng populate still assigning Degree/Master's/PhD as stages (historical text only in `.archived.txt` + audit regex / comments).

---

## 8. Structural issues before and after

| Issue | Before | After |
|-------|--------|-------|
| IT roles on `experience_level` while specs on `it_skill_experience` | 759 active mismatches (audit sampled 40 as high) | **0** |
| IT pack seeds using legacy stage keys | Present (type errors / rerun risk) | Remapped to `it_skill_experience` keys |
| Engineering DB on professional route | Already clean (810 roles) | Still clean |
| Executable Eng Degree/Master's/PhD populates | ~20 | **0** |
| Orphan / invalid IT stage FKs (active) | Mismatched model IDs | **0** orphans |
| Duplicate roles created by this batch | — | **None** (remap updates only) |

---

## 9. Typecheck / test results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pre-existing errors remain in unrelated scripts (`export-knowledge`, `import-knowledge`, hospitality/logistics `roleFactory`, `verify-jaz-teaching-tutoring`). **No remaining errors under `career-library-it` / Eng remap / retirement stubs.** |
| IT verify | `scripts/career-library-it/verify-stage-model.ts` — all specialisms on `it_skill_experience`; legacy model inactive |
| Eng audit | `scripts/career-library-engineering/audit.ts` — 27 specs professional; 0 academic-keyed roles; field counts unchanged |
| IT remap idempotency | Second `--dry-run` after apply: already on model; no further remaps needed |
| Retired stub smoke | `populate-career-library-civil-engineering-roles.ts` refuses (exit 1) |
| Dedicated unit tests | None present for career-library stage remap |

---

## 10. Updated audit counts by severity

| Severity | Before (Batch 0 audit) | After Fix Batch 1 |
|----------|-----------------------:|------------------:|
| Critical | 40 | **40** |
| High | 89 | **48** |
| Medium | 131 | **131** |
| Low | 0 | **0** |

**Structural deltas:**
- `structure.stage_model_mismatch` (IT): cleared
- Legacy Engineering seed script finding: cleared (`legacy_seed_scripts: []`)
- Engineering refactor: `fully_clean: true`

Remaining criticals are healthcare registration pathway clarity (out of scope). Remaining highs are quality/stage-title heuristics, not IT/Eng model FK mismatches.

---

## 11. Confirmation — healthcare / general role-quality untouched

- Healthcare critical findings remain **40** (`registration.regulated_immediate_without_pathway_clarity`).
- Medium fit / PhD / academic findings unchanged at aggregate (**131** medium).
- No Assessment Blueprint, Report Rules, Learning Options, Qualification Recognition, or public Career Assistant changes.
- No intentional edits to healthcare packs, seeds, or roles.

---

## 12. Confirmation — previous Career Fields otherwise unchanged

Re-audit field role counts match prior library totals:

| Field | Specs | Roles | Stage model |
|-------|------:|------:|-------------|
| Engineering | 27 | 810 | `engineering_professional_route` |
| IT & Technology | 30 | 860 | `it_skill_experience` only |
| Healthcare | 20 | 509 | unchanged |
| Natural Sciences | 52 | 831 | unchanged |
| Business | 62 | 847 | unchanged |
| AFB | 99 | 817 | unchanged |
| Law | 56 | 530 | unchanged |
| Education | 20 | 155 | unchanged |
| Arts | 32 | 252 | unchanged |
| Languages | 21 | 252 | unchanged |
| HSS | 20 | 240 | unchanged |
| EAF | 36 | 432 | unchanged |
| Government | 93 | 1070 | unchanged |
| Hospitality | 89 | 1048 | unchanged |
| Logistics | 39 | 430 | unchanged |
| **Library total** | **696** | **9083** | — |

Only IT `stage_id` / metadata and Engineering script surfaces were intentionally modified.

---

## Stop condition

**Structural Fix Batch 1 complete.**  
Do not claim the full Career Knowledge Library audit is resolved. Next batches should address healthcare registration pathway clarity, fit/experience quality, duplicates, and cross-field boundaries.
