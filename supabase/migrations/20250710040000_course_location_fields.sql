-- Short public location summary + full available locations list

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS location_summary text,
ADD COLUMN IF NOT EXISTS available_locations text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill summary from legacy location where helpful
UPDATE public.courses
SET location_summary = location
WHERE (location_summary IS NULL OR trim(location_summary) = '')
  AND location IS NOT NULL
  AND trim(location) <> '';

NOTIFY pgrst, 'reload schema';
