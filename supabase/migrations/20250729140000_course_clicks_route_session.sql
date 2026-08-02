-- Optional route / session context for course click analytics (affiliate attribution)
ALTER TABLE public.course_clicks
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS route text;

CREATE INDEX IF NOT EXISTS idx_course_clicks_session_id
  ON public.course_clicks (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_clicks_route
  ON public.course_clicks (route)
  WHERE route IS NOT NULL;
