-- Optional public badges/tags for course cards (Career Hub / Courses & Licences)

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS public_badges text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_courses_public_badges ON public.courses USING GIN (public_badges);

NOTIFY pgrst, 'reload schema';
