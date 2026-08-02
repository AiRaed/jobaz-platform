-- JobAZ AI Career Path Finder: assessment memory + event tracking
-- Public anonymous inserts; authenticated users can read their own linked rows.

CREATE TABLE IF NOT EXISTS public.ai_career_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id text,
  session_id text,
  answers jsonb NOT NULL,
  result jsonb NOT NULL,
  recommended_path text,
  recommended_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_career_assessments_user_id ON public.ai_career_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_assessments_anonymous_id ON public.ai_career_assessments(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_assessments_session_id ON public.ai_career_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_assessments_recommended_path ON public.ai_career_assessments(recommended_path);
CREATE INDEX IF NOT EXISTS idx_ai_career_assessments_created_at ON public.ai_career_assessments(created_at);

ALTER TABLE public.ai_career_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert ai career assessments"
  ON public.ai_career_assessments FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can select own ai career assessments"
  ON public.ai_career_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_career_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id text,
  session_id text,
  event_name text NOT NULL,
  page text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_career_events_user_id ON public.ai_career_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_events_anonymous_id ON public.ai_career_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_events_session_id ON public.ai_career_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_events_event_name ON public.ai_career_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ai_career_events_created_at ON public.ai_career_events(created_at);

ALTER TABLE public.ai_career_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert ai career events"
  ON public.ai_career_events FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can select own ai career events"
  ON public.ai_career_events FOR SELECT
  USING (auth.uid() = user_id);
