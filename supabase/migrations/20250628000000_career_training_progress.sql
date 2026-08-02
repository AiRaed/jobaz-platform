-- Career training progress — tracks roadmap course/qualification actions per user

CREATE TABLE IF NOT EXISTS public.career_training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text,
  course_slug text NOT NULL,
  course_title text NOT NULL,
  path_id text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  source text NOT NULL DEFAULT 'roadmap',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_slug, path_id)
);

CREATE INDEX IF NOT EXISTS idx_career_training_progress_user_id
  ON public.career_training_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_career_training_progress_status
  ON public.career_training_progress(user_id, status);

ALTER TABLE public.career_training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own training progress" ON public.career_training_progress;
CREATE POLICY "users manage own training progress"
  ON public.career_training_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_training_progress TO authenticated;
