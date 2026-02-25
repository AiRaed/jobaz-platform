-- Analytics: user activity events and aggregated metrics
-- Used by lib/analytics/logEvent.ts

-- Activity events (one row per event)
CREATE TABLE IF NOT EXISTS public.user_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_events_user_id ON public.user_activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_events_created_at ON public.user_activity_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_events_event_name ON public.user_activity_events(event_name);

ALTER TABLE public.user_activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own activity events"
  ON public.user_activity_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role / backend will write; users don't need to read their own events from client
CREATE POLICY "Users can select own activity events"
  ON public.user_activity_events FOR SELECT
  USING (auth.uid() = user_id);

-- Metrics (one row per user, updated on events)
CREATE TABLE IF NOT EXISTS public.user_metrics (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_logins int NOT NULL DEFAULT 0,
  total_cvs int NOT NULL DEFAULT 0,
  total_cover_letters int NOT NULL DEFAULT 0,
  total_saved_jobs int NOT NULL DEFAULT 0,
  total_applied_jobs int NOT NULL DEFAULT 0,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own metrics"
  ON public.user_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON public.user_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON public.user_metrics FOR UPDATE
  USING (auth.uid() = user_id);
