-- Course click analytics (affiliate tracking)
CREATE TABLE IF NOT EXISTS public.course_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'unknown',
  action text NOT NULL DEFAULT 'apply_now',
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_clicks_course_id ON public.course_clicks(course_id);
CREATE INDEX IF NOT EXISTS idx_course_clicks_clicked_at ON public.course_clicks(clicked_at DESC);

ALTER TABLE public.course_clicks ENABLE ROW LEVEL SECURITY;

-- Service role inserts via API; no public read
CREATE POLICY course_clicks_service_insert ON public.course_clicks
  FOR INSERT
  WITH CHECK (true);
