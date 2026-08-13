# JobAZ MVP AI usage guard

**Date:** 13 August 2026  
**Goal:** Keep public CV / Cover / Writing / Interview pages open, but stop unlimited OpenAI spend.

No payment, no private-page change, no Career Assistant / My Plan / Jobs For You / Courses blocking.

---

## Limits

| Who | Rule |
| --- | --- |
| Guest | 1 AI action **per tool category** (lifetime for that browser cookie / IP+UA fingerprint) |
| Logged-in | 2 AI actions **per tool category per UTC day** |
| Admin | Unlimited |
| Apply Assistant | Logged-in only, **1 per day**. Guests blocked. |

Guest categories are independent: 1 CV AI + 1 Cover AI + 1 Writing AI + 1 Interview AI is allowed.

**CV Builder exception:** CV Builder limits are counted per AI action type, not as one global CV Builder bucket. `toolCategory` stays `cv_builder`; `actionName` is the specific tool (`cv_summary`, `cv_skills`, …). Cover Letter, Writing Review, Interview Coach, Apply Assistant, JAZ, and local AI still count by category only.

After guest limit (non-CV):  
`Create a free account to continue using AI tools.`

After guest repeats the **same CV action**:  
`Create a free account to continue using this AI tool.`

After logged-in daily limit (non-CV):  
`You’ve used today’s free AI limit for this tool. Try again tomorrow. Premium AI credits are coming soon.`

After logged-in exceeds the **same CV action** daily limit:  
`You’ve used today’s free AI limit for this CV tool. Try again tomorrow.`

Apply Assistant:  
`Apply Assistant is limited during the beta launch.`

Manual editing, preview, save, PDF/DOCX, and non-AI features stay available.

---

## How it is enforced

- Central helper: `lib/ai-usage/guard.ts` → `checkAiUsageLimit` / `enforceAiUsageLimit`
- **API routes** call the guard **before** an OpenAI call (mocks do not consume quota)
- HTTP **429** JSON:

```json
{
  "error": "AI_LIMIT_REACHED",
  "message": "...",
  "toolCategory": "cv_builder",
  "remaining": 0,
  "resetAt": "..."
}
```

Guest identity: httpOnly cookie `jobaz_ai_anon` + hashed IP+UA (no raw IP stored).  
Logged-in identity: Supabase auth user id.  
Admin: `isAdminUser(email)`.

Persistence: `ai_usage_events` (migration `supabase/migrations/20250813190000_ai_usage_events.sql`) via existing service-role client. If the table is not applied yet, an in-memory bucket still limits that server instance.

---

## Routes protected

### cv_builder (counted per `actionName`)

| Route | actionName |
| --- | --- |
| `/api/generate` | `cv_summary` |
| `/api/cv/ai-summary` | `cv_summary` |
| `/api/compare` | `cv_summary` |
| `/api/cv/skills-suggest` | `cv_skills` |
| `/api/cv/experience-bullets` | `cv_experience_bullets` |
| `/api/cv/improve-bullet` | `cv_improve_bullet` |
| `/api/cv/ai-tailor` | `cv_tailor` |
| `/api/cv/grammar-check` | `cv_grammar_check` |
| `/api/cv/fix-bullet-grammar` | `cv_grammar_check` |
| `/api/cv/check-skills-quality` | `cv_ats_check` |
| `/api/cv/check-bullet-quality` | `cv_quality_check` |
| `/api/cv/check-summary-quality` | `cv_quality_check` |
| `/api/cv/extract-role` | `cv_role_extract` |
| `/api/cv/improve-publication` | `cv_publication_improve` |

A guest can use each of these action types once (e.g. Summary + Skills + Experience Bullets + Grammar Check). Repeating the same action is blocked. Logged-in users get 2 uses **per action type** per UTC day. Manual edit / preview / save / PDF / DOCX are not gated.

### cover_letter
- `/api/cover`
- `/api/cover/generate`
- `/api/cover/rewrite`
- `/api/cover/compare`

### writing_review
- `/api/proofreading/ai-proofread`
- `/api/rewrite`

### interview_coach
- `/api/interview/evaluate`
- `/api/interview/evaluate-interview`
- `/api/interview/hard-mode`
- `/api/interview/memory-eval`
- `/api/interview/simulation-eval`
- `/api/interview/voice-train`
- `/api/transcribe`
- `/api/simulation-transcribe`

### apply_assistant
- `/api/apply-assistant` — login required, 1/day

### jaz_assistant (OpenAI widget / translate only)
- `/api/jaz`
- `/api/translate`

### local_ai (only when Ollama is down and OpenAI FAST would run)
- `/api/ai/local`

---

## Routes postponed (not OpenAI-costing or already gated)

- Career Assistant `/api/uk-career-assistant` — Ollama-only + rules
- My Plan `/api/jaz-plan/*` — fallback-first, no OpenAI
- Jobs For You / job search APIs
- Courses / Career Library match
- `/api/interview/generate-questions` — static templates
- `/api/cv/grammar` — non-LLM
- `/api/proofreading/analyze` — non-LLM
- `/api/cover/upsert` / `get-latest` — save/load only
- `/api/cv/upsert` / `get-latest` — save/load only
- Admin AI `/api/admin/ai/*` — admin-only already
- Avatar DALL·E — admin/dev
- Pulse moderate — rules

---

## UI

Friendly 429 handling added on the main public tool clients (CV Builder AI buttons, Cover Letter, Writing Review proofread, Interview Coach, Apply Assistant, JAZ widget). Pages stay public.

---

## Deploy note

Apply migration `20250813190000_ai_usage_events.sql` on Supabase so limits persist across Render instances. Until then, in-memory limits still reduce abuse on a single instance.

---

## Final cost-control recommendation

**Ship this guard for launch.** It stops unlimited public OpenAI use without hiding the marketing tools.

`npm run build` passed after these changes.

**13 August 2026 follow-up:** CV Builder limits are counted per AI action type, not as one global CV Builder bucket. Other tools unchanged.

Still true after launch:
- Apply the `ai_usage_events` migration before traffic.
- Do not rent Ollama yet (separate audit).
- Premium credits can wait; copy already says they are coming soon.
