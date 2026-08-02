-- =============================================================================
-- JobAZ Identity Profiles — RUN THIS IN SUPABASE SQL EDITOR
-- =============================================================================
-- Personal Career + Small Business profiles, experience, skills, media storage
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles (professional identity root)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type text NOT NULL DEFAULT 'personal'
    CHECK (profile_type IN ('personal', 'business')),
  username text,
  headline text,
  bio text,
  location text,
  avatar_url text,
  banner_url text,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'recruiter')),
  trust_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND username <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON public.profiles(profile_type);

-- ---------------------------------------------------------------------------
-- personal_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personal_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  career_score integer NOT NULL DEFAULT 0,
  ats_score integer NOT NULL DEFAULT 0,
  interview_score integer NOT NULL DEFAULT 0,
  recruiter_visible boolean NOT NULL DEFAULT false,
  current_focus text,
  cv_status text,
  interview_readiness text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- business_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text,
  category text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  business_description text,
  business_phone text,
  business_email text,
  website text,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  business_verified boolean NOT NULL DEFAULT false,
  contact_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_trust_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- profile_experience
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  start_date text,
  end_date text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_experience_profile ON public.profile_experience(profile_id);

-- ---------------------------------------------------------------------------
-- profile_education
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  start_date text,
  end_date text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_education_profile ON public.profile_education(profile_id);

-- ---------------------------------------------------------------------------
-- profile_skills
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  strength_score integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON public.profile_skills(profile_id);

-- ---------------------------------------------------------------------------
-- profile_media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video')),
  media_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_media_profile ON public.profile_media(profile_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (visibility IN ('public', 'recruiter') OR user_id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- personal_profiles
DROP POLICY IF EXISTS "personal_profiles_select" ON public.personal_profiles;
DROP POLICY IF EXISTS "personal_profiles_mutate" ON public.personal_profiles;
CREATE POLICY "personal_profiles_select"
  ON public.personal_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND (p.visibility IN ('public','recruiter') OR p.user_id = auth.uid()))
  );
CREATE POLICY "personal_profiles_mutate"
  ON public.personal_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

-- business_profiles
DROP POLICY IF EXISTS "business_profiles_select" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_mutate" ON public.business_profiles;
CREATE POLICY "business_profiles_select"
  ON public.business_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND (p.visibility IN ('public','recruiter') OR p.user_id = auth.uid()))
  );
CREATE POLICY "business_profiles_mutate"
  ON public.business_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

-- child tables (experience, education, skills, media)
DROP POLICY IF EXISTS "profile_experience_select" ON public.profile_experience;
DROP POLICY IF EXISTS "profile_experience_mutate" ON public.profile_experience;
CREATE POLICY "profile_experience_select" ON public.profile_experience FOR SELECT USING (true);
CREATE POLICY "profile_experience_mutate" ON public.profile_experience FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "profile_education_select" ON public.profile_education;
DROP POLICY IF EXISTS "profile_education_mutate" ON public.profile_education;
CREATE POLICY "profile_education_select" ON public.profile_education FOR SELECT USING (true);
CREATE POLICY "profile_education_mutate" ON public.profile_education FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "profile_skills_select" ON public.profile_skills;
DROP POLICY IF EXISTS "profile_skills_mutate" ON public.profile_skills;
CREATE POLICY "profile_skills_select" ON public.profile_skills FOR SELECT USING (true);
CREATE POLICY "profile_skills_mutate" ON public.profile_skills FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "profile_media_select" ON public.profile_media;
DROP POLICY IF EXISTS "profile_media_mutate" ON public.profile_media;
CREATE POLICY "profile_media_select" ON public.profile_media FOR SELECT USING (true);
CREATE POLICY "profile_media_mutate" ON public.profile_media FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

-- Grants
GRANT SELECT ON public.profiles, public.personal_profiles, public.business_profiles,
  public.profile_experience, public.profile_education, public.profile_skills, public.profile_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.personal_profiles, public.business_profiles,
  public.profile_experience, public.profile_education, public.profile_skills, public.profile_media TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets (avatars, banners, business-media)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('banners', 'banners', true, 8388608, ARRAY['image/jpeg','image/png','image/webp']),
  ('business-media', 'business-media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_auth_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "banners_public_read" ON storage.objects;
DROP POLICY IF EXISTS "banners_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "banners_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "banners_auth_delete" ON storage.objects;

CREATE POLICY "banners_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "banners_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "banners_auth_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "banners_auth_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "business_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "business_media_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "business_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "business_media_auth_delete" ON storage.objects;

CREATE POLICY "business_media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'business-media');

CREATE POLICY "business_media_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "business_media_auth_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'business-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "business_media_auth_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'business-media' AND auth.uid()::text = (storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
