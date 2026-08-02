-- JAZ Learning Loop — user activity events for Career Engine analytics.
-- Safe / repeatable. No public read access.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.jaz_user_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL,
  anonymous_id text NULL,
  session_id text NULL,
  event_type text NOT NULL,
  event_source text NULL,
  page_path text NULL,
  goal_path text NULL,
  route_title text NULL,
  career_plan_id text NULL,
  job_id text NULL,
  course_id text NULL,
  provider_id text NULL,
  tool_name text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  referrer text NULL,
  device_type text NULL
);

CREATE INDEX IF NOT EXISTS jaz_user_activity_events_created_at_idx
  ON public.jaz_user_activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS jaz_user_activity_events_event_type_idx
  ON public.jaz_user_activity_events (event_type);
CREATE INDEX IF NOT EXISTS jaz_user_activity_events_goal_path_idx
  ON public.jaz_user_activity_events (goal_path);
CREATE INDEX IF NOT EXISTS jaz_user_activity_events_route_title_idx
  ON public.jaz_user_activity_events (route_title);
CREATE INDEX IF NOT EXISTS jaz_user_activity_events_user_id_idx
  ON public.jaz_user_activity_events (user_id);

ALTER TABLE public.jaz_user_activity_events ENABLE ROW LEVEL SECURITY;

-- No anon/public policies: inserts via service role from server; admin reads via service role.
DROP POLICY IF EXISTS jaz_user_activity_events_anon_select ON public.jaz_user_activity_events;
DROP POLICY IF EXISTS jaz_user_activity_events_public_select ON public.jaz_user_activity_events;

COMMENT ON TABLE public.jaz_user_activity_events IS
  'JAZ Learning Loop — safe product analytics events (no raw CV/PII payloads).';
