-- JobAZ Pulse Phase 1 launch — extend existing feed tables + AI suggestions
-- Safe / repeatable. Does not drop data. Creates missing tables first.

-- =============================================================================
-- 1) Ensure core feed_posts exists (no-op if already present)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  author_display_name text,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'general',
  visibility text NOT NULL DEFAULT 'public',
  image_url text,
  video_url text,
  career_path text,
  location text,
  is_jobaz_post boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2) Phase 1 admin fields on feed_posts
-- =============================================================================

ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS circle text NOT NULL DEFAULT 'general';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS ai_suggested boolean NOT NULL DEFAULT false;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS ai_notes text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_official_post boolean NOT NULL DEFAULT false;

-- Expand post_type (keep legacy + Phase 1 admin types)
ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;
ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_post_type_check CHECK (
  post_type IN (
    'general', 'discussion', 'question', 'win', 'success_story',
    'job_tip', 'training', 'project', 'business_idea', 'opportunity',
    'announcement',
    'career_advice', 'course_guide', 'job_search_tip', 'small_business_idea', 'video'
  )
);

-- Expand visibility
ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_visibility_check;
ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_visibility_check CHECK (
  visibility IN ('public', 'friends', 'group', 'logged_in', 'internal')
);

-- Expand status
ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_status_check;
ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_status_check CHECK (
  status IN ('draft', 'pending_review', 'published', 'archived')
);

-- Backfill: treat existing rows as published (launch-safe)
UPDATE public.feed_posts
SET status = 'published',
    published_at = COALESCE(published_at, created_at)
WHERE status IS NULL OR (status = 'published' AND published_at IS NULL);

UPDATE public.feed_posts
SET created_by_admin = true,
    is_jobaz_post = true,
    is_official_post = true,
    author_display_name = COALESCE(NULLIF(author_display_name, ''), 'JobAZ Career Team')
WHERE is_jobaz_post = true OR is_official_post = true;

-- =============================================================================
-- 3) pulse_ai_suggestions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pulse_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  body text NOT NULL,
  post_type text NOT NULL DEFAULT 'career_advice',
  circle text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  reason text,
  video_url text,
  source_url text,
  status text NOT NULL DEFAULT 'suggested',
  converted_post_id uuid REFERENCES public.feed_posts(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pulse_ai_suggestions DROP CONSTRAINT IF EXISTS pulse_ai_suggestions_status_check;
ALTER TABLE public.pulse_ai_suggestions ADD CONSTRAINT pulse_ai_suggestions_status_check CHECK (
  status IN ('suggested', 'accepted', 'rejected', 'converted_to_post')
);

-- =============================================================================
-- 4) Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_feed_posts_status_published
  ON public.feed_posts (status, published_at DESC NULLS LAST)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_feed_posts_pinned
  ON public.feed_posts (pinned DESC, published_at DESC NULLS LAST)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_feed_posts_circle
  ON public.feed_posts (circle);

CREATE INDEX IF NOT EXISTS idx_feed_posts_created_by_admin
  ON public.feed_posts (created_by_admin)
  WHERE created_by_admin = true;

CREATE INDEX IF NOT EXISTS idx_pulse_ai_suggestions_date
  ON public.pulse_ai_suggestions (suggested_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pulse_ai_suggestions_status
  ON public.pulse_ai_suggestions (status);

-- =============================================================================
-- 5) RLS updates for published-only public reads
-- =============================================================================

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_posts_select_public" ON public.feed_posts;
CREATE POLICY "feed_posts_select_public"
  ON public.feed_posts FOR SELECT
  USING (
    author_id = auth.uid()
    OR (
      status = 'published'
      AND (
        visibility = 'public'
        OR (visibility = 'logged_in' AND auth.uid() IS NOT NULL)
        OR is_jobaz_post = true
      )
    )
  );

-- Users may insert their own posts (app sets pending_review for Phase 1)
DROP POLICY IF EXISTS "feed_posts_insert_own" ON public.feed_posts;
CREATE POLICY "feed_posts_insert_own"
  ON public.feed_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND COALESCE(created_by_admin, false) = false
    AND COALESCE(status, 'pending_review') IN ('draft', 'pending_review')
  );

DROP POLICY IF EXISTS "feed_posts_update_own" ON public.feed_posts;
CREATE POLICY "feed_posts_update_own"
  ON public.feed_posts FOR UPDATE
  USING (auth.uid() = author_id AND COALESCE(created_by_admin, false) = false)
  WITH CHECK (auth.uid() = author_id AND COALESCE(created_by_admin, false) = false);

-- AI suggestions: service role only (no public policies)
-- Admin CRUD uses SUPABASE_SERVICE_ROLE_KEY

COMMENT ON COLUMN public.feed_posts.status IS
  'draft | pending_review | published | archived. Public feed shows published only.';
COMMENT ON COLUMN public.feed_posts.created_by_admin IS
  'True when created from /admin/pulse. Shows as JobAZ Career Team.';
COMMENT ON TABLE public.pulse_ai_suggestions IS
  'Admin Pulse AI Content Planner drafts. Never auto-publish.';
