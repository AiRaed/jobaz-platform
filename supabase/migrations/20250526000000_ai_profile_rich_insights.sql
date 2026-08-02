-- Rich AI Career Path insights persisted on user profiles.

ALTER TABLE public.ai_user_profiles
  ADD COLUMN IF NOT EXISTS recommendation_reason text,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS action_plan jsonb NOT NULL DEFAULT '{}'::jsonb;
