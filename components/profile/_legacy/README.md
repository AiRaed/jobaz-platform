# Legacy Profile UI (backup)

These files are backups of the previous `/profile` implementation before the v2 rebuild (May 2026).

- `app-profile-page.tsx` — old `app/profile/page.tsx`
- `ProfilePageContent.tsx` — monolithic profile page content
- `IdentityProfileHero.tsx` — hero card with interaction issues

Public routes (`/u/[username]`, `/business/[slug]`) still use `components/identity-profile/PublicProfileView.tsx`.

Do not import these in production routes. Reference only if restoring old UI.
