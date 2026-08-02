-- Multi-select delivery modes for courses (backward compatible with delivery_mode)

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS delivery_modes text[] NOT NULL DEFAULT '{}'::text[];

-- Migrate legacy single delivery_mode into delivery_modes array
UPDATE public.courses
SET delivery_modes = CASE
  WHEN delivery_mode IS NULL OR trim(delivery_mode) = '' THEN '{}'::text[]
  WHEN lower(trim(replace(delivery_mode, '-', '_'))) IN ('online') THEN ARRAY['online']::text[]
  WHEN lower(trim(replace(delivery_mode, '-', '_'))) IN ('in_person', 'in person') THEN ARRAY['in_person']::text[]
  WHEN lower(trim(delivery_mode)) = 'hybrid' THEN ARRAY['hybrid']::text[]
  WHEN lower(trim(replace(delivery_mode, '-', '_'))) = 'virtual' THEN ARRAY['virtual']::text[]
  WHEN lower(trim(replace(delivery_mode, '-', '_'))) = 'classroom' THEN ARRAY['classroom']::text[]
  WHEN lower(trim(replace(delivery_mode, '-', '_'))) = 'exam_in_person' THEN ARRAY['exam_in_person']::text[]
  ELSE ARRAY[lower(trim(replace(replace(delivery_mode, '-', '_'), ' ', '_')))]::text[]
END
WHERE delivery_modes IS NULL OR delivery_modes = '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_courses_delivery_modes ON public.courses USING GIN (delivery_modes);

NOTIFY pgrst, 'reload schema';
