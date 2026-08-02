-- Additive: prepare cvs for multiple CV versions.
-- Existing rows become Main CV (is_primary). Does not delete or reshape data.
-- Upsert path remains one primary CV until multi-CV write APIs ship.

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS target_role text;

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS target_route text;

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS linked_plan_id text;

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT true;

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS data jsonb;

UPDATE public.cvs
SET
  title = COALESCE(NULLIF(BTRIM(title), ''), 'Main CV'),
  is_primary = COALESCE(is_primary, true)
WHERE title IS NULL
   OR BTRIM(title) = ''
   OR is_primary IS NULL;

COMMENT ON COLUMN public.cvs.is_primary IS 'Primary/Main CV flag. Existing single CV is always primary.';
COMMENT ON COLUMN public.cvs.target_role IS 'Optional target role for targeted CV versions (future).';
COMMENT ON COLUMN public.cvs.target_route IS 'Optional career route label for targeted CV versions (future).';
