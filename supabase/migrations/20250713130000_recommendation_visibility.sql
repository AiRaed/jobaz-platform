-- Recommendation card visibility + Google search click tracking

ALTER TABLE public.course_opportunities
  ADD COLUMN IF NOT EXISTS visibility_status text NOT NULL DEFAULT 'internal';

CREATE INDEX IF NOT EXISTS idx_course_opportunities_visibility_status
  ON public.course_opportunities(visibility_status);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS visibility_status text NOT NULL DEFAULT 'public_listed';

CREATE TABLE IF NOT EXISTS public.course_google_search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'course_google_search_click',
  course_opportunity_id uuid REFERENCES public.course_opportunities(id) ON DELETE SET NULL,
  published_course_id uuid,
  title text NOT NULL,
  suggested_search_keywords text,
  source text NOT NULL DEFAULT 'career_coach_result',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_google_search_events_created
  ON public.course_google_search_events(created_at DESC);

ALTER TABLE public.course_google_search_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_google_search_events_insert ON public.course_google_search_events;
CREATE POLICY course_google_search_events_insert ON public.course_google_search_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS course_google_search_events_admin_read ON public.course_google_search_events;
CREATE POLICY course_google_search_events_admin_read ON public.course_google_search_events
  FOR SELECT USING (public.is_jobaz_admin());

NOTIFY pgrst, 'reload schema';
