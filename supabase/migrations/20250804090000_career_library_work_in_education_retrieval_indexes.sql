-- =============================================================================
-- Safe retrieval indexes for Work in My Education matching
-- Additive only. No destructive changes.
-- =============================================================================

CREATE INDEX IF NOT EXISTS career_library_roles_specialism_active_priority_idx
  ON public.career_library_roles (specialism_id, active, status, priority);

CREATE INDEX IF NOT EXISTS career_library_specialisms_field_active_idx
  ON public.career_library_specialisms (field_id, active)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS career_library_fields_active_idx
  ON public.career_library_fields (active)
  WHERE active = true;
