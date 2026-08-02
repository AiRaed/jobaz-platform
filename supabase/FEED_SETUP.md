# JobAZ Feed — Database Setup

## Run this migration in Supabase SQL Editor

The error `could not find the table public.feed_posts` means the feed tables have not been created yet.

### Steps

1. Open Supabase Dashboard → your project
2. Go to **SQL Editor** → **New query**
3. Open: `supabase/migrations/20250528000000_create_feed_tables.sql`
4. Copy the **entire file** and paste into the SQL Editor
5. Click **Run** (wait for success)
6. Refresh `/feed` in JobAZ

### Environment variables (`.env.local`)

Required:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional (auto-seed starter posts when feed is empty):

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### How to test

1. Guest — browse `/feed` (read-only)
2. Sign in — profile auto-created in `feed_profiles`
3. Create post — persists after refresh
4. Like / Save / Comment — persist in Supabase
5. Follow user — Friends filter shows their posts
6. Join group — My Groups filter works
