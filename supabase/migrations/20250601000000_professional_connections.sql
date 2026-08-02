-- JobAZ professional connections (Connect + Follow Business)

-- ---------------------------------------------------------------------------
-- profile_connections (personal networking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'connected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_connections_no_self CHECK (requester_id <> target_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_connections_pair
  ON public.profile_connections (requester_id, target_user_id);

CREATE INDEX IF NOT EXISTS idx_profile_connections_target ON public.profile_connections(target_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_connections_status ON public.profile_connections(status);

-- ---------------------------------------------------------------------------
-- business_followers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_followers_unique UNIQUE (follower_id, business_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_business_followers_profile ON public.business_followers(business_profile_id);

-- ---------------------------------------------------------------------------
-- business slug for public URLs
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS business_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_profiles_slug_lower
  ON public.business_profiles (lower(business_slug))
  WHERE business_slug IS NOT NULL AND business_slug <> '';

-- ---------------------------------------------------------------------------
-- profile_views — align with profiles.id
-- ---------------------------------------------------------------------------
ALTER TABLE public.profile_views
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.profile_views
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz;

UPDATE public.profile_views pv
SET profile_id = p.id,
    viewed_at = COALESCE(pv.viewed_at, pv.created_at)
FROM public.profiles p
WHERE pv.profile_user_id = p.user_id AND pv.profile_id IS NULL;

-- ---------------------------------------------------------------------------
-- profile_shares — align with profiles.id
-- ---------------------------------------------------------------------------
ALTER TABLE public.profile_shares
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.profile_shares
  ADD COLUMN IF NOT EXISTS shared_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

UPDATE public.profile_shares ps
SET shared_profile_id = p.id,
    user_id = COALESCE(ps.user_id, ps.shared_by)
FROM public.profiles p
WHERE ps.profile_user_id = p.user_id AND ps.shared_profile_id IS NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profile_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_connections_select" ON public.profile_connections;
DROP POLICY IF EXISTS "profile_connections_insert" ON public.profile_connections;
DROP POLICY IF EXISTS "profile_connections_update" ON public.profile_connections;
DROP POLICY IF EXISTS "profile_connections_delete" ON public.profile_connections;

CREATE POLICY "profile_connections_select" ON public.profile_connections FOR SELECT
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "profile_connections_insert" ON public.profile_connections FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "profile_connections_update" ON public.profile_connections FOR UPDATE
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "profile_connections_delete" ON public.profile_connections FOR DELETE
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

DROP POLICY IF EXISTS "business_followers_select" ON public.business_followers;
DROP POLICY IF EXISTS "business_followers_insert" ON public.business_followers;
DROP POLICY IF EXISTS "business_followers_delete" ON public.business_followers;

CREATE POLICY "business_followers_select" ON public.business_followers FOR SELECT
  USING (true);

CREATE POLICY "business_followers_insert" ON public.business_followers FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "business_followers_delete" ON public.business_followers FOR DELETE
  USING (follower_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_connections TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.business_followers TO authenticated;

NOTIFY pgrst, 'reload schema';
