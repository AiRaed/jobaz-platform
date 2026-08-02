-- JAZ Plan Engine v1 — persisted action plans + steps.
-- Safe / repeatable. Server inserts via service role; users can read/update own rows.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.jaz_user_action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL,
  anonymous_id text NULL,
  career_plan_id text NULL,
  goal_path text NULL,
  route_title text NULL,
  current_focus text NULL,
  next_upgrade text NULL,
  readiness int NULL,
  plan_source text NULL,
  ai_provider text NULL,
  engine_version text NULL,
  next_best_action jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_plan jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS jaz_user_action_plans_user_id_idx
  ON public.jaz_user_action_plans (user_id);
CREATE INDEX IF NOT EXISTS jaz_user_action_plans_created_at_idx
  ON public.jaz_user_action_plans (created_at DESC);
CREATE INDEX IF NOT EXISTS jaz_user_action_plans_goal_path_idx
  ON public.jaz_user_action_plans (goal_path);

CREATE TABLE IF NOT EXISTS public.jaz_plan_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  action_plan_id uuid NOT NULL REFERENCES public.jaz_user_action_plans(id) ON DELETE CASCADE,
  user_id uuid NULL,
  step_key text NOT NULL,
  title text NOT NULL,
  description text NULL,
  category text NULL,
  priority text NULL,
  status text NOT NULL DEFAULT 'not_started',
  cta_label text NULL,
  cta_target text NULL,
  why_it_matters text NULL,
  estimated_time text NULL,
  sort_order int NOT NULL DEFAULT 0,
  completed_at timestamptz NULL,
  skipped_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS jaz_plan_steps_action_plan_id_idx
  ON public.jaz_plan_steps (action_plan_id);
CREATE INDEX IF NOT EXISTS jaz_plan_steps_user_id_idx
  ON public.jaz_plan_steps (user_id);
CREATE INDEX IF NOT EXISTS jaz_plan_steps_status_idx
  ON public.jaz_plan_steps (status);

ALTER TABLE public.jaz_user_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jaz_plan_steps ENABLE ROW LEVEL SECURITY;

-- Users can read their own plans/steps
DROP POLICY IF EXISTS jaz_user_action_plans_select_own ON public.jaz_user_action_plans;
CREATE POLICY jaz_user_action_plans_select_own
  ON public.jaz_user_action_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jaz_user_action_plans_update_own ON public.jaz_user_action_plans;
CREATE POLICY jaz_user_action_plans_update_own
  ON public.jaz_user_action_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS jaz_plan_steps_select_own ON public.jaz_plan_steps;
CREATE POLICY jaz_plan_steps_select_own
  ON public.jaz_plan_steps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jaz_plan_steps_update_own ON public.jaz_plan_steps;
CREATE POLICY jaz_plan_steps_update_own
  ON public.jaz_plan_steps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No public insert policies — writes go through server (service role).

COMMENT ON TABLE public.jaz_user_action_plans IS
  'JAZ Plan Engine v1 — saved career operating plans (no raw CV text).';
COMMENT ON TABLE public.jaz_plan_steps IS
  'JAZ Plan Engine v1 — actionable steps with status for My Plan.';
