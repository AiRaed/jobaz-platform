# JobAZ Pulse — Database setup

Pulse uses the same Supabase tables as the career feed (`feed_*`). Run both migrations in order:

1. `supabase/migrations/20250528000000_create_feed_tables.sql`
2. `supabase/migrations/20250530000000_pulse_upgrade.sql`

Optional identity profiles (avatars sync): `20250529000000_create_identity_profiles.sql`

## Env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional — seeds official groups/posts when empty)

## Routes

- UI: `/feed` (labeled **Pulse** in navigation)
- Alias: `/pulse` → redirects to `/feed`

## Two-account test

See testing section in project docs or the Pulse page banner after migrations.
