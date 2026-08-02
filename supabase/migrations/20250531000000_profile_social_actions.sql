-- Profile social analytics (follows use feed_follows — Pulse MVP)

CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_user_id);

CREATE TABLE IF NOT EXISTS public.profile_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text DEFAULT 'link',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_shares_profile ON public.profile_shares(profile_user_id);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_views_insert" ON public.profile_views;
DROP POLICY IF EXISTS "profile_views_select" ON public.profile_views;
CREATE POLICY "profile_views_insert" ON public.profile_views FOR INSERT
  WITH CHECK (viewer_id IS NULL OR viewer_id = auth.uid());
CREATE POLICY "profile_views_select" ON public.profile_views FOR SELECT
  USING (profile_user_id = auth.uid() OR viewer_id = auth.uid());

DROP POLICY IF EXISTS "profile_shares_insert" ON public.profile_shares;
DROP POLICY IF EXISTS "profile_shares_select" ON public.profile_shares;
CREATE POLICY "profile_shares_insert" ON public.profile_shares FOR INSERT
  WITH CHECK (shared_by IS NULL OR shared_by = auth.uid());
CREATE POLICY "profile_shares_select" ON public.profile_shares FOR SELECT
  USING (profile_user_id = auth.uid() OR shared_by = auth.uid());

GRANT SELECT, INSERT ON public.profile_views, public.profile_shares TO authenticated;
GRANT SELECT, INSERT ON public.profile_views TO anon;

NOTIFY pgrst, 'reload schema';
