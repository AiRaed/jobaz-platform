# JobAZ Render deploy checklist

**Date:** 13 August 2026  
**Scope:** Production build/start, env, security, sitemap, migrations. No product rewrite.

---

## Build result

- `npm run build` **passed** (Next.js 14.0.4).
- `/robots.txt` and `/sitemap.xml` are registered routes.
- Typecheck and ESLint are skipped during build (`ignoreBuildErrors` / `ignoreDuringBuilds` in `next.config.js`). Compilation still succeeded.

## Start script status

| Script | Value | Status |
| --- | --- | --- |
| `build` | `next build` | OK |
| `start` | `next start` | OK — respects Render `PORT` |

**Tiny fix applied:** `start` was `next start -p 3000`, which would ignore Render’s `PORT`. It is now `next start`.

**Local smoke test:** `npm run start` with `PORT=3010` (port 3000 was already used by `npm run dev`).

- Server: Ready in ~748ms
- `GET /` → 200
- `GET /robots.txt` → production host `https://jobaz.io`
- `GET /sitemap.xml` → `https://jobaz.io/...` only (no localhost; no `/admin`, `/dashboard`, `/profile`)

`npm run start` on port 3000 will fail while `npm run dev` is running. That is a local port conflict, not a Render blocker.

---

## Required environment variables

Do **not** commit secrets. Set these in the Render service Environment tab.  
`NEXT_PUBLIC_*` must be present at **build time** (Render rebuild after changing them).

### Supabase — required

| Variable | Required? | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Inlined at build; used by client + middleware |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Public anon key only |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | Server-only (API/admin). Never `NEXT_PUBLIC_` |
| `SUPABASE_URL` | Optional | Server fallback; defaults to `NEXT_PUBLIC_SUPABASE_URL` |

### Site URL / public URL — required

| Variable | Required? | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **Required** | Canonical origin, e.g. `https://jobaz.io`. Used for auth email redirects. If unset, `lib/site-url.ts` falls back to localhost (dev-only). |
| `NEXT_PUBLIC_APP_URL` | Optional | Email templates fallback after `NEXT_PUBLIC_SITE_URL` |

Sitemap/robots use hardcoded `https://jobaz.io` (`lib/seo/site.ts`) and do **not** use localhost.

### Auth / admin — required

| Variable | Required? | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Recommended | Comma-separated extra admin emails. Built-in allowlist still applies if unset. |

### OpenAI / AI — required for production AI

| Variable | Required? | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | **Required for production AI** | If unset, provider router falls back to Ollama at localhost (not available on Render). |
| `OPENAI_MODEL` | Optional | Default in provider code |
| `OPENAI_MODEL_QUALITY` | Optional | Higher-quality model |
| `AI_PROVIDER` | Optional | `openai` recommended in production |
| `AI_PROVIDER_FALLBACK` | Optional | Default true |
| `AI_PROVIDER_TIMEOUT_MS` | Optional | Default 60000 |

### Ollama — optional / local only

| Variable | Required? | Notes |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | Optional | Defaults to `http://localhost:11434` — **do not rely on this in Render** |
| `OLLAMA_MODEL` | Optional | Local only |
| `OLLAMA_MODEL_QUALITY` | Optional | |
| `OLLAMA_TIMEOUT_MS` | Optional | |
| `JAZ_OLLAMA_TIMEOUT_MS` | Optional | |
| `JAZ_PLAN_OLLAMA_TIMEOUT_MS` | Optional | |
| `JAZ_PLAN_OLLAMA_ENABLED` | Optional | |
| `ALLOW_OLLAMA_DEBUG` | Optional | Keep unset/false in production |

### Job APIs — required for live job search

| Variable | Required? | Notes |
| --- | --- | --- |
| `REED_API_KEY` | Recommended | Reed job search |
| `REED_API_BASE` | Optional | Default Reed API URL |
| `ADZUNA_APP_ID` | Recommended | Adzuna job search |
| `ADZUNA_APP_KEY` | Recommended | |
| `ADZUNA_API_BASE` | Optional | Default Adzuna API URL |

App still starts without these; job search results will be empty/limited.

### Email / Resend — optional (campaigns / app mail)

| Variable | Required? | Notes |
| --- | --- | --- |
| `EMAIL_PROVIDER` | Optional | Default `resend` |
| `RESEND_API_KEY` | Optional | Server-only. Needed to send app emails |
| `EMAIL_FROM` | Optional | e.g. `JobAZ <support@jobaz.io>` |
| `EMAIL_REPLY_TO` | Optional | |

Supabase Auth confirmation/reset emails are configured in the **Supabase dashboard**, not these vars.

### Career Assistant / WIE flags

| Variable | Required? | Notes |
| --- | --- | --- |
| `CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1` | **Required for current WIE path** | Unset in production → **legacy** WIE. Set `true` to keep the knowledge-engine flow. |
| `NEXT_PUBLIC_CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1` | Optional | Client-visible twin of the above |
| `WIE_PUBLIC_INCLUDE_DRAFTS` | Optional | Defaults true. Set `false` once library roles are production-approved. |
| `WIE_RESULT_TOKEN_SECRET` | Recommended | Result-token signing; falls back to service role / `NEXTAUTH_SECRET` |
| `NEXTAUTH_SECRET` | Optional | Fallback for WIE result tokens only (Auth.js is not the login stack) |
| `CAREER_BRAIN_ENABLED` | Optional | Default true |
| `WIE_TRAINING_TYPE_DEBUG` | Optional | Keep unset in production |

### Google Analytics

| Variable | Required? | Notes |
| --- | --- | --- |
| *(none)* | — | Measurement ID is hardcoded (`G-PDGHSSX1XK`). GA loads **only after** cookie accept. |

### Voice / TTS — optional

| Variable | Required? | Notes |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | Optional | Interview TTS |
| `ELEVENLABS_VOICE_ID` | Optional | |
| `TTS_BUCKET_NAME` | Optional | Default `tts-cache` |

### Proofreading flags — optional

| Variable | Required? | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ENABLE_LLM_PROOFREAD` | Optional | |
| `NEXT_PUBLIC_ENABLE_PHD_MODE` | Optional | |

### Affiliate / providers

No affiliate API keys in env. Partner referral URLs live in Supabase (courses / providers / opportunity tracker).

---

## Supabase migrations to confirm before deploy

Do **not** auto-apply from this checklist. Confirm these exist on the **production** Supabase project (Dashboard → SQL or `supabase db push` only if you already use that safely).

### Must confirm for current launch features

| Migration | Purpose |
| --- | --- |
| `20250812120000_career_identity_mobile_reminders.sql` | Optional mobile + reminder consent (default false) |
| `20250801140000_jaz_plan_engine.sql` | Plan engine tables |
| `20250810180000_jaz_active_plan.sql` | One active My Plan per user |
| `20250801130000_jaz_user_activity_events.sql` | Learning loop / admin behaviour events |
| `20250801120000_jaz_career_engine_logs.sql` | Career Assistant engine logs |
| `20250729120000_user_career_identity.sql` | Career Identity base table |

### Course / provider / affiliate (if not already applied)

| Migration | Purpose |
| --- | --- |
| `20250621000000_create_courses_table.sql` | Courses |
| `20250710090000_course_providers.sql` | Providers / partners |
| `20250710060000_course_opportunity_tracker.sql` | Opportunity tracker |
| `20250710100000_course_opportunity_published_link.sql` | Published course link |
| `20250710010000_course_delivery_modes.sql` | Delivery modes |
| `20250710020000_course_public_badges.sql` | Public badges |
| `20250710030000_course_public_offer.sql` | Public offers |
| `20250710050000_course_purpose.sql` | Course purpose |
| `20250729140000_course_clicks_route_session.sql` | Apply Now click tracking |
| `20250713130000_recommendation_visibility.sql` | Recommendation visibility |
| `20250713120000_course_opportunity_education_metadata.sql` | WIE opportunity metadata |
| `20250710000000_course_images_storage.sql` | Course image storage |

### Career library (if WIE/WIP libraries are used in prod)

Apply all `20250802*` / `20250803*` / `20250804*` `career_library_*` migrations already in `supabase/migrations/`, plus `20250802120000_career_knowledge_library.sql`.

Older platform migrations (auth profiles, saved jobs, CVs, Pulse, Relay, emails, etc.) must already be on prod if those features are live.

---

## Render setup notes

1. **Web service** from this repo. Build: `npm run build`. Start: `npm run start`.
2. **Node:** `engines.node` is `>=18.17.0`. Prefer Node **20 LTS** on Render (local smoke used Node 24; not required on Render).
3. Set **all `NEXT_PUBLIC_*` before the first production build**. Changing them later needs a rebuild.
4. Set `OPENAI_API_KEY` and `AI_PROVIDER=openai` so production does not call localhost Ollama.
5. Set `CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1=true` if you want the current WIE knowledge engine (unset = legacy).
6. Set `NEXT_PUBLIC_SITE_URL=https://jobaz.io` (or the live custom domain).
7. Point the custom domain at Render; keep Supabase Auth redirect URLs in sync (`https://jobaz.io/auth/callback` and the Render URL if used).
8. Health: `/` returns 200. No Docker/render.yaml in repo — Render native Node is enough.
9. Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, job API keys as `NEXT_PUBLIC_*`.

---

## Compatibility / security checks

| Check | Result |
| --- | --- |
| Hardcoded localhost in production sitemap/API paths | **Pass** — sitemap/robots use `https://jobaz.io` |
| Localhost leftovers | Dev-only: Ollama default, SW guard, `SITE_URL` fallback if env missing |
| Relative API fetches | Client uses `/api/...` paths |
| Service role in client | Not a `NEXT_PUBLIC_*` var; only used in server helpers |
| Admin routes | Middleware auth cookie + `app/admin/layout.tsx` allowlist |
| Private pages | `/dashboard`, `/profile`, `/messages`, `/feed`, etc. protected |
| Debug panels | `NODE_ENV === 'development'` + admin; hidden in production |
| GA before consent | **Pass** — `GoogleAnalytics` mounts only after accept |
| Cookie reject | App remains usable; analytics not loaded |
| Dynamic routes | Build collected 118 pages; no missing-param failures |

---

## Known non-blockers

- `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` (pre-existing).
- Extra Income admin editor still placeholder.
- Grow / Start Business Career Assistant paths still Coming Soon.
- Ollama localhost default is harmless if OpenAI is configured.
- Local `npm run start` on 3000 conflicts with `npm run dev`.
- GA ID is hardcoded (not an env var).
- `WIE_PUBLIC_INCLUDE_DRAFTS` default true — tighten after library sign-off.

---

## Final deploy recommendation

Confirm production Supabase has the migrations listed above, then set the required Render env vars (especially Supabase, `NEXT_PUBLIC_SITE_URL`, `OPENAI_API_KEY`, and the WIE knowledge-engine flag).

Ready for Render deploy
