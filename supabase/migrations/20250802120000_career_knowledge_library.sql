-- =============================================================================
-- JobAZ Career Knowledge Library — foundation schema
-- =============================================================================
-- Purpose: Ownable career knowledge for the next Career Assistant.
-- AI will explain / organise this data — not invent career facts.
--
-- This migration creates STRUCTURE ONLY.
-- It does NOT insert careers, roles, courses, or demo content.
-- Stage model rows below are system catalogue keys (architecture), not careers.
--
-- Does NOT modify existing Career Assistant / assessment tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Stage models (assessment model catalogue)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_stage_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_stage_models_key_unique UNIQUE (model_key),
  CONSTRAINT career_library_stage_models_key_check CHECK (
    model_key IN (
      'academic_level',
      'professional_registration',
      'professional_route',
      'licence_stage'
    )
    OR model_key ~ '^[a-z][a-z0-9_]*$'
  )
);

COMMENT ON TABLE public.career_library_stage_models IS
  'Career Knowledge Library: assessment stage model types (not career content).';

-- System catalogue only (not demo careers). Safe to re-run.
INSERT INTO public.career_library_stage_models (model_key, name, description, active, sort_order)
VALUES
  (
    'academic_level',
    'Academic level',
    'Progression by academic stage (e.g. foundation → undergraduate → postgraduate). Stages are defined per specialism later — not hardcoded globally.',
    true,
    10
  ),
  (
    'professional_registration',
    'Professional registration',
    'Progression by regulator / professional body registration status.',
    true,
    20
  ),
  (
    'professional_route',
    'Professional route',
    'Progression along a structured professional pathway (route-based, not degree-based).',
    true,
    30
  ),
  (
    'licence_stage',
    'Licence stage',
    'Progression by licence / ticket / permit stages (e.g. training → provisional → full).',
    true,
    40
  )
ON CONFLICT (model_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_career_library_stage_models_active_sort
  ON public.career_library_stage_models (active, sort_order, name);

-- -----------------------------------------------------------------------------
-- 2) Career fields
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_fields_name_unique UNIQUE (name)
);

COMMENT ON TABLE public.career_library_fields IS
  'Career Knowledge Library: top-level career fields (e.g. Health, Education).';

CREATE INDEX IF NOT EXISTS idx_career_library_fields_active_sort
  ON public.career_library_fields (active, sort_order, name);

-- -----------------------------------------------------------------------------
-- 3) Career specialisms
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_specialisms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.career_library_fields (id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  stage_model_id uuid REFERENCES public.career_library_stage_models (id) ON DELETE SET NULL,
  regulated_profession boolean NOT NULL DEFAULT false,
  professional_body text,
  status text NOT NULL DEFAULT 'draft',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_specialisms_status_check CHECK (status IN ('draft', 'approved')),
  CONSTRAINT career_library_specialisms_field_slug_unique UNIQUE (field_id, slug),
  CONSTRAINT career_library_specialisms_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

COMMENT ON TABLE public.career_library_specialisms IS
  'Career Knowledge Library: specialisms within a field; each may use a different stage model.';

CREATE INDEX IF NOT EXISTS idx_career_library_specialisms_field
  ON public.career_library_specialisms (field_id, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_career_library_specialisms_status_active
  ON public.career_library_specialisms (status, active);

CREATE INDEX IF NOT EXISTS idx_career_library_specialisms_stage_model
  ON public.career_library_specialisms (stage_model_id);

-- -----------------------------------------------------------------------------
-- 4) Future scaffold tables (empty structure only — no CRUD yet)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialism_id uuid NOT NULL REFERENCES public.career_library_specialisms (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_roles_status_check CHECK (status IN ('draft', 'approved')),
  CONSTRAINT career_library_roles_specialism_slug_unique UNIQUE (specialism_id, slug)
);

COMMENT ON TABLE public.career_library_roles IS
  'Career Knowledge Library: roles within a specialism (foundation table; not wired in admin yet).';

CREATE TABLE IF NOT EXISTS public.career_library_learning_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialism_id uuid REFERENCES public.career_library_specialisms (id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.career_library_roles (id) ON DELETE SET NULL,
  title text NOT NULL,
  option_type text NOT NULL DEFAULT 'course',
  provider text,
  url text,
  status text NOT NULL DEFAULT 'draft',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_learning_options_status_check CHECK (status IN ('draft', 'approved'))
);

COMMENT ON TABLE public.career_library_learning_options IS
  'Career Knowledge Library: learning options (foundation table; not wired in admin yet).';

CREATE TABLE IF NOT EXISTS public.career_library_qualification_recognition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialism_id uuid REFERENCES public.career_library_specialisms (id) ON DELETE CASCADE,
  source_qualification text NOT NULL,
  uk_equivalent text,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_qualification_recognition_status_check CHECK (status IN ('draft', 'approved'))
);

COMMENT ON TABLE public.career_library_qualification_recognition IS
  'Career Knowledge Library: qualification recognition mappings (foundation table; not wired yet).';

CREATE TABLE IF NOT EXISTS public.career_library_report_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialism_id uuid REFERENCES public.career_library_specialisms (id) ON DELETE CASCADE,
  stage_model_id uuid REFERENCES public.career_library_stage_models (id) ON DELETE SET NULL,
  rule_key text NOT NULL,
  title text NOT NULL DEFAULT '',
  rule_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_report_rules_status_check CHECK (status IN ('draft', 'approved')),
  CONSTRAINT career_library_report_rules_key_unique UNIQUE (specialism_id, rule_key)
);

COMMENT ON TABLE public.career_library_report_rules IS
  'Career Knowledge Library: report / recommendation rules (foundation table; not wired yet).';

-- -----------------------------------------------------------------------------
-- 5) updated_at helper
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.career_library_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_career_library_stage_models_updated ON public.career_library_stage_models;
CREATE TRIGGER trg_career_library_stage_models_updated
  BEFORE UPDATE ON public.career_library_stage_models
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_fields_updated ON public.career_library_fields;
CREATE TRIGGER trg_career_library_fields_updated
  BEFORE UPDATE ON public.career_library_fields
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_specialisms_updated ON public.career_library_specialisms;
CREATE TRIGGER trg_career_library_specialisms_updated
  BEFORE UPDATE ON public.career_library_specialisms
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_roles_updated ON public.career_library_roles;
CREATE TRIGGER trg_career_library_roles_updated
  BEFORE UPDATE ON public.career_library_roles
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_learning_options_updated ON public.career_library_learning_options;
CREATE TRIGGER trg_career_library_learning_options_updated
  BEFORE UPDATE ON public.career_library_learning_options
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_qualification_recognition_updated
  ON public.career_library_qualification_recognition;
CREATE TRIGGER trg_career_library_qualification_recognition_updated
  BEFORE UPDATE ON public.career_library_qualification_recognition
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_report_rules_updated ON public.career_library_report_rules;
CREATE TRIGGER trg_career_library_report_rules_updated
  BEFORE UPDATE ON public.career_library_report_rules
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

-- -----------------------------------------------------------------------------
-- 6) RLS — admin write; public read of active approved content later
-- -----------------------------------------------------------------------------

ALTER TABLE public.career_library_stage_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_specialisms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_learning_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_qualification_recognition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_report_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS career_library_stage_models_admin_all ON public.career_library_stage_models;
CREATE POLICY career_library_stage_models_admin_all
  ON public.career_library_stage_models
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_fields_admin_all ON public.career_library_fields;
CREATE POLICY career_library_fields_admin_all
  ON public.career_library_fields
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_specialisms_admin_all ON public.career_library_specialisms;
CREATE POLICY career_library_specialisms_admin_all
  ON public.career_library_specialisms
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_roles_admin_all ON public.career_library_roles;
CREATE POLICY career_library_roles_admin_all
  ON public.career_library_roles
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_learning_options_admin_all ON public.career_library_learning_options;
CREATE POLICY career_library_learning_options_admin_all
  ON public.career_library_learning_options
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_qualification_recognition_admin_all
  ON public.career_library_qualification_recognition;
CREATE POLICY career_library_qualification_recognition_admin_all
  ON public.career_library_qualification_recognition
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_report_rules_admin_all ON public.career_library_report_rules;
CREATE POLICY career_library_report_rules_admin_all
  ON public.career_library_report_rules
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

-- Service role (admin API) bypasses RLS; policies protect direct client access.
