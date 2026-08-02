-- Optional planning metadata for Work in my Education opportunity bank

ALTER TABLE public.course_opportunities
  ADD COLUMN IF NOT EXISTS education_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialisations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS commercial_status text,
  ADD COLUMN IF NOT EXISTS suggested_search_keywords text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS can_be_course_card boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recommendation_type text;

CREATE INDEX IF NOT EXISTS idx_course_opportunities_commercial_status
  ON public.course_opportunities(commercial_status)
  WHERE commercial_status IS NOT NULL;

NOTIFY pgrst, 'reload schema';
