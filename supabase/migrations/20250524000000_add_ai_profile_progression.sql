-- AI Profile Progression Engine: career stage, strength/gap areas, progression dedupe meta.

ALTER TABLE public.ai_user_profiles
  ADD COLUMN IF NOT EXISTS career_stage text NOT NULL DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS strongest_area text,
  ADD COLUMN IF NOT EXISTS weakest_area text,
  ADD COLUMN IF NOT EXISTS progression_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_career_stage
  ON public.ai_user_profiles(career_stage);
