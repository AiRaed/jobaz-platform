# JobAZ PWA / browser install branding fix

**Date:** 13 August 2026  
**Scope:** Manifest, favicons, browser tab icon, and install prompt only. No app logic, routes, CA, CV, AI guard, admin, Supabase, or affiliate changes.

---

## Result

Chrome install prompt and the installed app now use:

| Field | Value |
| --- | --- |
| App name | JobAZ |
| Short name | JobAZ |
| Description | Your UK career platform — plan, train, apply and grow. |
| Tab title | JobAZ — UK Career Platform |
| Theme | `#2563eb` |
| Background | `#020617` |
| Display | `standalone` |
| Start / scope | `/` |

---

## Old names removed (browser-facing)

| Location | Removed |
| --- | --- |
| `public/manifest.json` | `AI CV Generator Pro` / `AI CV Pro` / CV-only description |
| `public/favicon.svg` / `public/icon.svg` | Old purple arrow/path placeholder |
| `app/layout.tsx` metadata | Previous CV-leaning default title; added `applicationName: "JobAZ"` |
| `app/og-image/route.tsx` | “Redefine your Professional Presence with AI” |

Left unchanged (not browser install metadata):

- `package.json` / `package-lock.json` npm name `ai-cv-generator-pro` (not shown to users)
- In-app UI copy on `components/Header.tsx` and `app/upgrade/page.tsx` (“AI CV Generator Pro”) — those pages are not the PWA name source

---

## Icon paths used

Generated from existing JobAZ assets (`public/logo.png` wordmark + `public/jaz/jaz-eye.png` eye mark) via `scripts/generate-favicons.ts`.

| Path | Use |
| --- | --- |
| `/favicon.svg` | Browser tab (JAZ eye on `#020617`) |
| `/favicon-16x16.png` | Tab 16px |
| `/favicon-32x32.png` | Tab 32px |
| `/favicon.ico` | Shortcut / legacy tab |
| `/apple-touch-icon.png` | Apple / iOS home screen (JobAZ wordmark, 180px) |
| `/icons/icon-192x192.png` | PWA `any` — JobAZ wordmark |
| `/icons/icon-512x512.png` | PWA `any` — JobAZ wordmark |
| `/icons/maskable-192x192.png` | PWA `maskable` — JAZ eye with safe padding |
| `/icons/maskable-512x512.png` | PWA `maskable` — JAZ eye with safe padding |
| `/logo.png` | Existing header/JSON-LD logo (unchanged file) |

Old purple placeholder is no longer referenced by the manifest or Apple touch icon.

---

## Files changed

- `public/manifest.json`
- `public/favicon.svg`
- `public/icon.svg`
- `public/favicon-16x16.png` (regenerated)
- `public/favicon-32x32.png` (regenerated)
- `public/favicon.ico` (regenerated)
- `public/apple-touch-icon.png` (new)
- `public/icons/icon-192x192.png` (new)
- `public/icons/icon-512x512.png` (new)
- `public/icons/maskable-192x192.png` (new)
- `public/icons/maskable-512x512.png` (new)
- `scripts/generate-favicons.ts` (now exports JobAZ PWA sizes from logo + eye)
- `app/layout.tsx` (title, description, applicationName, icons, apple touch, theme-color, JSON-LD logo)
- `app/og-image/route.tsx` (JobAZ title + tagline)
- `vercel.json` (favicon/icon/manifest no longer cached `immutable` for 1 year)

---

## Cache note

`favicon.svg` and `icon.svg` previously had `Cache-Control: public, max-age=31536000, immutable`. That would keep the old purple icon in browsers/CDN. Those headers are now `max-age=86400, must-revalidate`. Manifest is `max-age=3600, must-revalidate`. New PNG paths (`/icons/*`, `/apple-touch-icon.png`) are uncached by that old immutable rule.

After deploy, already-installed PWAs may keep the old icon until the user reinstalls or the OS refreshes the icon; the install prompt for new users will show JobAZ.

---

## Build result

`npm run build` passed (Next.js 14.0.4, 13 August 2026).
