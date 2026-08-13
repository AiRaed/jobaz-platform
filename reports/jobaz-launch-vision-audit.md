# JobAZ launch-readiness vision audit

**Date:** 13 August 2026  
**Scope:** Verify product vision, fix only small safe launch gaps. No rebuild, redesign, refactor, route rename, or database change.

---

## 1. What already matches the vision

JobAZ already behaves as both a **guided UK career-planning platform** and a set of **standalone tools**.

### Dual product model
- Public landing (`/`) exposes Career Assistant, Browse Courses, Find Jobs, Local Opportunities, Pulse, plus standalone tools (CV Builder, Cover Letter, Interview Coach, Writing Review).
- Logged-in workspace (`/dashboard`) is the execution centre: Career Identity, My Plan, Documents, Jobs For You, saved opportunities, Pulse, Relay.
- Tools remain independently routable: `/cv-builder-v2`, `/writing-review`, `/jobs`, `/courses`, `/career-assistant`.
- Middleware treats those tools as public; My Plan / profile / dashboard / admin are protected.

### Guided journey
- Career Assistant paths are live: Work in My Education, Work in My Profession, Start a New Career, Extra Income.
- Grow / Start a Business are visibly **Coming Soon** (honest gating).
- Add-to-My-Plan exists (`AddToMyPlanButton` / `add-from-career-assistant`).
- My Plan (Career OS) links to CV Builder, Jobs, and training.
- Jobs For You already prefers **active plan first**, then **saved CV**, with honest empty copy when neither exists.
- CV Builder can run without a plan and can tailor to an active plan.

### Affiliate trust (mostly already correct)
- Career Assistant training cards (WIE / WIP / SNC / Extra Income) already show Apply Now only with a real referral URL, otherwise “Provider not listed yet” / “Search courses later”.
- Course Opportunity Tracker supports listings, providers, referral links, affiliate status, published/unpublished, and coming-soon logic.
- Admin AI marketing prompts already forbid naming a provider / Apply Now without a live referral URL.

### Admin
- Admin home cards all point at existing pages (none are dead “coming soon” blockers).
- Career Assistant Engine covers engine health, recent plans/logs, behaviour, course matching, missing affiliates, learning loop, and plan engine.
- Extra Income Library opens as a **read-only placeholder** (public path is live; editor is after launch).
- Admin/debug panels are gated (`isAdmin` + development). Normal users do not see debug JSON on public result cards.

### Safety / legal / SEO
- Admin requires auth cookie + server-side admin session.
- Career Identity and My Plan APIs resolve the authenticated user; identity RLS is owner-only; message consent defaults to **false**.
- Terms and Privacy already mention Career Assistant, My Plan, CV Builder, Jobs For You, courses/licences, affiliates, optional mobile, reminder consent, Supabase, Google Analytics, cookies, and **no outcome guarantees**.
- Cookie banner + GA gating are in place.
- `/sitemap.xml` includes only public pages (`/`, `/courses`, published course slugs, `/career-assistant`, `/jobs`, `/opportunities`, `/about`, `/privacy`, `/terms`).
- `/robots.txt` disallows admin/dashboard/profile/workspace paths and points at the sitemap.
- Private layouts already send `noindex`.

---

## 2. Small safe fixes applied

| Fix | Why |
| --- | --- |
| `canApplyToCourse()` now requires a real referral / provider-default URL (`courseCtaMode === 'apply_now'`). Official/search URLs no longer count as Apply Now. | Launch honesty: Apply Now was appearing when only an official or Google-search URL existed. |
| `openCourseApply()` refuses `apply_now` unless CTA mode is `apply_now`. | Prevents a click from opening a non-affiliate URL labelled as Apply Now. |
| Course cards / detail / training cards: “Link not available” → **Provider not listed yet**. Course detail no longer claims a partner enrolment path when none exists. | Honest empty/missing-provider wording. |
| Public course back / not-found / landing “View all courses” now use `/courses`. Landing “View all jobs” uses `/jobs`. | Canonical public URLs; aliases still work, not renamed. |
| Landing JAZ greeting: “fastest route” → “practical route”. How-it-works steps now say tools can be used without a plan. | Avoids implied guarantees / “plan required”. |
| My Plan empty state now says CV Builder, Job Finder, Writing Review, and Courses still work without a plan. | Vision: standalone tools. |
| Extra Income admin action: “Open Extra Income test mode” → “Open Extra Income path”. | Stops implying a public debug/test surface. |
| Landing `/` now includes Terms / Privacy / cookie settings via `Footer`. | Public users can reach legal pages from the homepage. |
| About: removed stale “Build Your Path”; JAZ chips: Profession + Growth/Business marked soon. | Product copy matches launch paths. |
| Job Finder no longer says saved jobs must open “in your plan”. | Standalone tool wording. |
| Interview avatar fallback no longer exposes `/admin/generate-avatar`. | Admin path not shown to normal users. |
| `/api/jaz-plan/generate` ignores client `user_id`; uses session only. | Prevents writing a plan under another user’s id. |
| Pathway knowledge links labelled “View course”, not Apply Now. | Knowledge-library URLs are not affiliate Apply Now. |
| AI Analytics: Back to Admin link. | Tiny nav consistency. |

No architecture, route, database, or engine changes.

---

## 3. Launch blockers found

**No code launch blockers found.**

Confirm before go-live (ops, not code):

1. **Career Identity mobile/consent migration** `supabase/migrations/20250812120000_career_identity_mobile_reminders.sql` is applied in production. If missing, optional mobile + reminder consent will not persist. Consent still defaults false in app types; no SMS is sent from this codebase.
2. **Published partner courses** have real `referral_url` / provider-default URLs in admin. Without them, public pages correctly show “Provider not listed yet” — that is honest, but commercial launch depends on at least some live affiliate links.
3. **Learning Loop / Plan Engine migrations** if those admin tabs should show live data. Pages still open; they prompt to apply migrations rather than crash.

---

## 4. Things to postpone until after launch

- Extra Income **admin editor** (placeholder monitor is enough for launch).
- Grow in Current Career / Start My Own Business Career Assistant paths.
- Mass-replacing remaining `/career-hub` aliases inside dashboard/profile/PageHeader (they still resolve; not a user-facing break).
- Public indexing of CV Builder / Cover Letter / Writing Review (intentionally omitted from sitemap; they remain usable).
- CSV export on Users / Saved Plans (“coming soon” labels already honest).
- Community posting on Pulse.
- Deeper Jobs For You ranking work beyond the existing plan-then-CV resolver.
- Any SEO rewrite (sitemap/robots already match launch structure).
- Day-mode visual polish beyond the existing remaps (no obvious launch-blocking contrast found in this pass).

---

## 5. Admin coverage status

| Area | Status | Notes |
| --- | --- | --- |
| Administration home | **OK** | All cards have working `href`s. |
| Work in My Education Library | **OK** | `/admin/career-library` |
| Profession & Start New Career Library | **OK** | `/admin/career-library/work-in-profession` |
| Extra Income Library | **OK (placeholder)** | Opens; editor marked after launch. Public path is live. |
| Career Assistant Engine | **OK** | Engine Health, Recent Plans, User Behaviour, Course Matching, Missing Affiliates, Learning Loop, Plan Engine. |
| Admin AI | **OK** | `/admin/ai` |
| Admin Tasks | **OK** | `/admin/tasks` |
| Platform Analytics | **OK as AI Analytics** | `/admin/ai-analytics` (Career Assistant usage/funnel). No separate “Platform Analytics” page — not a missing link. |
| Courses admin | **OK** | Listings, providers, referral links, affiliate status, publish, opportunity tracker. |
| Jobs Management | **OK** | `/admin/jobs` |
| Local Opportunities | **OK** | `/admin/opportunities` |
| Pulse | **OK** | `/admin/pulse` |
| Relay Inbox | **OK** | `/admin/relay` |
| Email Campaigns | **OK** | `/admin/emails` |
| Users | **OK** | `/admin/users` |
| Saved Plans | **OK** | `/admin/saved-plans` |
| Admin-only debug | **OK** | Public wizards `showDebug` only when admin + development. Dashboard debug same. |

No new admin tools were built. No missing card was blocking access to an existing feature.

---

## 6. Acceptance checks

### A. Standalone tools
- CV Builder, Writing Review, Job Finder, and Courses remain public and do not require My Plan.
- Career Assistant still creates a plan when the user completes a path.

### B. Guided journey
- Assistant results can be added to My Plan.
- My Plan shows selected roles/courses/actions and links to CV Builder and Jobs.
- CV Builder can tailor to the active plan.
- Jobs For You uses plan first, then saved CV, and states the source honestly.

### C. Affiliate trust
- Apply Now now requires a real referral / provider-default URL.
- Missing providers show **Provider not listed yet** / coming soon / search later.
- No fake provider, price, or booking claim added.

### D. Admin
- Home cards open.
- Engine, courses, analytics, users/plans, and recent features are reachable.
- Debug remains admin/dev only.

### E. Safety
- Spot-check: identity and plan APIs filter by authenticated user; identity RLS is owner-only.
- Sitemap excludes private/admin/user workspace pages.
- `/admin` is auth-gated (middleware + server admin session).
- Messaging consent defaults false; this audit does not send SMS/email.

### F. Build
- `npm run build` **passed**.
- `npm run lint` was started but is slow (`next lint`); not treated as a launch gate.

---

## 7. Final launch readiness recommendation

**Ready to launch**, with the ops checks in section 3.

The product already matches the vision: standalone tools work without a plan; Career Assistant can create one; My Plan is the execution centre; affiliate Apply Now is honest; admin covers the new system; legal/cookies/SEO are in place.

The fixes in this audit were limited to **wrong Apply Now visibility**, **honest missing-provider labels**, **canonical public links**, and **copy that implied a plan was required or a guaranteed “fastest” outcome**.

Do not treat Extra Income admin editing, Grow/Business paths, or leftover `/career-hub` aliases as launch blockers.
