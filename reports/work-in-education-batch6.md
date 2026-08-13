# Work in My Education — Batch 6

**Date:** 2026-08-03  
**Status:** Complete  
**Scope:** Connect result cards to Career Knowledge Engine (enrichment only)

## Constraints respected

- Assessment logic unchanged  
- Scoring unchanged  
- Matching unchanged  
- Wizard flow unchanged  
- No AI / OpenAI / Ollama  

---

## Goal

Every recommended role is a **gateway** into the Career Knowledge Library via an expandable pathway card.

---

## Deliverables

### `CareerPathwayCard`

`components/career-engine/pathway/CareerPathwayCard.tsx`

Shows:

- Role title, field, specialism, stage, eligibility, score  
- Deterministic **Why this role matches** (from matcher metadata via existing `buildRoleWhyItems`)  
- **View pathway** expands library enrichment  
- Action row: Prepare CV · Cover Letter · Interview Coach · View Courses · Save Pathway  

### Knowledge adapter

`lib/career-engine/pathway-knowledge/`

| Module | Role |
|--------|------|
| `types.ts` | UI contract (`CareerPathwayKnowledge`, `PathwayMatchSummary`) |
| `placeholders.ts` | Graceful empty states |
| `from-match.ts` | Match summary from eligibility / public card (no LLM) |
| `adapter.ts` | Supabase library loader + HTTP client adapter |

Assessment code does **not** import storage details. UI loads knowledge through the adapter.

### Expandable panel

`PathwayExpandPanel` sections:

About · Responsibilities · UK salary · Progression · Qualifications · Registrations · Licences · Courses · Required skills · Transferable skills · Employers · Next progression roles  

Missing library fields → italic placeholders (no errors).

### Public API

`GET /api/career-assistant/work-in-my-education/pathway?id=<role_uuid>`

- Feature-flag gated  
- Rate limited  
- Service-role library read  
- Returns adapter-shaped JSON only  

### Wiring (results only)

- `RecommendationCard` → `CareerPathwayCard`  
- `PublicResultExperience` → `CareerPathwayCard`  
- Public cards now include `pathway_id` + `match_score` for enrichment lookup  

---

## Architecture

```
Matcher RoleEligibilityResult / PublicRoleCard
  → PathwayMatchSummary (deterministic why)
  → CareerPathwayCard
       ↓ on "View pathway"
  CareerPathwayKnowledgeAdapter
       ↓
  Career Knowledge Library (Supabase)
       ↓ missing fields
  Placeholders
```

Future: swap adapter implementation for CMS / affiliate courses / AI explanations without changing the card UI.

---

## Library coverage (honest)

| Section | Source today |
|---------|----------------|
| About | `description`, eligibility note, category, seniority |
| Qualifications | academic + experience requirement fields |
| Registrations | registration/membership enums + specialism body |
| Progression roles | sibling roles in same specialism |
| Courses | `career_library_learning_options` when present |
| Salary / skills / employers / structured responsibilities | mostly placeholders until library enrichment / metadata |

---

## Actions

| Button | Target |
|--------|--------|
| Prepare my CV | `/cv-builder-v2?role=…` |
| Create Cover Letter | `/cover-letter?role=…` |
| Interview Coach | `/interview-coach?role=…` |
| View Courses | `/courses` |
| Save Pathway | `sessionStorage` list (temporary) |

---

## Tests

`npx tsx lib/career-engine/pathway-knowledge/__tests__/run-batch-6-unit.ts`

- Placeholder knowledge  
- Deterministic why from eligibility  
- Public card → match summary  

---

## Known limitations

- Rich salary/skills/employer content still sparse in library  
- Save Pathway is session-only  
- Course affiliate deep-links not implemented  
- Pathway API requires knowledge-engine feature flag  

## Recommended next

1. Admin CMS fields for salary / skills / employers / responsibilities  
2. Wire learning options CRUD → recommended courses  
3. Persist saved pathways for authenticated users  
4. Optional AI explanation layer **behind** the same adapter interface  

**Stop after Batch 6.**
