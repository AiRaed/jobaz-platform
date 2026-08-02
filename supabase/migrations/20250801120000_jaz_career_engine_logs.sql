-- JAZ Career Engine logs + admin feedback
-- Safe / repeatable. Does not drop data.
-- Apply via Supabase SQL Editor if CLI is not linked.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1) Logs table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.jaz_career_engine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL,
  anonymous_id text NULL,
  session_id text NULL,
  goal_path text NOT NULL DEFAULT 'unknown',
  route_title text NULL,
  route_category text NULL,
  current_focus text NULL,
  next_upgrade text NULL,
  plan_source text NOT NULL DEFAULT 'jaz_fallback',
  ai_provider text NOT NULL DEFAULT 'fallback',
  engine_version text NULL,
  readiness integer NULL,
  recommended_course_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  matched_jobaz_courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_affiliate_opportunities jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  request_payload jsonb NULL,
  response_payload jsonb NULL,
  response_time_ms integer NULL,
  error_message text NULL
);

-- Backward-compatible columns if an older draft of this table already exists
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS user_id uuid NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS anonymous_id text NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS session_id text NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS goal_path text;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS route_title text NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS route_category text NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS current_focus text NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS next_upgrade text NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS plan_source text;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS ai_provider text;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS engine_version text NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS readiness integer NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS recommended_course_types jsonb;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS matched_jobaz_courses jsonb;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS missing_affiliate_opportunities jsonb;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS safety_warnings jsonb;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS request_payload jsonb NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS response_payload jsonb NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS response_time_ms integer NULL;
ALTER TABLE public.jaz_career_engine_logs ADD COLUMN IF NOT EXISTS error_message text NULL;

-- Migrate legacy column names if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jaz_career_engine_logs' AND column_name = 'safety_notes'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jaz_career_engine_logs' AND column_name = 'safety_warnings'
  ) THEN
    EXECUTE $q$
      UPDATE public.jaz_career_engine_logs
      SET safety_warnings = COALESCE(safety_warnings, '[]'::jsonb)
      WHERE (safety_warnings IS NULL OR safety_warnings = '[]'::jsonb)
        AND safety_notes IS NOT NULL
    $q$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jaz_career_engine_logs' AND column_name = 'duration_ms'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jaz_career_engine_logs' AND column_name = 'response_time_ms'
  ) THEN
    EXECUTE $q$
      UPDATE public.jaz_career_engine_logs
      SET response_time_ms = COALESCE(response_time_ms, duration_ms)
      WHERE response_time_ms IS NULL AND duration_ms IS NOT NULL
    $q$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jaz_career_engine_logs' AND column_name = 'ollama_error'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jaz_career_engine_logs' AND column_name = 'error_message'
  ) THEN
    EXECUTE $q$
      UPDATE public.jaz_career_engine_logs
      SET error_message = COALESCE(error_message, ollama_error)
      WHERE error_message IS NULL AND ollama_error IS NOT NULL
    $q$;
  END IF;
END $$;

UPDATE public.jaz_career_engine_logs
  SET recommended_course_types = '[]'::jsonb
  WHERE recommended_course_types IS NULL;
UPDATE public.jaz_career_engine_logs
  SET matched_jobaz_courses = '[]'::jsonb
  WHERE matched_jobaz_courses IS NULL;
UPDATE public.jaz_career_engine_logs
  SET missing_affiliate_opportunities = '[]'::jsonb
  WHERE missing_affiliate_opportunities IS NULL;
UPDATE public.jaz_career_engine_logs
  SET safety_warnings = '[]'::jsonb
  WHERE safety_warnings IS NULL;
UPDATE public.jaz_career_engine_logs
  SET goal_path = 'unknown'
  WHERE goal_path IS NULL OR btrim(goal_path) = '';
UPDATE public.jaz_career_engine_logs
  SET plan_source = 'jaz_fallback'
  WHERE plan_source IS NULL OR btrim(plan_source) = '';
UPDATE public.jaz_career_engine_logs
  SET ai_provider = 'fallback'
  WHERE ai_provider IS NULL OR btrim(ai_provider) = '';

ALTER TABLE public.jaz_career_engine_logs
  ALTER COLUMN recommended_course_types SET DEFAULT '[]'::jsonb;
ALTER TABLE public.jaz_career_engine_logs
  ALTER COLUMN matched_jobaz_courses SET DEFAULT '[]'::jsonb;
ALTER TABLE public.jaz_career_engine_logs
  ALTER COLUMN missing_affiliate_opportunities SET DEFAULT '[]'::jsonb;
ALTER TABLE public.jaz_career_engine_logs
  ALTER COLUMN safety_warnings SET DEFAULT '[]'::jsonb;
ALTER TABLE public.jaz_career_engine_logs
  ALTER COLUMN goal_path SET DEFAULT 'unknown';
ALTER TABLE public.jaz_career_engine_logs
  ALTER COLUMN plan_source SET DEFAULT 'jaz_fallback';
ALTER TABLE public.jaz_career_engine_logs
  ALTER COLUMN ai_provider SET DEFAULT 'fallback';

CREATE INDEX IF NOT EXISTS jaz_career_engine_logs_created_at_idx
  ON public.jaz_career_engine_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS jaz_career_engine_logs_goal_path_idx
  ON public.jaz_career_engine_logs (goal_path);
CREATE INDEX IF NOT EXISTS jaz_career_engine_logs_plan_source_idx
  ON public.jaz_career_engine_logs (plan_source);
CREATE INDEX IF NOT EXISTS jaz_career_engine_logs_ai_provider_idx
  ON public.jaz_career_engine_logs (ai_provider);

ALTER TABLE public.jaz_career_engine_logs ENABLE ROW LEVEL SECURITY;

-- No public/anon policies: service role bypasses RLS for server inserts & admin reads.
DROP POLICY IF EXISTS jaz_career_engine_logs_anon_select ON public.jaz_career_engine_logs;
DROP POLICY IF EXISTS jaz_career_engine_logs_public_select ON public.jaz_career_engine_logs;

COMMENT ON TABLE public.jaz_career_engine_logs IS
  'JAZ Career Engine analysis logs for admin Career Assistant monitoring.';

-- =============================================================================
-- 2) Feedback table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.jaz_career_engine_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES public.jaz_career_engine_logs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  feedback_type text NOT NULL,
  notes text NULL,
  admin_user_id uuid NULL,
  CONSTRAINT jaz_career_engine_feedback_type_check CHECK (
    feedback_type IN (
      'good_result',
      'wrong_route',
      'wrong_course',
      'missing_affiliate',
      'needs_better_explanation'
    )
  )
);

CREATE INDEX IF NOT EXISTS jaz_career_engine_feedback_log_id_idx
  ON public.jaz_career_engine_feedback (log_id);
CREATE INDEX IF NOT EXISTS jaz_career_engine_feedback_created_at_idx
  ON public.jaz_career_engine_feedback (created_at DESC);

ALTER TABLE public.jaz_career_engine_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jaz_career_engine_feedback_anon_select ON public.jaz_career_engine_feedback;

COMMENT ON TABLE public.jaz_career_engine_feedback IS
  'Admin feedback on JAZ Career Engine analysis logs.';
