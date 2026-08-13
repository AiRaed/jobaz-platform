# Work in My Education — Integration Batch 4

**Date:** 2026-08-03  
**Status:** Complete  
**Scope:** Multi-step assessment wizard, clarification UX, result experience, temporary session, admin preview  
**Matcher:** Unchanged (Batch 1–3 engine remains source of truth)

---

## 1. Architecture

```
AssessmentWizard (UI)
  → per-step validation (client)
  → temporary sessionStorage session
  → POST /api/admin/.../assessment  (Batch 3 service)
  → ClarificationStep (if needs_clarification)
  → ResultExperience (user-facing cards + explain-why)
```

No matching logic was duplicated or modified. No LLM / OpenAI / Ollama.

Public-ready structure lives under reusable paths:

- `lib/career-engine/work-in-education/wizard/` — session, steps, labels, explain-why  
- `components/career-engine/work-in-education/wizard/` — UI components  

Admin-only host: `/admin/career-library/test-work-in-education-wizard`  
(Not wired to public Career Assistant.)

---

## 2. Wizard flow

| Step | Content | Conditional |
|------|---------|-------------|
| 1 Education | Level, graduation status, year | Always |
| 2 Qualification | Title, subject, specialisation, country | Always |
| 3 Experience | Years, job title, UK experience, skills | Always |
| 4 Registration | NMC/GMC/QTS/Eng + overseas recognition | Nursing, Medicine, Engineering, Teaching, non-UK |
| 5 Preferences | Related field / retraining / academic | Always |
| 6 Clarification | Allowed specialism options only | When matcher returns `needs_clarification` |
| 7 Results | Headline, confidence, role cards, next actions | After complete match |

**Law:** registration step skipped (specialism clarification handles breadth).  
**Matcher runs once** after the last answer step (and again only after clarification selection).

---

## 3. Components

| Component | Role |
|-----------|------|
| `AssessmentWizard` | Orchestrates steps, session, API, navigation |
| `ProgressBar` | Mobile-friendly progress + ARIA |
| `QuestionCard` | Step shell |
| `OptionCard` | Large radio options |
| `RegistrationStep` | Field-aware registration questions |
| `ClarificationStep` | Allowed options only (no free text) |
| `ResultHeader` | Match headline + confidence |
| `RecommendationCard` | Role card with explain-why |
| `NextActionCard` | Friendly next actions |
| `WarningCard` | Validation / soft warnings |
| `ResultExperience` | Full result page with lazy secondary sections |

---

## 4. Conditional logic

Uses existing assessment heuristics (`answerSuggestsNursing/Medicine/Law/Engineering/Teaching`, `isNonUkCountry`):

- Nursing → NMC + status + branch  
- Medicine → GMC-style registration + overseas recognition when non-UK  
- Engineering → optional CEng/IEng/EngTech  
- Teaching → QTS  
- Law → skip registration; clarification when broad  

---

## 5. Clarification flow

1. Engine returns `needs_clarification` + options  
2. Wizard shows “We need one more detail” with radio options  
3. User selects one allowed `specialism_id`  
4. Same assessment API re-runs with `clarification_answers`  
5. Results shown  

Arbitrary free-text specialisms are not accepted.

---

## 6. Result page

- Headline: “Your qualification matches: {specialism/field}”  
- Confidence: High / Medium / Needs clarification  
- Sections: Immediate Opportunities, Realistic Next Step, Future Progression (lazy), Academic (lazy), Requirements Still Needed (lazy)  
- Next actions from Batch 3 presenter  
- Role cards: title, field, specialism, eligibility badge, stage, match strength, why-list, requirements  
- No JSON / IDs / internal diagnostics in the primary UI  

### User-friendly language

| Internal | Shown |
|----------|--------|
| `immediate` | Good Match / Immediate Opportunities |
| `future_progression` | Future Career Option / Future Progression |
| `blocked_*` | Requirements Still Needed |
| `effective_fit` | Hidden; badge uses friendly labels |

### Explain why

`buildRoleWhyItems()` derives ✔️ / gap / warning lines from eligibility flags, gaps, demotion reasons — deterministic only.

---

## 7. Session (temporary)

`sessionStorage` key `jobaz.wie.assessment.wizard.v1`:

- answers, current step, selected clarification id, blueprint version  
- Restored on refresh  
- Cleared on “Start over”  
- **Not** permanently saved to DB / user accounts  

---

## 8. Admin preview

**Route:** `/admin/career-library/test-work-in-education-wizard`  

Presets: Civil Engineering, Animation MSc, Broad LLB, Overseas Medicine, Adult Nursing, Teaching PGCE.

Kept unchanged:

- `/admin/career-library/test-work-in-education` (raw matcher)  
- `/admin/career-library/test-work-in-education-assessment` (Batch 3 form)  

Career Library header links to all three.

---

## 9. Accessibility

- Progressbar ARIA values  
- Fieldset/legend + labelled inputs  
- Focus moves to step heading on navigation  
- Large tap targets (min ~44px controls)  
- Keyboard-operable radios and buttons  
- `role="alert"` for validation errors  

---

## 10. Performance

- Matcher invoked only after final answer step and after clarification  
- Duplicate identical request short-circuited in-session  
- Future / academic / blocked sections lazy-expanded  
- No client-side Career Library dump  

---

## 11. Tests

`npx tsx lib/career-engine/work-in-education/wizard/__tests__/run-batch-4-unit.ts`

| Check | Result |
|-------|--------|
| Civil Engineering registration step | Pass |
| Animation skips registration | Pass |
| Law skips registration | Pass |
| Nursing branch validation | Pass |
| Medicine overseas recognition | Pass |
| Teaching QTS step | Pass |
| Missing answers blocked | Pass |
| Friendly labels | Pass |
| Explain-why | Pass |
| Session contract / refresh recovery shape | Pass |
| Back/Next step order | Pass |

Matcher regressions not re-run as matcher was not changed; Batch 3 API reused as-is.

---

## 12. Known limitations

- Admin-only (not public Career Assistant)  
- Uses draft-including admin API  
- Session is tab-scoped (`sessionStorage`) only  
- No course / job / CV integrations  
- Secondary result sections start collapsed (by design)  
- Teaching/Medicine registration UX is simplified (deterministic prompts, not full regulator forms)  

---

## 13. Confirmation

- Matching engine unchanged  
- No OpenAI / Ollama  
- No public release  
- Old diagnostic pages retained  

---

## 14. Recommended Batch 5

1. Feature-flagged public Career Assistant entry into `AssessmentWizard` (same components)  
2. Public API route with stricter rate limits / no draft roles  
3. Optional account save of non-sensitive summary (not registration numbers)  
4. Qualification recognition deep links from next actions  
5. Course recommendations only after recognition/registration gaps are productised  
6. Polish copy / motion for production brand system  

**Stop after Integration Batch 4.**
