-- JobAZ Career Identity Phase 1 — private matching profile
-- Safe / repeatable. Does not drop existing identity tables.

CREATE TABLE IF NOT EXISTS public.user_career_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_situation text,
  main_goal text,
  preferred_route text,
  target_role text,
  career_status text,
  preferred_location text,
  remote_preference text,
  job_type text[] NOT NULL DEFAULT '{}',
  availability text,
  has_driving_licence boolean NOT NULL DEFAULT false,
  has_own_car boolean NOT NULL DEFAULT false,
  willing_to_train boolean NOT NULL DEFAULT true,
  preferred_salary text,
  skills text[] NOT NULL DEFAULT '{}',
  industries_experience text[] NOT NULL DEFAULT '{}',
  experience_level text,
  languages text[] NOT NULL DEFAULT '{}',
  education_summary text,
  qualifications text[] NOT NULL DEFAULT '{}',
  licences text[] NOT NULL DEFAULT '{}',
  interested_in_courses boolean NOT NULL DEFAULT true,
  interested_in_jobs boolean NOT NULL DEFAULT true,
  interested_in_local_opportunities boolean NOT NULL DEFAULT true,
  interested_in_side_income boolean NOT NULL DEFAULT false,
  interested_in_business_ideas boolean NOT NULL DEFAULT false,
  interested_categories text[] NOT NULL DEFAULT '{}',
  short_bio text,
  looking_for text,
  barriers text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_career_identity_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_career_identity_user
  ON public.user_career_identity (user_id);

CREATE INDEX IF NOT EXISTS idx_user_career_identity_goal
  ON public.user_career_identity (main_goal);

ALTER TABLE public.user_career_identity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_identity_select_own" ON public.user_career_identity;
CREATE POLICY "career_identity_select_own"
  ON public.user_career_identity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "career_identity_insert_own" ON public.user_career_identity;
CREATE POLICY "career_identity_insert_own"
  ON public.user_career_identity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "career_identity_update_own" ON public.user_career_identity;
CREATE POLICY "career_identity_update_own"
  ON public.user_career_identity FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_career_identity IS
  'Phase 1 private career identity for matching (jobs, courses, opportunities, emails). Not a public social profile.';
