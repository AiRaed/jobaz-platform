-- =============================================================================
-- JobAZ Career Feed — RUN THIS IN SUPABASE SQL EDITOR
-- =============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard → SQL Editor → New query
-- 2. Paste this ENTIRE file and click Run
-- 3. Wait for success, then refresh your JobAZ /feed page
-- Requires: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
-- Optional bootstrap API: SUPABASE_SERVICE_ROLE_KEY for auto-seed when empty
-- =============================================================================

-- JobAZ Career Feed — Phase 1 MVP
-- Social feed tables with RLS + official groups + seed posts

-- ---------------------------------------------------------------------------
-- feed_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  headline text,
  career_path text,
  location text,
  career_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_profiles_display_name ON public.feed_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_feed_profiles_created_at ON public.feed_profiles(created_at DESC);

-- ---------------------------------------------------------------------------
-- feed_groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text,
  icon text,
  created_by uuid REFERENCES public.feed_profiles(id) ON DELETE SET NULL,
  is_official boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_groups_slug ON public.feed_groups(slug);
CREATE INDEX IF NOT EXISTS idx_feed_groups_is_official ON public.feed_groups(is_official);

-- ---------------------------------------------------------------------------
-- feed_posts
-- author_display_name: denormalized label for JobAZ seed posts (author_id null)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.feed_profiles(id) ON DELETE SET NULL,
  author_display_name text,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'general'
    CHECK (post_type IN ('general', 'win', 'question', 'job_tip', 'training', 'project', 'business_idea', 'success_story')),
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'friends', 'group')),
  image_url text,
  video_url text,
  career_path text,
  location text,
  is_jobaz_post boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_author_id ON public.feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_post_type ON public.feed_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_is_jobaz ON public.feed_posts(is_jobaz_post);

-- ---------------------------------------------------------------------------
-- feed_comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON public.feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_author_id ON public.feed_comments(author_id);

-- ---------------------------------------------------------------------------
-- feed_reactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_post_id ON public.feed_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user_id ON public.feed_reactions(user_id);

-- ---------------------------------------------------------------------------
-- feed_saved_posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_saved_posts_user_id ON public.feed_saved_posts(user_id);

-- ---------------------------------------------------------------------------
-- feed_follows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_follows_follower ON public.feed_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_feed_follows_following ON public.feed_follows(following_id);

-- ---------------------------------------------------------------------------
-- feed_group_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.feed_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_group_members_user ON public.feed_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_group_members_group ON public.feed_group_members(group_id);

-- ---------------------------------------------------------------------------
-- feed_post_groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_post_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.feed_groups(id) ON DELETE CASCADE,
  UNIQUE (post_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_post_groups_post ON public.feed_post_groups(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_groups_group ON public.feed_post_groups(group_id);

-- ---------------------------------------------------------------------------
-- Auto-create feed profile on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_feed_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.feed_profiles (id, display_name, avatar_url, headline)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'headline'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_feed_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_feed_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_feed_profile();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.feed_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe re-run)
DROP POLICY IF EXISTS "feed_profiles_select_public" ON public.feed_profiles;
DROP POLICY IF EXISTS "feed_profiles_insert_own" ON public.feed_profiles;
DROP POLICY IF EXISTS "feed_profiles_update_own" ON public.feed_profiles;
DROP POLICY IF EXISTS "feed_groups_select_all" ON public.feed_groups;
DROP POLICY IF EXISTS "feed_groups_insert_auth" ON public.feed_groups;
DROP POLICY IF EXISTS "feed_groups_update_creator" ON public.feed_groups;
DROP POLICY IF EXISTS "feed_posts_select_public" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_insert_own" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_update_own" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_delete_own" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_comments_select_all" ON public.feed_comments;
DROP POLICY IF EXISTS "feed_comments_insert_own" ON public.feed_comments;
DROP POLICY IF EXISTS "feed_comments_delete_own" ON public.feed_comments;
DROP POLICY IF EXISTS "feed_reactions_select_all" ON public.feed_reactions;
DROP POLICY IF EXISTS "feed_reactions_insert_own" ON public.feed_reactions;
DROP POLICY IF EXISTS "feed_reactions_delete_own" ON public.feed_reactions;
DROP POLICY IF EXISTS "feed_saved_select_own" ON public.feed_saved_posts;
DROP POLICY IF EXISTS "feed_saved_insert_own" ON public.feed_saved_posts;
DROP POLICY IF EXISTS "feed_saved_delete_own" ON public.feed_saved_posts;
DROP POLICY IF EXISTS "feed_follows_select_related" ON public.feed_follows;
DROP POLICY IF EXISTS "feed_follows_insert_own" ON public.feed_follows;
DROP POLICY IF EXISTS "feed_follows_delete_own" ON public.feed_follows;
DROP POLICY IF EXISTS "feed_group_members_select_all" ON public.feed_group_members;
DROP POLICY IF EXISTS "feed_group_members_insert_own" ON public.feed_group_members;
DROP POLICY IF EXISTS "feed_group_members_delete_own" ON public.feed_group_members;
DROP POLICY IF EXISTS "feed_post_groups_select_all" ON public.feed_post_groups;
DROP POLICY IF EXISTS "feed_post_groups_insert_auth" ON public.feed_post_groups;

-- feed_profiles
CREATE POLICY "feed_profiles_select_public"
  ON public.feed_profiles FOR SELECT
  USING (true);

CREATE POLICY "feed_profiles_insert_own"
  ON public.feed_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "feed_profiles_update_own"
  ON public.feed_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- feed_groups
CREATE POLICY "feed_groups_select_all"
  ON public.feed_groups FOR SELECT
  USING (true);

CREATE POLICY "feed_groups_insert_auth"
  ON public.feed_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "feed_groups_update_creator"
  ON public.feed_groups FOR UPDATE
  USING (auth.uid() = created_by);

-- feed_posts
CREATE POLICY "feed_posts_select_public"
  ON public.feed_posts FOR SELECT
  USING (
    visibility = 'public'
    OR is_jobaz_post = true
    OR author_id = auth.uid()
  );

CREATE POLICY "feed_posts_insert_own"
  ON public.feed_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "feed_posts_update_own"
  ON public.feed_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "feed_posts_delete_own"
  ON public.feed_posts FOR DELETE
  USING (auth.uid() = author_id);

-- feed_comments
CREATE POLICY "feed_comments_select_all"
  ON public.feed_comments FOR SELECT
  USING (true);

CREATE POLICY "feed_comments_insert_own"
  ON public.feed_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "feed_comments_delete_own"
  ON public.feed_comments FOR DELETE
  USING (auth.uid() = author_id);

-- feed_reactions
CREATE POLICY "feed_reactions_select_all"
  ON public.feed_reactions FOR SELECT
  USING (true);

CREATE POLICY "feed_reactions_insert_own"
  ON public.feed_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_reactions_delete_own"
  ON public.feed_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- feed_saved_posts
CREATE POLICY "feed_saved_select_own"
  ON public.feed_saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "feed_saved_insert_own"
  ON public.feed_saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_saved_delete_own"
  ON public.feed_saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- feed_follows
CREATE POLICY "feed_follows_select_related"
  ON public.feed_follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "feed_follows_insert_own"
  ON public.feed_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "feed_follows_delete_own"
  ON public.feed_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- feed_group_members
CREATE POLICY "feed_group_members_select_all"
  ON public.feed_group_members FOR SELECT
  USING (true);

CREATE POLICY "feed_group_members_insert_own"
  ON public.feed_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_group_members_delete_own"
  ON public.feed_group_members FOR DELETE
  USING (auth.uid() = user_id);

-- feed_post_groups
CREATE POLICY "feed_post_groups_select_all"
  ON public.feed_post_groups FOR SELECT
  USING (true);

CREATE POLICY "feed_post_groups_insert_auth"
  ON public.feed_post_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grants (feed tables only)
GRANT SELECT ON public.feed_profiles, public.feed_groups, public.feed_posts, public.feed_comments, public.feed_reactions, public.feed_post_groups, public.feed_group_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_profiles, public.feed_groups, public.feed_posts, public.feed_comments, public.feed_reactions, public.feed_saved_posts, public.feed_follows, public.feed_group_members, public.feed_post_groups TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed official groups
-- ---------------------------------------------------------------------------
INSERT INTO public.feed_groups (name, slug, description, category, icon, is_official)
VALUES
  ('Warehouse & Logistics UK', 'warehouse-logistics-uk', 'Entry roles, shift patterns, and agency advice for warehouse work.', 'Logistics', '📦', true),
  ('Newcastle Job Seekers', 'newcastle-job-seekers', 'Local jobs, agencies, and support for job seekers in Newcastle.', 'Local', '🏙️', true),
  ('UK Drivers Network', 'uk-drivers-network', 'Delivery, taxi, and logistics drivers sharing routes and hiring tips.', 'Transport', '🚗', true),
  ('Beginner English Support', 'beginner-english-support', 'Workplace English and interview confidence for new speakers.', 'Language', '💬', true),
  ('Customer Service Careers', 'customer-service-careers', 'Retail, hospitality, and call centre career paths in the UK.', 'Service', '🎧', true),
  ('Junior Tech & IT Support', 'junior-tech-it-support', 'Entry IT roles, certifications, and helpdesk career advice.', 'Technology', '💻', true),
  ('JobAZ Success Stories', 'jobaz-success-stories', 'Wins, first interviews, and career milestones from the community.', 'Motivation', '🌟', true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed JobAZ community posts (author_id null, is_jobaz_post true)
-- ---------------------------------------------------------------------------
INSERT INTO public.feed_posts (author_display_name, content, post_type, visibility, career_path, is_jobaz_post, image_url)
SELECT v.author_name, v.content, v.post_type, 'public', v.career_path, true, v.image_url
FROM (VALUES
  ('Ahmed', 'Got my first warehouse interview after updating my CV on JobAZ. Thank you everyone.', 'success_story', 'Warehouse Path', NULL),
  ('Sara', 'Does anyone know beginner-friendly jobs in Newcastle with flexible shifts?', 'question', 'Customer Service', NULL),
  ('Omar', 'Uber demand was crazy this weekend in Manchester. Good reminder that driving gigs can bridge income while job hunting.', 'job_tip', 'Driving & Logistics', NULL),
  ('Maya', 'Passed my Google IT Support certificate today. Small steps toward junior IT roles — happy to share what helped.', 'win', 'Junior IT', NULL),
  ('Community member', 'I struggle with interview anxiety. My mind goes blank even when I know the answers. Any advice from people who overcame this?', 'question', 'Career seeker', NULL),
  ('JobAZ Community', 'New warehouse jobs added today across the UK. Check Job Finder for roles near you — share which ones you applied to.', 'job_tip', 'Community team', NULL),
  ('Fatima K.', 'Before vs after using JobAZ CV builder. My old CV was one block of text — now recruiters actually reply.', 'success_story', 'Customer Service Path', NULL),
  ('James T.', 'First day at my new warehouse supervisor role today. Six months ago I was unemployed. This community kept me going.', 'success_story', 'Warehouse Supervisor', NULL),
  ('Priya S.', 'Quick tip: many care homes accept applicants without prior UK care experience if you show reliability. DBS can take 2–3 weeks — start early.', 'training', 'Healthcare Assistant', NULL)
) AS v(author_name, content, post_type, career_path, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.feed_posts WHERE is_jobaz_post = true LIMIT 1);

-- Link seed posts to groups
INSERT INTO public.feed_post_groups (post_id, group_id)
SELECT p.id, g.id
FROM public.feed_posts p
CROSS JOIN public.feed_groups g
WHERE p.is_jobaz_post = true
  AND (
    (p.author_display_name = 'Ahmed' AND g.slug = 'jobaz-success-stories')
    OR (p.author_display_name = 'Sara' AND g.slug = 'newcastle-job-seekers')
    OR (p.author_display_name = 'Omar' AND g.slug = 'uk-drivers-network')
    OR (p.author_display_name = 'Maya' AND g.slug = 'junior-tech-it-support')
    OR (p.author_display_name = 'JobAZ Community' AND g.slug = 'warehouse-logistics-uk')
    OR (p.author_display_name = 'James T.' AND g.slug = 'jobaz-success-stories')
    OR (p.author_display_name = 'Priya S.' AND g.slug = 'customer-service-careers')
  )
ON CONFLICT DO NOTHING;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
