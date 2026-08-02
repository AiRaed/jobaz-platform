-- =============================================================================
-- JobAZ Pulse upgrade — additive migration (safe on existing feed tables)
-- Run after 20250528000000_create_feed_tables.sql
-- =============================================================================

-- feed_profiles extensions
ALTER TABLE public.feed_profiles ADD COLUMN IF NOT EXISTS profile_type text NOT NULL DEFAULT 'personal';
ALTER TABLE public.feed_profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.feed_profiles ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

-- feed_posts extensions
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_official_post boolean NOT NULL DEFAULT false;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS opportunity_title text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS opportunity_location text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS opportunity_type text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS opportunity_details text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS opportunity_status text NOT NULL DEFAULT 'open';
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS opportunity_pay text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS opportunity_contact_pref text;

-- Expand post_type constraint
ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;
ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_post_type_check CHECK (
  post_type IN (
    'general', 'discussion', 'question', 'win', 'success_story',
    'job_tip', 'training', 'project', 'business_idea', 'opportunity',
    'announcement'
  )
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_is_official ON public.feed_posts(is_official_post);
CREATE INDEX IF NOT EXISTS idx_feed_posts_opportunity ON public.feed_posts(post_type) WHERE post_type = 'opportunity';

-- Opportunity interests
CREATE TABLE IF NOT EXISTS public.feed_opportunity_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'interested',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_opp_interests_post ON public.feed_opportunity_interests(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_opp_interests_user ON public.feed_opportunity_interests(user_id);

ALTER TABLE public.feed_opportunity_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_opp_interests_select" ON public.feed_opportunity_interests;
DROP POLICY IF EXISTS "feed_opp_interests_insert" ON public.feed_opportunity_interests;
DROP POLICY IF EXISTS "feed_opp_interests_delete" ON public.feed_opportunity_interests;

CREATE POLICY "feed_opp_interests_select"
  ON public.feed_opportunity_interests FOR SELECT USING (true);

CREATE POLICY "feed_opp_interests_insert"
  ON public.feed_opportunity_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_opp_interests_delete"
  ON public.feed_opportunity_interests FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT ON public.feed_opportunity_interests TO anon;
GRANT SELECT, INSERT, DELETE ON public.feed_opportunity_interests TO authenticated;

-- pulse-media storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pulse-media',
  'pulse-media',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "pulse_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "pulse_media_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "pulse_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "pulse_media_auth_delete" ON storage.objects;

CREATE POLICY "pulse_media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'pulse-media');

CREATE POLICY "pulse_media_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pulse-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "pulse_media_auth_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'pulse-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "pulse_media_auth_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'pulse-media' AND auth.uid()::text = (storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
