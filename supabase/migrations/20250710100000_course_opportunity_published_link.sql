-- Link internal opportunities to real published courses
ALTER TABLE public.course_opportunities
  ADD COLUMN IF NOT EXISTS published_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_opportunities_published_course
  ON public.course_opportunities(published_course_id);
