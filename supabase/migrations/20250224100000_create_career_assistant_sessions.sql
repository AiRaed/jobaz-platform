-- Career Assistant session tracking
-- Used by uk-career-assistant flow and lib/analytics/logEvent (total_career_assessments)

CREATE TABLE IF NOT EXISTS public.career_assistant_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_role text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_assistant_sessions_user_id ON public.career_assistant_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_career_assistant_sessions_updated_at ON public.career_assistant_sessions(updated_at);

ALTER TABLE public.career_assistant_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own career assistant sessions"
  ON public.career_assistant_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own career assistant sessions"
  ON public.career_assistant_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own career assistant sessions"
  ON public.career_assistant_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Add total_career_assessments to user_metrics (if table already exists from analytics migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_metrics') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_metrics' AND column_name = 'total_career_assessments') THEN
      ALTER TABLE public.user_metrics ADD COLUMN total_career_assessments int NOT NULL DEFAULT 0;
    END IF;
  END IF;
END $$;
