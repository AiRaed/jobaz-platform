# JobAZ mobile launch readiness

**Date:** 13 August 2026  
**Scope:** Layout/readability on 360 / 390 / 430 / ~768px. No product, route, or API changes.

Checked by code audit of public/workspace layouts (grids, overflow, drawers, banners, forms). No redesign.

---

## 1. Pages checked

| Page | Mobile status |
| --- | --- |
| `/` landing | OK — 1-col grids, hamburger drawer (`lg:hidden`), CTAs wrap |
| `/career-assistant` | OK — `CaJourneyShell` / UK CA hero `overflow-x-hidden`, options stack |
| `/courses` | OK — `grid-cols-1` then `sm:grid-cols-2` |
| `/courses/[slug]` | OK — actions already `flex-col sm:flex-row` |
| `/jobs` / Job Finder | OK after prefill wrap |
| `/auth` | OK — `max-w-md` + `px-4`, full-width inputs |
| `/dashboard` My Workspace / My Plan | OK after hero/progress grids |
| `/cv-builder-v2` | OK — stacks below `lg`, tabs scroll-x, preview `overflow-y-auto` |
| Jobs For You | OK — `grid-cols-1 md:grid-cols-2`, filter row `flex-wrap` |
| Profile / Career Identity | OK — fields `w-full`, contact/consent stack |
| `/terms` `/privacy` | OK after heading/padding |
| Cookie banner | OK after safe-area + max-height |
| Admin home | Usable — cards 1-col then `md:grid-cols-2`; not a consumer surface |

Sidebar/nav: desktop sidebar is `hidden lg:flex`; mobile uses overlay drawer that closes on backdrop.

---

## 2. Mobile issues found

| Issue | Severity |
| --- | --- |
| My Plan hero used `grid-cols-3` on all widths — cramped at 360px | Launch |
| Dashboard loading skeleton `w-96` overflowed 360px | Launch |
| Terms/Privacy `text-4xl` + `p-8` squeezed headings | Launch |
| Job Finder CA prefill row did not wrap | Launch |
| Cookie banner had no safe-area / height cap | Launch |
| Page-level horizontal overflow possible from wide chips | Launch |
| My Plan progress used 5 columns from `sm` (tablet cramped) | Launch |
| Long role titles on Open CV / View Jobs could overflow | Launch |
| CV tabs could shrink instead of scroll | Minor |
| Add to My Plan title lacked `min-w-0` | Minor |

---

## 3. Safe fixes applied

- `html` / `body`: `overflow-x: hidden`
- My Plan hero: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4` + `break-words`
- My Plan progress: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Dashboard skeleton: `w-full max-w-sm`
- Terms/Privacy: smaller mobile titles, `p-4 sm:p-8`, wrap
- Job Finder prefill: `flex-wrap` + `break-words`
- Cookie banner: safe-area padding, `max-h` + scroll, `min-h-10` buttons
- Selected plan titles/CTAs: `break-words` / `max-w-full`
- CV tabs: `shrink-0` (row already `overflow-x-auto`)
- Add to My Plan modal: `min-w-0` on title block
- UK CA hero: slightly smaller title + `min-w-0`
- Course detail actions: `flex-wrap min-w-0`

Desktop `lg+` two-column CV / sidebar layouts were not redesigned.

---

## 4. Remaining non-blockers

- Landing opportunity/pulse rows stay horizontal snap-scroll (contained).
- CV A4 preview is scaled/scrollable, not a full paper width.
- Admin tables may still need horizontal scroll on phones — acceptable for internal tools.
- Day-mode dark “islands” on some CA/plan cards are contrast, not overflow.
- Cookie banner still sits over the bottom ~180px until dismissed (buttons remain tappable; it does not fill the screen).

---

## 5. Acceptance

- **A Landing:** 1-col content, hamburger, Get started / Start Career Assistant tappable.
- **B Career Assistant:** question/option cards stack; Add to My Plan is a 90vh sheet with internal scroll.
- **C My Plan:** cards stack; CV/Jobs buttons wrap.
- **D CV Builder:** form first on mobile; tabs scroll; preview `max-h` + `overflow-y-auto`; Save/PDF/DOCX wrap.
- **E Jobs For You:** one column; filters wrap; View Job visible.
- **F Courses:** one column; Apply Now / Provider not listed stack.
- **G Profile:** phone/consent fields full width.
- **H Legal/cookies:** readable; banner buttons visible.
- **I Build:** `npm run build` passed (Next.js 14.0.4, 118 pages).

---

## 6. Final mobile launch recommendation

Mobile ready for launch
