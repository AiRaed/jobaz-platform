-- JobAZ AI User Profile Layer — long-term intelligence per visitor/user.
-- Feeds future: private AI context, returning-user personalization, dashboard recommendations, JobAZ AI memory.
--
-- RLS note: anonymous rows cannot be scoped to request anonymous_id without custom JWT claims.
-- INSERT/UPDATE/SELECT on user_id IS NULL rows are permissive for MVP; tighten when client auth binding exists.

CREATE TABLE IF NOT EXISTS public.ai_user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id text,
  session_id text,
  dominant_goal text,
  english_level text,
  experience_level text,
  cv_status text,
  last_recommended_path text,
  preferred_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_jobs jsonb NOT NULL DEFAULT '[]'::jsonb,
  readiness_score integer NOT NULL DEFAULT 0,
  engagement_score integer NOT NULL DEFAULT 0,
  assessment_count integer NOT NULL DEFAULT 0,
  last_assessment_id uuid REFERENCES public.ai_career_assessments(id) ON DELETE SET NULL,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_user_id ON public.ai_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_anonymous_id ON public.ai_user_profiles(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_session_id ON public.ai_user_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_last_recommended_path ON public.ai_user_profiles(last_recommended_path);
CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_last_active_at ON public.ai_user_profiles(last_active_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_user_profiles_user_id_unique
  ON public.ai_user_profiles(user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_user_profiles_anonymous_id_unique
  ON public.ai_user_profiles(anonymous_id)
  WHERE anonymous_id IS NOT NULL AND user_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_ai_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_user_profiles_updated_at ON public.ai_user_profiles;
CREATE TRIGGER trg_ai_user_profiles_updated_at
  BEFORE UPDATE ON public.ai_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ai_user_profiles_updated_at();

ALTER TABLE public.ai_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert ai user profiles"
  ON public.ai_user_profiles FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
  );

-- MVP: authenticated users see only their rows; anonymous rows readable for client upsert (tighten later).
CREATE POLICY "Select ai user profiles"
  ON public.ai_user_profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  );

CREATE POLICY "Update ai user profiles"
  ON public.ai_user_profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );
