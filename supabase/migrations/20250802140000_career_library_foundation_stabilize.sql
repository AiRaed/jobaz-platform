-- =============================================================================
-- Career Knowledge Library — foundation stabilisation (incremental)
-- =============================================================================
-- Safe / additive. Does NOT rewrite 20250802120000.
-- Does NOT insert career fields, specialisms, roles, or courses.
-- Seeds only: system stage model flags + reusable stage definitions per model.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Stage models: system flag + allow custom models
-- -----------------------------------------------------------------------------

ALTER TABLE public.career_library_stage_models
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

UPDATE public.career_library_stage_models
SET is_system = true
WHERE model_key IN (
  'academic_level',
  'professional_registration',
  'professional_route',
  'licence_stage'
);

-- Ensure the four system models exist (idempotent)
INSERT INTO public.career_library_stage_models (model_key, name, description, active, sort_order, is_system)
VALUES
  (
    'academic_level',
    'Academic level',
    'Progression by academic stage. Stage labels are defined on this model — not hardcoded into specialisms.',
    true,
    10,
    true
  ),
  (
    'professional_registration',
    'Professional registration',
    'Progression by regulator / professional body registration status.',
    true,
    20,
    true
  ),
  (
    'professional_route',
    'Professional route',
    'Progression along a structured professional pathway (route-based).',
    true,
    30,
    true
  ),
  (
    'licence_stage',
    'Licence stage',
    'Progression by licence / ticket / permit stages.',
    true,
    40,
    true
  )
ON CONFLICT (model_key) DO UPDATE
SET
  is_system = true,
  name = COALESCE(NULLIF(public.career_library_stage_models.name, ''), EXCLUDED.name),
  description = CASE
    WHEN public.career_library_stage_models.description IS NULL
      OR btrim(public.career_library_stage_models.description) = ''
    THEN EXCLUDED.description
    ELSE public.career_library_stage_models.description
  END;

-- -----------------------------------------------------------------------------
-- 2) Stage definitions (model → many ordered stages)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_model_id uuid NOT NULL
    REFERENCES public.career_library_stage_models (id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_stages_model_key_unique UNIQUE (stage_model_id, stage_key),
  CONSTRAINT career_library_stages_key_format CHECK (stage_key ~ '^[a-z][a-z0-9_]*$')
);

COMMENT ON TABLE public.career_library_stages IS
  'Career Knowledge Library: ordered stage definitions belonging to a stage model template.';

CREATE INDEX IF NOT EXISTS idx_career_library_stages_model_sort
  ON public.career_library_stages (stage_model_id, sort_order, label);

DROP TRIGGER IF EXISTS trg_career_library_stages_updated ON public.career_library_stages;
CREATE TRIGGER trg_career_library_stages_updated
  BEFORE UPDATE ON public.career_library_stages
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

ALTER TABLE public.career_library_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS career_library_stages_admin_all ON public.career_library_stages;
CREATE POLICY career_library_stages_admin_all
  ON public.career_library_stages
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

-- Default stages for system models only (templates, not careers)
INSERT INTO public.career_library_stages (stage_model_id, stage_key, label, description, sort_order, active)
SELECT m.id, v.stage_key, v.label, v.description, v.sort_order, true
FROM public.career_library_stage_models m
JOIN (
  VALUES
    ('academic_level', 'degree', 'Degree', '', 10),
    ('academic_level', 'masters', 'Master''s', '', 20),
    ('academic_level', 'phd', 'PhD', '', 30),
    ('professional_registration', 'qualification_completed', 'Qualification completed', '', 10),
    ('professional_registration', 'registration_required', 'Registration required', '', 20),
    ('professional_registration', 'registered', 'Registered', '', 30),
    ('professional_registration', 'specialist_advanced', 'Specialist / advanced', '', 40),
    ('professional_route', 'education_completed', 'Education completed', '', 10),
    ('professional_route', 'training_conversion', 'Training or conversion route', '', 20),
    ('professional_route', 'professionally_qualified', 'Professionally qualified', '', 30),
    ('professional_route', 'advanced_leadership', 'Advanced / leadership', '', 40),
    ('licence_stage', 'no_licence', 'No licence', '', 10),
    ('licence_stage', 'training', 'Training', '', 20),
    ('licence_stage', 'licensed', 'Licensed', '', 30),
    ('licence_stage', 'advanced_renewal', 'Advanced / renewal', '', 40)
) AS v(model_key, stage_key, label, description, sort_order)
  ON m.model_key = v.model_key
ON CONFLICT (stage_model_id, stage_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3) Career fields: slug + status
-- -----------------------------------------------------------------------------

ALTER TABLE public.career_library_fields
  ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE public.career_library_fields
  ADD COLUMN IF NOT EXISTS status text;

-- Backfill slug for any existing rows (no demo inserts)
UPDATE public.career_library_fields
SET slug = trim(both '-' FROM regexp_replace(lower(regexp_replace(coalesce(name, 'field'), '[^a-zA-Z0-9]+', '-', 'g')), '-{2,}', '-', 'g'))
WHERE slug IS NULL OR btrim(slug) = '';

-- Disambiguate duplicate slugs if any
WITH ranked AS (
  SELECT
    id,
    slug,
    row_number() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM public.career_library_fields
)
UPDATE public.career_library_fields f
SET slug = ranked.slug || '-' || ranked.rn
FROM ranked
WHERE f.id = ranked.id AND ranked.rn > 1;

UPDATE public.career_library_fields
SET status = CASE
  WHEN active = false THEN 'disabled'
  ELSE 'draft'
END
WHERE status IS NULL OR btrim(status) = '';

ALTER TABLE public.career_library_fields
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.career_library_fields
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.career_library_fields
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.career_library_fields
  DROP CONSTRAINT IF EXISTS career_library_fields_status_check;

ALTER TABLE public.career_library_fields
  ADD CONSTRAINT career_library_fields_status_check
  CHECK (status IN ('draft', 'approved', 'disabled'));

ALTER TABLE public.career_library_fields
  DROP CONSTRAINT IF EXISTS career_library_fields_slug_format;

ALTER TABLE public.career_library_fields
  ADD CONSTRAINT career_library_fields_slug_format
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_career_library_fields_slug_unique
  ON public.career_library_fields (slug);

CREATE INDEX IF NOT EXISTS idx_career_library_fields_status_active
  ON public.career_library_fields (status, active, sort_order);

-- -----------------------------------------------------------------------------
-- 4) Specialisms: description (+ keep draft/approved + active)
-- -----------------------------------------------------------------------------

ALTER TABLE public.career_library_specialisms
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

-- Prefer RESTRICT when removing a stage model that is in use
ALTER TABLE public.career_library_specialisms
  DROP CONSTRAINT IF EXISTS career_library_specialisms_stage_model_id_fkey;

ALTER TABLE public.career_library_specialisms
  ADD CONSTRAINT career_library_specialisms_stage_model_id_fkey
  FOREIGN KEY (stage_model_id)
  REFERENCES public.career_library_stage_models (id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_career_library_specialisms_slug
  ON public.career_library_specialisms (slug);
