-- Connected AI career system: journey timeline, weekly focus, stage sync.

ALTER TABLE public.ai_user_profiles
  ADD COLUMN IF NOT EXISTS weekly_focus text,
  ADD COLUMN IF NOT EXISTS ai_journey_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_ai_update timestamptz,
  ADD COLUMN IF NOT EXISTS current_stage text;

-- Backfill current_stage from career_stage for existing rows.
UPDATE public.ai_user_profiles
SET current_stage = career_stage
WHERE current_stage IS NULL AND career_stage IS NOT NULL;

UPDATE public.ai_user_profiles
SET last_ai_update = COALESCE(last_ai_update, last_active_at, updated_at)
WHERE last_ai_update IS NULL;
