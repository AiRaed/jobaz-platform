# Identity Profile — Supabase setup

Run this migration in the **Supabase SQL Editor** (same project as Feed):

`supabase/migrations/20250529000000_create_identity_profiles.sql`

Also run the Feed migration if you have not yet:

`supabase/migrations/20250528000000_create_feed_tables.sql`

## What you get

- `profiles` — personal + business identity root (avatar, banner, headline, trust score)
- `personal_profiles` / `business_profiles` — type-specific fields
- `profile_experience`, `profile_education`, `profile_skills`, `profile_media`
- Storage buckets: `avatars`, `banners`, `business-media`

## After running

1. Refresh `/profile` — completion % and hero should load from Supabase.
2. Upload avatar/cover — URLs sync to `feed_profiles` for Pulse.
3. Switch profile type (Personal ↔ Business) on the profile page.

## Env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional: Ollama for AI writing buttons via `/api/ai/profile` (rule-based fallback until connected).
