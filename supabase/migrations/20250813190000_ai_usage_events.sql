-- MVP AI usage guard — cost-control events for public OpenAI tools.
-- Server inserts via service role. No public read of other users.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  anonymous_id text NULL,
  tool_category text NOT NULL,
  action_name text NOT NULL,
  provider text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_events_user_category_created_idx
  ON public.ai_usage_events (user_id, tool_category, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_events_anon_category_created_idx
  ON public.ai_usage_events (anonymous_id, tool_category, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_usage_events_select_own ON public.ai_usage_events;
CREATE POLICY ai_usage_events_select_own
  ON public.ai_usage_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserts are server-side (service role). No anon/authenticated insert policy.

COMMENT ON TABLE public.ai_usage_events IS
  'MVP AI usage guard events for public OpenAI tools (CV, cover, writing, interview, apply).';
