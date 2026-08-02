-- Course purpose for Career Assistant / AI recommendation routing

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS course_purpose text;

NOTIFY pgrst, 'reload schema';
