# JobAZ AI provider current-state audit

**Date:** 13 August 2026  
**Scope:** Read-only inspection of the codebase. No code, env, or provider logic was changed.  
**Question this report answers:** What uses OpenAI vs Ollama, what happens if either is down, and do we need a remote Ollama server before Render launch?

---

## 1. Executive summary

### Is JobAZ currently safe to deploy without an Ollama server?

**Yes, for launch-critical user journeys — with caveats.**

Career Assistant, My Plan, library engines (Work in Education / Profession / Start New Career / Extra Income), Jobs For You, courses, and dashboard all have **rule/template fallbacks**. They do not hard-fail if Ollama is missing.

**Caveat (not a functional blocker, but a UX/config issue):**  
`OLLAMA_BASE_URL` defaults to `http://localhost:11434` whenever the env var is unset (`lib/jobaz-ai/providers/ollama.ts` → `getOllamaBaseUrl()`). Ollama is also treated as “configured” whenever that URL exists (`ollamaTextProvider.isConfigured()` is always true).  

In production on Render, **several paths will still try to reach localhost:11434** (5s health check) before falling back. Career Assistant Career Brain calls this on **every question turn**. Extra Income / Start New Career / Grow Career / Start Business / education-path attach JAZ analyse, which also probes Ollama first.

So: **safe to deploy without renting an Ollama server**, but expect **~5s extra latency per CA turn / JAZ analyse** unless `OLLAMA_BASE_URL` is pointed at a real host or Ollama is otherwise made unreachable quickly. There is **no `ENABLE_OLLAMA` kill switch** in code.

### Which launch-critical features depend on OpenAI?

**Required for quality, not for the core plan journey:**

| Feature | If OpenAI missing |
| --- | --- |
| CV Builder AI (summary, bullets, tailor, skills suggest, generate) | Mock / heuristic / “not configured” — form/save/PDF still work |
| Cover letter generate/rewrite/compare | Mock or error — editor still usable |
| Writing Review / AI proofread | Explicitly unavailable |
| Interview Coach eval / Whisper transcription | Mock transcript / mock scores |
| Apply Assistant (6 sequential quality calls) | 500 if no key |
| JAZ on-page assistant (`/api/jaz`) | Rule/fallback copy |
| Admin AI reports / Affiliate Scout | Admin-only; reports fail if neither provider configured |

**Not required for:** Career Assistant questions, My Plan generation, Jobs For You, course cards, login, dashboard plan cards.

### Which launch-critical features depend on Ollama?

**None as a hard dependency.** Ollama improves Career Assistant copy and JAZ analyse quality.

| Feature | If Ollama down |
| --- | --- |
| `/career-assistant` (UK Career Assistant + Career Brain, default ON) | Rules/templates continue; ~5s probe delay |
| JAZ Career Engine analyse | `jaz_fallback` templates |
| My Plan | `jaz_plan_fallback` (Ollama plan improve is **off** unless `JAZ_PLAN_OLLAMA_ENABLED=true`) |
| WIE / WIP / SNC / Extra Income **library** match | No AI — knowledge engine / DB rules |

### Which features have fallback if AI is unavailable?

- Career Assistant Career Brain: rules profile + rules recommendations + rule-based advisor messages  
- JAZ analyse: `buildFallbackBrainReasoning`  
- My Plan: `buildFallbackPlanActions` (default path)  
- Local dashboard/profile copy: rule-based text if `/api/ai/local` fails  
- CV quality checks / grammar: heuristic or “no issues”  
- Cover/CV generate: mock paragraph if `aiProvider.isConfigured()` is false — **but Ollama URL makes `isConfigured()` almost always true**, so mocks may **not** run; OpenAI-quality routes then **throw** if the key is missing  
- Pulse AI planner: template posts  
- Pulse moderate: rule-based  
- Messenger improve: rule-based (and `/api/ai/messenger/improve` does not exist)  
- Interview questions: static templates (no AI)  
- Email generate: template engine, not LLM  
- Jobs For You / course match / Learning Loop: no LLM

### Is there any production path that may call localhost:11434?

**Yes.** If `OLLAMA_BASE_URL` is unset, every Ollama health/generate uses `http://localhost:11434`.

Production callers include:

- `/api/uk-career-assistant` (also mounted as `/career-assistant`) — Career Brain extract + advisor dialogue **every turn**
- `/api/jaz-career/analyse` and `attachJazToCareerResult` (extra-income, start-new-career, education-path, experience-path, grow-career, start-business)
- `/api/ai/local`, `/api/ai/profile`
- Any `aiProvider.generateText` with `local` tier (CV health checks, etc.)
- `/api/jaz-career/ollama-health` and `/api/debug/ollama-test` — **blocked in production** unless `ALLOW_OLLAMA_DEBUG=true`

### Is there any feature that could silently create high OpenAI usage/cost?

**Yes — several.** Highest:

1. **Local-tier → OpenAI FAST fallback** when Ollama is down (`AI_PROVIDER_FALLBACK` defaults **true**). Features such as `weekly-plan`, `ai-coaching`, CV health/ATS/quality checks are **not** in `OLLAMA_ONLY_FEATURES`, so they spend `gpt-4o-mini` after a failed localhost probe.  
2. **`scheduleLocalAiProfileEnhancement`** fires after tool signals (CV save, job finder, proofreading, job details) — **2 parallel** `/api/ai/local` calls, no user “Generate AI” click. If Ollama is down and OpenAI is set → silent mini spend.  
3. **`/api/ai/local` has no auth** in the route. Anyone who can hit the app can trigger Ollama→OpenAI FAST.  
4. **Apply Assistant**: 6 sequential `gpt-4o` calls per POST; no auth visible.  
5. **CV tailor**: up to 4 quality calls per action.  
6. **Public-ish OpenAI routes** (`/api/generate`, `/api/jaz`, `/api/compare`, `/api/translate`, `/api/apply-assistant`, several `/api/cv/*`, `/api/cover/*`) — little/no auth, no global rate limit.

Career Assistant **does not** fall through to OpenAI (ollama-only + rules). That is the main cost-control already in place for CA.

### Is there any page/API that repeatedly calls AI without user action or admin approval?

| Path | Repeat? |
| --- | --- |
| Career Assistant each **user message** | Yes — extract (+ optional dialogue). User-triggered, not polling. |
| `scheduleLocalAiProfileEnhancement` after `emitAiSignal` | Automatic, fire-and-forget, not page-load polling |
| Dashboard page load | No dedicated “generate insights on every visit” route found; enhancement is signal-based |
| Admin AI overview / site-health GET | Metrics/health only — **no LLM** on load |
| Learning Loop / missing affiliates GET | Aggregation only — **no LLM** |
| Cron / background jobs | **None found** that generate AI text |
| Polling | JAZ UI polls job state; **not** an LLM poll. No `setInterval` LLM loops found |

---

## 2. AI provider usage table

**Router defaults** (`lib/jobaz-ai/providers/router.ts`, `base.ts`):

- Fast model: `OPENAI_MODEL` or `gpt-4o-mini`  
- Quality model: `OPENAI_MODEL_QUALITY` or `gpt-4o`  
- Ollama: `OLLAMA_BASE_URL` or `http://localhost:11434`; model `OLLAMA_MODEL` or `llama3`  
- Fallback chain: `local → fast → quality` except `OLLAMA_ONLY_FEATURES` (local only)  
- `AI_PROVIDER_FALLBACK` default **true**  
- `AI_PROVIDER_TIMEOUT_MS` default 60s; JAZ Ollama default **180s** (cap 240s)

| Feature / Page / API | File path(s) | User / admin | OpenAI | Ollama | Fallback | Trigger | Cost risk | If OPENAI_API_KEY missing | If Ollama unavailable | Production risk | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Career Assistant `/career-assistant` (= UK CA) | `app/career-assistant/page.tsx` → `app/uk-career-assistant/page.tsx`; `app/api/uk-career-assistant/route.ts`; `lib/career-brain/*`; `lib/jobaz-ai/engines/careerAdvisor/*` | User | No (blocked by `OLLAMA_ONLY_FEATURES`) | Yes (quality copy) | Yes — rules | User click / each message | None for OpenAI; latency if localhost probe | Uses Ollama or rules; `isConfigured()` still true via Ollama URL | Rules + ~5s `/api/tags` probe per call | needs config | `CAREER_BRAIN_ENABLED` default true. Extract on **every** turn. |
| JAZ Career Engine analyse | `lib/jaz-career-engine/analyseCareerGoal.ts`; `ollamaCareerClient.ts`; `app/api/jaz-career/analyse/route.ts` | User (via CA/engine) | No | Yes | Yes — `fallbackPlan.ts` | Form submit / path complete | none | Unchanged (never used OpenAI) | `jaz_fallback` after 5s probe | needs config | No auth on analyse route. `maxDuration` 240s. |
| Work in My Education library | `app/api/career-assistant/work-in-my-education/library/*`; `lib/career-engine/work-in-education/*` | User | No | No | N/A (rules) | Form submit | none | Works | Works | safe | Knowledge engine / Career Library. In-memory rate limit on assessment only. |
| WIE legacy education-path | `app/api/career-engine/education-path/route.ts` | User | No | Yes (JAZ attach) | Yes | Form submit | none | Works | jaz_fallback | needs config | Still probes Ollama via attach. |
| Work in My Profession | `app/api/career-assistant/work-in-my-profession/library/*` | User | No | No | N/A | Form submit | none | Works | Works | safe | Library match, no LLM. |
| Start New Career library | `app/api/career-assistant/start-new-career/library/*` | User | No | No | N/A | Form submit | none | Works | Works | safe | |
| Start New Career + JAZ | `app/api/career-engine/start-new-career/route.ts` | User | No | Yes | Yes | Form submit | none | Works | jaz_fallback | needs config | |
| Extra Income library | `app/api/career-assistant/extra-income/library/*`; `lib/career-engine/extra-income/decisionEngine.ts` | User | No | No | N/A | Form submit | none | Works | Works | safe | |
| Extra Income + JAZ | `app/api/career-engine/extra-income/route.ts` | User | No | Yes | Yes | Form submit | none | Works | jaz_fallback | needs config | |
| Grow Career / Start Business | `app/api/career-engine/grow-career/route.ts`; `start-business/route.ts` | User | No | Yes | Yes | Form submit | none | Works | jaz_fallback | needs config | |
| My Plan / Plan Engine | `lib/jaz-plan-engine/generatePlan.ts`; `app/api/jaz-plan/generate/route.ts` | User | No | Optional, **off** | Yes — default | Form submit / add to plan | none | Works | Works (Ollama skipped unless flag) | safe | `JAZ_PLAN_OLLAMA_ENABLED` default false. |
| Course matching / affiliates | `lib/jaz-career-engine/courseMatcher.ts`; `lib/recommendations/*` | User | No | No | N/A | After analyse | none | Works | Works | safe | Ollama never chooses Apply Now URLs. |
| Missing affiliates | `lib/jaz-career-engine/logging/status.ts`; Learning Loop | Admin read | No | No | N/A | Admin page load | none | Works | Works | safe | Aggregation, not generation. |
| Learning Loop | `lib/analytics/jazLearningLoop.ts` | Admin | No | No | N/A | Admin GET | none | Works | Works | safe | No LLM. |
| Jobs For You / Job Finder | `app/api/jobs/*`; `lib/jobs/*` | User | No | No | N/A | Search / page | none | Works | Works | safe | No AI in jobs libs. |
| CV Builder generate/summary | `app/api/generate/route.ts`; `app/api/cv/ai-summary/route.ts` | User | Yes quality | No (quality chain only) | Mock **only if** `isConfigured()` false | User click | medium | Mock **or** throw (see note) | Unused | risky | No auth on `/api/generate`. |
| CV bullets / skills / extract / tailor | `app/api/cv/experience-bullets`, `skills-suggest`, `extract-role`, `ai-tailor`, `improve-bullet`, `improve-publication` | User | Yes (fast or quality) | Possible for local-tier checks | Mock/heuristic if not configured | User click | medium–high (tailor = 4 calls) | Degraded | Local checks skip or FAST-fallback | risky | Little/no auth. |
| CV health / ATS / grammar | `app/api/cv/check-*`, `grammar-check`, `fix-bullet-grammar` | User | Yes if Ollama down (local→fast) | Yes first | Heuristic | User click | medium if Ollama down | Heuristic if both down | Falls to OpenAI FAST | risky | Silent cost if Ollama down + key set. |
| Cover letter | `app/api/cover/route.ts`, `generate`, `rewrite`, `compare` | User | Yes quality | No | Mock | User click | medium | Mock/error | Unused | needs config | |
| Writing Review | `app/api/proofreading/ai-proofread/route.ts` | User (auth) | Yes quality | No | Error  — unavailable | User click | medium | Explicit error | Unused | needs config | Auth required. |
| Interview Coach eval | `app/api/interview/evaluate*`, `hard-mode`, `memory-eval`, `simulation-eval`, `voice-train` | User | Yes quality + Whisper | No | Mock | User click | medium | Mock | Unused | needs config | Whisper is OpenAI-only. |
| Interview questions | `app/api/interview/generate-questions/route.ts` | User | No | No | Static | User click | none | Works | Works | safe | Templates. |
| Transcribe | `app/api/transcribe/route.ts`; `simulation-transcribe` | User | Whisper | No | Mock transcript | User click | low–medium | Mock | Unused | needs config | Direct OpenAI SDK. |
| Apply Assistant | `app/api/apply-assistant/route.ts` | User | Yes **6× gpt-4o** | No | 500 | User click | **high** | 500 | Unused | **risky** | No auth. Sequential completions. |
| Compare CVs | `app/api/compare/route.ts` | User | Yes quality direct | No | Mock | User click | medium | Mock | Unused | risky | Bypasses router. |
| Translate | `app/api/translate/route.ts` | User | Yes fast direct | No | Mock | User click | low | Mock | Unused | risky | Bypasses router. |
| JAZ page helper `/api/jaz` | `app/api/jaz/route.ts` | User | Yes fast direct | No | Fallback copy | User click | medium | Fallback | Unused | risky | Chat-like; no auth seen. |
| Local AI `/api/ai/local` | `app/api/ai/local/route.ts`; `runLocalFeature.ts` | User (unauth) | Yes if Ollama down | Yes first | 500 if both fail | Automatic + any POST | **high** if abused | Tries Ollama then OpenAI | OpenAI FAST | **risky** | **No auth.** |
| Profile AI `/api/ai/profile` | `app/api/ai/profile/route.ts` | User | No (only if Ollama up) | Yes | Rules text | User click | low | Rules | Rules | needs config | Does not OpenAI-fallback. |
| Profile enhancement | `lib/jobaz-ai/local/scheduleEnhancement.ts`; `updateUserProfile.ts` | User auto | Yes if Ollama down | Yes | Keep rule text | After tool signal | medium | Skip or FAST | FAST spend | risky | 2 calls; not page load. |
| Career assessment personalize | `lib/jobaz-ai/assessment/personalizeCareerAssessment.ts`; `app/api/ai/career-assessment/personalize` | User | Yes FAST fallback | Yes | Skip / rules | After assessment | low | Rules | OpenAI FAST | needs config | Copy only. |
| UK result personalize / follow-up | `personalizeUkResult.ts`; `followUpQuestions.ts`; `adaptiveQuestions.ts` | User | FAST fallback (personalize feature is ollama-only for UK CA keys) | Yes | Rules | After CA result | none–low | Rules | Rules for ollama-only | needs config | UK personalization feature is in `OLLAMA_ONLY_FEATURES`. |
| Admin AI reports | `lib/admin/ai/*.ts`; `app/api/admin/ai/generate/route.ts` | Admin | Yes quality | Possible if mapped local | Error if none | Admin action | medium | Fail if Ollama also down | OpenAI quality | needs config | `requireAdminApiUser`. |
| Affiliate Scout | `lib/admin/ai/affiliateScout.ts` | Admin | Yes | Possible | Error | Admin click | medium | Fail | OpenAI | needs config | Does not auto-run. |
| Admin site health / overview / metrics | `siteHealth.ts`; overview/metrics routes | Admin | Check only | Check only | N/A | Page load | none | Warning in health | Status “not_connected” | safe | No generation. |
| Email campaigns / recipient match | `app/api/admin/email-campaigns`; `app/api/email/generate` | Admin / user | No | No | Templates | Admin / form | none | Works | Works | safe | Template `generateEmail`, not LLM. |
| Pulse public | `app/api/ai/pulse/moderate` | User | No | No | Rules | Post | none | Works | Works | safe | |
| Pulse AI planner | `lib/pulse/aiPlanner.ts` | Admin | Yes | Possible | Templates | Admin action | low | Templates | Templates or OpenAI | needs config | |
| Relay | `app/api/relay` | — | No | No | — | — | none | Works | Works | safe | No AI usage found. |
| TTS | `app/api/tts/route.ts` | User | No | No | Error if no ElevenLabs | User click | n/a (ElevenLabs) | N/A | N/A | needs config | Not OpenAI/Ollama. |
| Avatar generate | `app/api/avatar/generate`; `download` | Admin-ish | DALL·E images | No | 500 | Admin click | medium | 500 | Unused | needs config | OpenAI images. |
| Debug Ollama / usage | `app/api/debug/ollama-test`; `ai-usage`; `jaz-career/ollama-health` | Dev | Possible | Yes | 403 in prod | Manual | low | — | — | safe | Gated unless `ALLOW_OLLAMA_DEBUG`. |
| Cron / background AI | — | — | No | No | — | — | none | — | — | safe | None found. |

**Note on `aiProvider.isConfigured()`:** it is true if **either** OpenAI key **or** Ollama base URL exists. Because Ollama URL always defaults, many “AI MOCK” branches **never run in production**. Quality-tier routes then hit OpenAI `isAvailable()` (false without key) and throw “No AI provider available”.

---

## 3. OpenAI usage detail

Models: **`gpt-4o-mini`** (fast), **`gpt-4o`** (quality), **`whisper-1`** (transcribe), **images.generate** (avatars). Timeout: `AI_PROVIDER_TIMEOUT_MS` default 60s via `withTimeout` on routed calls. Direct SDK routes often have **no explicit timeout**.

### 3.1 Routed via `aiProvider` (chat.completions)

| File | Function / route | Model tier | When | User vs auto | Stores result | Auth / rate limit | Timeout | Fallback | Repeat on refresh | Cost risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lib/jobaz-ai/providers/openai.ts` | `OpenAiTextProvider.generateText` | fast/quality | Any routed call | — | No | None at provider | Yes | Router chain | — | Central spend |
| `app/api/generate/route.ts` | `POST` | quality | Generate CV summary | Click | Client/DB via other routes | **No auth** | Router | Mock only if not configured | No | Medium — public |
| `app/api/cv/ai-summary/route.ts` | `POST` | quality | Summary button | Click | CV save separate | Not in first 100 lines | Router | Mock | No | Medium |
| `app/api/cv/experience-bullets/route.ts` | `POST` | quality | Bullets | Click | No | Weak | Router | Mock | No | Medium |
| `app/api/cv/ai-tailor/route.ts` | `POST` | quality × up to 4 | Tailor CV to job | Click | No | Weak | Router | Mock | No | **High** |
| `app/api/cv/skills-suggest/route.ts` | `POST` | quality | Suggest skills | Click | No | Weak | Router | Mock | No | Low–med |
| `app/api/cv/extract-role/route.ts` | `POST` | fast | Parse role | Click | No | Weak | Router | Mock | No | Low |
| `app/api/cv/improve-bullet/route.ts` | `POST` | fast | Improve bullet | Click | No | Weak | Router | Mock | No | Low |
| `app/api/cv/improve-publication/route.ts` | `POST` | quality | Publications | Click | No | Weak | Router | Mock | No | Low |
| `app/api/cv/check-bullet-quality` etc. | `POST` | **local** (→ FAST if Ollama down) | Quality panel | Click | No | Weak | Router | Heuristic | No | Medium if Ollama down |
| `app/api/cv/grammar-check/route.ts` | `POST` | local/fast map | Grammar | Click | No | Weak | Router | Empty issues | No | Medium if fallback |
| `app/api/cover/route.ts` `generate` `rewrite` `compare` | `POST` | quality | Cover actions | Click | Cover upsert separate | Mix | Router | Mock | No | Medium |
| `app/api/rewrite/route.ts` | `POST` | fast | Writing rewrite | Click | No | Weak | Router | Mock | No | Low |
| `app/api/proofreading/ai-proofread/route.ts` | `POST` | quality | AI proofread | Click | Project DB | **Auth** | Router | Error | No | Medium |
| `app/api/interview/*` eval/voice | `POST` | quality | Interview | Click | No | Weak | Router | Mock | No | Medium |
| `lib/admin/ai/generate.ts` | `runModel` / `generateAdminAiReport` | quality (`admin/ai-report`) | Report generate | Admin click | Optional persist | **Admin** | Router | Error | No | Medium |
| `lib/admin/ai/affiliateScout.ts` | `generateAffiliateScoutReport` | via generate | Scout | Admin click | Persist report | Admin | Router | Error | No | Medium |
| `lib/admin/ai/managerReport.ts` `marketingReport.ts` `supervisorReport.ts` `technicalReport.ts` `siteBrainAdvisor.ts` | `generate*` | quality | Admin tabs | Admin click | Optional | Admin | Router | Error | No | Medium |
| `lib/pulse/aiPlanner.ts` | suggestion generate | via provider | Admin Pulse AI | Admin | Draft | Admin path | Router | Templates | No | Low |
| `lib/jobaz-ai/local/runLocalFeature.ts` | `runLocalFeature` | local→fast→quality | Dashboard/local | Auto or POST | Profile patch | **`/api/ai/local` unauth** | 45s default | Caller catch | After signals | **High if abused / Ollama down** |
| `lib/jobaz-ai/assessment/personalizeCareerAssessment.ts` | personalize | local→FAST | After assessment | Submit | No | Route-dependent | Router | Rules | No | Low |
| `lib/career-brain/extractProfile.ts` | `extractCareerProfile` | **ollama-only** | Every CA turn | Message | In session state | CA API | 45s | Rules | Every message | **OpenAI: none** |
| `lib/career-brain/recommendations.ts` | `generateCareerRecommendations` | **ollama-only** | CA result | Result | Session | CA API | 60s | Rules | Once per result | OpenAI: none |
| `lib/jobaz-ai/engines/careerAdvisor/dialogue.ts` | `generateAdvisorTransition` | **ollama-only** | CA turn | Message | No | CA API | Router | Rules | Every message | OpenAI: none |
| `app/api/uk-career-assistant/route.ts` | `extractFromFreeText`; main generate; repair | **ollama-only** | Legacy PATH / free text | Message | Session | No auth seen | Router | `getFallbackResponse` | Every message | OpenAI: none; latency yes |

### 3.2 Direct OpenAI SDK (bypasses router / Ollama)

| File | Function | Model | When | Trigger | Stores | Auth | Timeout | Fallback | Repeat on load | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `app/api/apply-assistant/route.ts` | `POST` | `getOpenAiQualityModel()` × **6** | Apply helper | Click | No | **None** | SDK default | 500 | No | **High** |
| `app/api/compare/route.ts` | `POST` | quality | Compare | Click | No | None | SDK | Mock | No | Medium |
| `app/api/translate/route.ts` | `POST` | fast | Translate | Click | No | None | SDK | Mock | No | Low |
| `app/api/jaz/route.ts` | `POST` | fast | JAZ chat widget | Click | No | None | SDK | Copy fallback | No | Medium |
| `app/api/transcribe/route.ts` | Whisper | whisper | Audio | Click | No | Weak | SDK | Mock | No | Low–med |
| `app/api/simulation-transcribe/route.ts` | Whisper | whisper | Sim | Click | No | Weak | SDK | Mock | No | Low–med |
| `app/api/avatar/generate/route.ts` | `images.generate` | DALL·E | Avatar | Admin | File | Weak | SDK | 500 | No | Medium |
| `app/api/avatar/download/route.ts` | `images.generate` | DALL·E | Download | Admin | File | Weak | SDK | 500 | No | Medium |
| `scripts/generate-avatar.ts` | CLI | DALL·E | Manual | CLI | File | N/A | SDK | Throw | N/A | Dev only |

Whisper helper: `transcribeAudioWithOpenAi` in `lib/jobaz-ai/providers/openai.ts` — OpenAI only.

**No OpenAI Responses API usage found** (`responses.create` not used). Chat Completions only.

---

## 4. Ollama usage detail

**Hardcoded default URL:** `http://localhost:11434`  
**Model default:** `llama3`  
**Health check:** `GET {base}/api/tags` with **5s** timeout  
**Generate:** `POST {base}/api/generate` `stream: false`, optional `format: json`  
**`ENABLE_OLLAMA`:** **does not exist**

| File | Function | Base URL | Model | Timeout | When | Trigger | Falls back | Can hit localhost in prod | Blocks user? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lib/jobaz-ai/providers/ollama.ts` | `getOllamaBaseUrl` | env or localhost:11434 | — | — | Always | — | — | **Yes if env unset** | — |
| same | `isOllamaAvailable` | same | llama3 | 5s | Before generate | Any local call | Returns false | **Yes** | No (caller decides) |
| same | `generateWithOllama` | same | llama3 | `OLLAMA_TIMEOUT_MS` or 60s | Inference | Routed/JAZ | Throw | **Yes** | Caller |
| same | `OllamaTextProvider.generateText` | same | llama3 | same | Router local tier | Routed | Throw → router next tier or fail | **Yes** | If ollama-only and no rules wrapper |
| `lib/jaz-career-engine/ollamaCareerClient.ts` | `runOllamaCareerBrain` | same | llama3 | `JAZ_OLLAMA_TIMEOUT_MS` default **180s** (30–240) | Analyse | Path complete | `{ ok:false }` → rules | **Yes** | **No** — analyse continues |
| `lib/jaz-career-engine/analyseCareerGoal.ts` | `analyseCareerGoal` | via client | — | 180s + 5s probe | Attach/analyse | Submit | Templates | **Yes** | No |
| `lib/jaz-plan-engine/generatePlan.ts` | optional improve | same | llama3 | 20s (cap 30) | Plan generate | Submit | Always has fallback first | Only if flag on | **No** |
| `app/api/ai/local/route.ts` | `POST` | same | llama3 | 45s | Local features | Auto/POST | 500 if OpenAI also fails | **Yes** | Copy stays rule-based if caller ignores 500 |
| `app/api/ai/profile/route.ts` | `POST` | same | via local feature | — | Profile AI | Click | Rules text | **Yes** | No |
| `app/api/uk-career-assistant/route.ts` | extract + generate + repair | via router | llama3 | 60s | CA | Each message | Rules / `getFallbackResponse` | **Yes** | **No** (slow) |
| `lib/career-brain/extractProfile.ts` | every turn | via router | llama3 | 45s | CA | Each message | Rules | **Yes** | No |
| `lib/career-brain/recommendations.ts` | result | via router | llama3 | 60s | CA result | Result | Rules recs | **Yes** | No |
| `lib/jobaz-ai/engines/careerAdvisor/dialogue.ts` | transition copy | via router | llama3 | router | CA | Each message | Rule message | **Yes** | No |
| `app/api/jaz-career/ollama-health/route.ts` | GET health + generate | same | llama3 | 180s | Manual | Admin/dev | 403 in prod | Only if debug flag | N/A |
| `app/api/debug/ollama-test/route.ts` | GET/POST | same | llama3 | 60s | Manual | Dev | 403 in prod | Debug flag | N/A |
| `lib/jobaz-ai/providers/assessment/ollamaProvider.ts` | placeholder | — | — | — | Unused | — | Throws “not configured” | No | N/A |
| `scripts/test-jaz-ollama.ts` | CLI | env or localhost | llama3 | — | Dev | CLI | Exit 2 | Dev only | N/A |

**Ollama-only features** (never OpenAI):  
`jaz-career-analyse`, `uk-career-assistant`, `uk-career-assistant-repair`, `uk-career-assessment-personalization`, `uk-career-follow-up`, `uk-career-advisor-dialogue`, `uk-career-advisor-follow-up`, `career-brain-extract`, `career-brain-recommend`, `career-brain-question`.

---

## 5. Fallback map

| Feature | Fallback name / file | What it produces | Good enough for launch? | Avoids AI cost? | User-safe? |
| --- | --- | --- | --- | --- | --- |
| JAZ analyse | `buildFallbackBrainReasoning` in `lib/jaz-career-engine/fallbackPlan.ts` | Route title, work-now roles, course types from Extra Income / skill aliases | **Yes** for MVP | Yes | Yes — safety rules still applied |
| My Plan | `buildFallbackPlanActions` in `lib/jaz-plan-engine/fallbackPlan.ts` | This-week CV/jobs/course actions | **Yes** — this **is** the launch path | Yes | Yes |
| Career Brain extract | `enrichCareerProfile` rules in `extractProfile.ts` | Structured profile from answers | Yes | Yes | Yes |
| Career Brain recommend | `buildFallbackRecommendations` in `recommendations.ts` | Direction list from rules | Yes | Yes | Yes |
| CA advisor copy | `ruleBasedAdvisorMessage` in `dialogue.ts` | Short transition sentence | Yes (less warm) | Yes | Yes |
| UK CA API | `getFallbackResponse` in `uk-career-assistant/route.ts` | Next classify/path question | Yes | Yes | Yes |
| Local dashboard copy | `enhanceWithLocalAi` / `ruleBasedFallback` | Keep existing weekly focus / next action | Yes | Yes if Ollama up or both fail; **No** if Ollama down + OpenAI fallback | Yes |
| CV generate/summary | Inline mock paragraph | Generic professional blurb | Weak quality | Yes **only if** `isConfigured()` false | Yes but generic |
| CV grammar/quality | Heuristic / empty issues | May miss errors | Acceptable | Yes if not configured | Yes |
| Cover generate | Mock | Generic letter | Weak | Same `isConfigured()` caveat | Yes |
| Interview / Whisper | Mock scores / mock transcript | Not real coaching | Interview is not launch-critical | Yes | Yes (honest mock) |
| Proofread | HTTP error | Feature off | OK to ship without | Yes | Yes |
| Pulse planner | `buildTemplatePulseSuggestions` | Static career posts | Yes for admin | Yes | Yes |
| Pulse moderate | `moderatePulseContentSync` | Keyword rules | Yes | Yes | Yes |
| Messenger | `ruleBasedImprove` | Capitalize + greeting | Yes | Yes | Yes |
| Email generate | `lib/email-templates` | Templates | Yes | Yes | Yes |
| Interview questions | Hardcoded 8 questions | Usable | Yes | Yes | Yes |
| Affiliate Scout | Error if no provider | Admin waits | Admin-only | Yes | Yes |
| Assessment Ollama provider | Placeholder throw | Not used | N/A | — | — |

---

## 6. Cost-control risks

**Do not fix in this audit. Listed only.**

1. **AI on every Career Assistant message (Ollama, not OpenAI):** `extractCareerProfile` always runs; dialogue may run. If a remote Ollama is added later, this is **per-question GPU time**, not a silent OpenAI bill.  
2. **Localhost probe then OpenAI FAST:** CV health/ATS/quality, `/api/ai/local`, weekly-plan, coaching — **not** ollama-only. Ollama down + key set = **hidden mini usage**.  
3. **Automatic enhancement:** `scheduleLocalAiProfileEnhancement` after CV / job-finder / proofreading / job-details signals — **2 calls**, not a visible button.  
4. **Not on every dashboard visit** as a dedicated generate — but signals can fire often.  
5. **Not a loop over all users/courses** in cron. Affiliate Scout / admin reports are **manual**.  
6. **Public unauthenticated LLM endpoints:** `/api/ai/local`, `/api/generate`, `/api/jaz`, `/api/apply-assistant` (6× gpt-4o), `/api/compare`, `/api/translate`, many `/api/cv/*` and `/api/cover/*`, `/api/jaz-career/analyse`.  
7. **No global rate limit** on OpenAI routes (WIE assessment has a small in-memory limiter only).  
8. **No admin approval** before bulk generation — Affiliate Scout is click-gated but a single click can be a large prompt.  
9. **No caching** of CA extract / CV tailor / apply-assistant results.  
10. **Saved result reuse:** My Plan **does** reuse active Career Assistant plan on generate. CV tailor / apply-assistant **do not**.  
11. **Apply Assistant** is the worst per-click OpenAI multiplier (6 quality completions).  
12. **`AI_PROVIDER_FALLBACK=true`** by default — local features spend OpenAI when Ollama fails.  
13. **`isConfigured()` always true** via default Ollama URL — mock cost-saving branches may never run; failed quality calls may retry or 500 after probing Ollama.  
14. **Avatar DALL·E** if `/admin/generate-avatar` is used in prod.  
15. **No cron AI** — good.

---

## 7. Production deployment questions

### If we deploy today with `OPENAI_API_KEY` set and no Ollama server, what works?

- **Core launch journey works:** Career Assistant (rules after ~5s probe), My Plan (fallback-first), library WIE/WIP/SNC/EI, Jobs For You, courses, auth, dashboard.  
- **CV / Cover / Writing / Interview / Apply Assistant / JAZ widget / Admin AI** work on OpenAI.  
- **Silent cost:** local-tier features and `/api/ai/local` will **fail Ollama then spend gpt-4o-mini**.  
- **Latency:** CA and JAZ analyse wait on `localhost:11434` (~5s) each probe.

### If we deploy today with no `OPENAI_API_KEY` and no Ollama server, what breaks?

- **Still works:** CA (rules), My Plan, jobs, courses, library engines, email templates, interview **questions**.  
- **Breaks or degrades:** CV AI generate/tailor/summary (likely **500** rather than mock, because `isConfigured()` is true via Ollama URL then both providers fail), cover AI, proofread, interview **eval/Whisper**, Apply Assistant, `/api/jaz` quality, Admin AI reports, avatars.  
- Users can still **build/save/export a CV manually**.

### If OpenAI works but Ollama is down, what works?

- Everything launch-critical via fallbacks.  
- Premium writing tools on OpenAI.  
- CA/JAZ slightly slower + rule-based wording.  
- Local-tier tools **silently use OpenAI FAST**.

### If Ollama works but OpenAI is missing, what works?

- CA quality copy (Ollama), JAZ analyse (Ollama), local features (Ollama).  
- My Plan still fallback unless plan flag on.  
- **CV/Cover/Interview/Proofread/Apply/Whisper/avatars fail or mock.**  
- Admin quality reports fail unless they can run as local (feature `admin/ai-report` is **unmapped** → defaults to **fast** → OpenAI). Admin reports **need OpenAI**.

### Which provider is required for the launch-critical user journey?

**Neither is strictly required.**  
Launch-critical path is **rule engines + My Plan fallback**.  

**OpenAI is required** if launch marketing promises **AI CV / cover / interview**.  
**Ollama is not required** for that journey; it only improves CA/JAZ language.

### Which provider is only helpful for admin / future features?

- Ollama: CA warmth, JAZ analyse nuance, local coaching copy, optional plan improve (`JAZ_PLAN_OLLAMA_ENABLED`).  
- OpenAI: Admin AI, Affiliate Scout, Pulse AI planner, avatars, Apply Assistant, Whisper.  
- ElevenLabs: TTS (separate cost).

---

## 8. Recommendation options

### Option A — Launch with OpenAI + fallbacks, no Ollama server yet

**Pros**

- No GPU/VPS rental before launch.  
- CA / My Plan / jobs / courses already fall back.  
- CV/Cover/Writing quality available if key is set.  
- Matches current “Ollama was local-dev” reality.

**Cons**

- Production still **probes localhost:11434** (latency).  
- Local-tier features **fall through to OpenAI mini** (surprise cost).  
- Unauthenticated `/api/ai/local` and Apply Assistant are cost/abuse exposure.  
- CA copy is more generic without Ollama.

**Risk:** Medium cost (OpenAI tools + silent FAST fallback), low functional risk.

**MVP suitability:** **High** — best fit for a first Render deploy if CV AI is in the launch story.

### Option B — Launch with remote Ollama + OpenAI only for premium/quality

**Pros**

- Predictable infra cost for CA/JAZ/local copy.  
- Avoids OpenAI on every CA turn (already blocked) **and** stops FAST fallback spend if Ollama stays up.  
- Better CA wording than rules.

**Cons**

- Must rent/run a GPU or large CPU box, keep `llama3` pulled, set `OLLAMA_BASE_URL`, monitor 180s JAZ timeouts.  
- Render web dyno **cannot** be assumed to reach “localhost Ollama”.  
- Still need OpenAI for CV/cover/Whisper/admin quality.  
- Two systems to operate.

**Server requirements to investigate (not decided here)**

- RAM: llama3 8B typically **≥8–16 GB**; 70B not needed.  
- CPU-only: JAZ JSON already documented as **1–3 minutes**.  
- GPU (e.g. T4/A10): much better CA latency.  
- Network: private URL from Render, not public open 11434.  
- Process: `ollama serve` + `ollama pull llama3`, health `/api/tags`.  
- Timeouts: `JAZ_OLLAMA_TIMEOUT_MS` / route `maxDuration` 240s vs Render request limits.

**Risk:** Ops risk higher; OpenAI bill lower for local-tier; CA UX better **if** the box is sized correctly.

**MVP suitability:** Medium — only if you already want infra and can set `OLLAMA_BASE_URL` before traffic.

### Option C — Ollama disabled in practice + rules for CA; OpenAI for CV/Cover/Writing

**Pros**

- Clear cost split: pay OpenAI only when user clicks CV/cover/writing.  
- CA stays deterministic (already true when Ollama fails).  
- No GPU rental.

**Cons**

- **Cannot actually “disable” Ollama without a code/env change** — there is no `ENABLE_OLLAMA=false`. Unset URL still defaults to localhost.  
- Users still pay **5s timeout tax** on each CA turn / JAZ attach unless code is changed later.  
- Local-tier still FAST-fallbacks to OpenAI unless fallback is turned off (`AI_PROVIDER_FALLBACK=false`) — that flag also affects other chains.

**Risk:** Low cost if users rarely hit CV AI; **UX latency** until a future toggle exists.

**MVP suitability:** High **functionally**, weaker **UX** until localhost probes are avoided.

---

## 9. Final recommendation

### Recommended launch AI setup

**Option A, with operational awareness (not a code change in this audit):**

- Set `OPENAI_API_KEY` on Render if CV / Cover / Writing / Interview are in the launch promise.  
- **Do not rent an Ollama server yet.**  
- Accept Career Assistant / JAZ analyse on **rules + jaz_fallback**.  
- Keep `JAZ_PLAN_OLLAMA_ENABLED` unset/false.  
- Do not set `ALLOW_OLLAMA_DEBUG` in production.  
- Treat OpenAI as **user-triggered premium tools**, not as the Career Assistant brain.

### Should we rent an Ollama server before launch?

**Not yet.**

Rent later when: CA volume is real, rules copy feels too generic, or you want to **stop** local-tier OpenAI FAST fallback by keeping Ollama actually reachable.

### What we must decide before Render deploy

1. **Is AI CV/Cover in the launch promise?** If yes → `OPENAI_API_KEY` (+ optional `OPENAI_MODEL` / `OPENAI_MODEL_QUALITY`). If no → key optional; those buttons degrade.  
2. **Do we accept localhost:11434 probes (≈5s) on CA/JAZ?** If not, that is a **post-audit config/code decision** (out of scope here). Setting a dummy `OLLAMA_BASE_URL` without a server still costs a 5s timeout.  
3. **Cost exposure:** public `/api/ai/local` + Apply Assistant + no rate limits. Decide whether that is acceptable for MVP traffic.  
4. **Do not** enable `JAZ_PLAN_OLLAMA_ENABLED` or `ALLOW_OLLAMA_DEBUG` for launch.

### What can wait until after launch

- Remote Ollama VPS / GPU.  
- Splitting local-tier so CV health never hits OpenAI.  
- Auth/rate limits on AI routes.  
- Caching CA extract.  
- Admin Affiliate Scout / Manager reports (manual, admin-only).  
- Pulse AI planner, avatars, Whisper polish.  
- Messenger LLM (not wired).  
- Assessment Ollama provider (placeholder).

---

**Audit-only. No files other than this report were written.**
