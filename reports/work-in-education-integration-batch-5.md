# Work in My Education — Integration Batch 5

**Date:** 2026-08-03  
**Status:** Complete  
**Scope:** Feature-flagged Career Assistant integration, public-safe API, result handoff, legacy fallback  
## Production flag (updated after routing fix)

- **Production (NODE_ENV=production):** OFF when unset; ON only if env `=true`
- **Local development:** ON when unset (so Career Assistant → Work in My Education launches the Batch 4 wizard without a missing `.env` entry)
- Explicit `=false` always forces legacy (including local)
- `.env.local` may set `CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1=true` for clarity
- `?legacy=1` still forces the classic questionnaire

---

## 1. Existing Career Assistant architecture discovered

| Area | Finding |
|------|---------|
| Public entry | `/uk-career-assistant` (alias `/career-assistant`) |
| Goal selection | `cb_user_goal` in `lib/career-brain/userGoal.ts` |
| WIE redirect | `work_in_education` → `/career-engine/work-in-education` via `pathRegistry` |
| **Legacy WIE** | Conversation UI → `POST /api/career-engine/education-path` → JAZ/education result (LLM attach possible) |
| **Knowledge engine (Batches 1–4)** | Admin-only until this batch; `AssessmentWizard` + admin assessment API; **no LLM** |
| Other pathways | Unchanged (`work-in-experience`, `start-new-career`, `grow-career`, `extra-income`, `start-business`) |
| Feature flags | Env helpers (e.g. `CAREER_BRAIN_ENABLED`); no LaunchDarkly |
| Rate limiting | None previously; Batch 5 adds in-memory limiter for public WIE API |
| Sessions | Guest localStorage CA snapshots; Career Engine path localStorage; wizard `sessionStorage` |

---

## 2. Feature flag implementation

**Name:** `CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1`  

**Module:** `lib/career-engine/work-in-education/feature-flag.ts`

| Source | Behaviour |
|--------|-----------|
| Env `=true` | Knowledge engine on for everyone |
| Default / unset / false | **Off** (legacy) |
| Admin + cookie `jobaz_wie_v1=1` | Override on (via test-mode route) |
| Admin + `?wie_v1=1` | Page may show KE if admin; API requires cookie from test-mode |
| Public `?wie_v1=1` | **Ignored** (cannot self-enable) |

Documented in `.env.example`.

---

## 3. Route integration

```
Career Assistant → Work in my Education
  → /career-engine/work-in-education
       ├─ flag OFF or ?legacy=1 → WorkInEducationLegacyClient (unchanged conversation)
       └─ flag ON / admin override → AssessmentWizard (career_assistant mode)
            → POST /api/career-assistant/work-in-my-education/assessment
            → clarification in-wizard if needed
            → /career-assistant/work-in-my-education/result
```

Admin test entry:  
`/api/career-assistant/work-in-my-education/test-mode` (admin auth → sets cookie → redirects)

Linked from Career Knowledge Library admin header.

---

## 4. Components reused / refactored

**Reused (Batch 4):** `AssessmentWizard`, steps, cards, clarification, progress.

**Extended props:**

- `mode: "admin_preview" | "career_assistant"`
- `onComplete`, `onExit`, `sessionKey`, `resultHref`, `showInternalDiagnostics`, `compact`, `initialAnswers`

**New:**

- `PublicResultExperience` — public-safe result UI  
- `WorkInEducationKnowledgeEngineClient` — CA-branded host (`UkCareerBackground`)  
- `WorkInEducationLegacyClient` — extracted legacy page (preserved)

Admin wizard preview remains; diagnostics only in `admin_preview`.

---

## 5. Public API contract

`POST /api/career-assistant/work-in-my-education/assessment`

- Feature-flag gated  
- Rate limited  
- `includeDrafts: false` always  
- No OpenAI/Ollama  
- Returns filtered `PublicWieAssessmentResult` (not raw matcher JSON)  
- Debug trace only for admin + explicit `debug` in local/dev  

`GET /api/career-assistant/work-in-my-education/result?token=…` — hydrate signed token  

Admin APIs unchanged and still admin-only.

---

## 6. Result-token / session mechanism

- HMAC-signed token (`result-token.ts`), ~2h TTL, unguessable nonce  
- No answers in URL  
- Client handoff: `sessionStorage` key `jobaz.wie.public.result_v1`  
- Wizard answers: separate CA session key `jobaz.wie.assessment.wizard.ca.v1`  
- No permanent DB persistence in this batch  

---

## 7. Clarification integration

- Stays inside wizard (no full restart)  
- Options limited to max 8 (`limitClarificationOptions`) with Law priority boosts  
- “Something else / not sure” returns user to qualification step (not accepted as specialism ID)  
- Forced IDs still validated by matcher  

---

## 8. Result page

`/career-assistant/work-in-my-education/result`

Shows: matched direction, confidence, next actions, Available Now, Realistic Next Step, lazy Future / Academic / Requirements, Start again, Return to Career Assistant.  
Expired/missing token → friendly restart + classic-flow link.

---

## 9. Legacy fallback

- Flag off → legacy only  
- `?legacy=1` forces classic even when flag on  
- API/UI errors offer Retry + “Use classic flow”  
- Legacy files/APIs **not deleted**  

---

## 10. Anonymous / authenticated

- Both can complete assessment when flag on  
- No forced login before results  
- No new profile persistence  

---

## 11. Security controls

| Control | Status |
|---------|--------|
| Admin assessment/match APIs remain admin-only | Yes |
| Public API filtered contract | Yes |
| Service role server-only | Yes |
| Clarification IDs validated | Yes (existing matcher) |
| Result token signed + expiring | Yes |
| Rate limiting | Yes (per-instance) |
| No answers in query params | Yes |
| No sensitive answer logs | Yes |
| Public cannot enable via query | Yes |

---

## 12. Accessibility

Inherited Batch 4 patterns (labels, fieldsets, focus on step heading, progress ARIA, alerts). Result page uses semantic headings and large tap targets.

---

## 13. Performance

- Matcher server-side only; no full library in browser  
- AbortController cancels stale requests  
- Duplicate identical runs short-circuited  
- Lazy result sections  
- Public path never loads drafts  

---

## 14. Test results

`npx tsx lib/career-engine/work-in-education/__tests__/run-batch-5-unit.ts` — **pass**

- Flag default off + admin override / public query blocked  
- Clarification limit  
- Token mint/verify  
- Public contract strips role UUIDs + draft warnings  
- Rate limit  

Batch 4 wizard unit tests — **pass** (regression).

Manual scenarios A–M: covered by architecture (flag off = legacy; test-mode for admin/local; public contract + token expiry UI; other pathways untouched). Full DB path scenarios reuse Batch 3 matcher (unchanged).

---

## 15. Known limitations

- In-memory rate limit is per server instance  
- Token secret falls back to service role key if `WIE_RESULT_TOKEN_SECRET` unset  
- Admin page enable via `?wie_v1=1` alone does not set API cookie — use **test-mode** link  
- Not production-enabled  
- No course/job/CV integrations  

---

## 16. Rollback instructions

1. Ensure `CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1` is unset or `false`.  
2. Clear cookie `jobaz_wie_v1` if set.  
3. Users hit legacy conversation at `/career-engine/work-in-education`.  
4. Optional: `?legacy=1` while testing KE.

No destructive migrations; no prompt deletions.

---

## 17. Confirmation — production feature remains disabled

Default evaluation is **false**. Production remains on the **legacy** Work in My Education conversation unless the env flag is explicitly enabled.

---

## 18. Recommendation for Batch 6

1. Shared/redis rate limiting for multi-instance deploys  
2. Optional authenticated save of **non-sensitive** public result summary  
3. Course / recognition deep links from next actions  
4. Brand polish + motion under production design system  
5. Controlled staging enablement checklist before any production flag flip  
6. Work in My Experience knowledge-engine path (separate flag)

**Stop after Integration Batch 5.**
