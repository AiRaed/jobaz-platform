-- Run AFTER cleaning duplicate course opportunities (admin → Clean duplicate opportunities).
-- Prevents future duplicate rows by normalized course name.

CREATE UNIQUE INDEX IF NOT EXISTS unique_course_opportunity_name_lower
  ON public.course_opportunities (lower(trim(course_name)));

NOTIFY pgrst, 'reload schema';
