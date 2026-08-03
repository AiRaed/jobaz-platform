-- =============================================================================
-- Career Knowledge Library — Hospitality, Tourism & Events stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Work in My Education focus: graduate, management, commercial, destination,
-- events leadership and academic routes. Low-barrier ops (waiter, bar staff,
-- kitchen porter, room attendant) are limited foundation context only.
-- Master’s / PhD are NOT automatic seniority. Ownership ≠ entrepreneurship.
-- =============================================================================

INSERT INTO public.career_library_stage_models (
  model_key,
  name,
  description,
  active,
  sort_order,
  is_system
)
VALUES (
  'hospitality_tourism_events_route',
  'Hospitality, tourism & events route',
  'UK hospitality, tourism, events, culinary management, venues and visitor-economy progression via vocational entry, graduate management, coordination, professional management, senior/head leadership, general management, consultancy/ownership and academic research. Master''s and PhD are not automatic seniority. Low-barrier frontline roles are limited foundation context for Work in My Education.',
  true,
  180,
  true
)
ON CONFLICT (model_key) DO UPDATE
SET
  is_system = true,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = true,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.career_library_stages (
  stage_model_id,
  stage_key,
  label,
  description,
  sort_order,
  active
)
SELECT m.id, v.stage_key, v.label, v.description, v.sort_order, true
FROM public.career_library_stage_models m
JOIN (
  VALUES
    (
      'hospitality_tourism_events_route',
      'foundation_operational_support',
      'Foundation / Operational Support',
      'Limited operations-support context only. Degree not required. Not the centre of Work in My Education recommendations.',
      10
    ),
    (
      'hospitality_tourism_events_route',
      'trainee_vocational_entry',
      'Trainee / Vocational Entry',
      'Apprenticeships, college and vocational trainee routes into hospitality, culinary, travel and events.',
      20
    ),
    (
      'hospitality_tourism_events_route',
      'graduate_management_entry',
      'Graduate / Management Entry',
      'Graduate management schemes and first management-track roles. Relevant degree commonly expected; experience still required for progression.',
      30
    ),
    (
      'hospitality_tourism_events_route',
      'supervisor_coordinator',
      'Supervisor / Coordinator',
      'Supervisors and coordinators with team or event/project coordination responsibility.',
      40
    ),
    (
      'hospitality_tourism_events_route',
      'professional_practitioner_manager',
      'Professional Practitioner / Manager',
      'Competent managers delivering hotel, F&B, events, tourism, venue or travel operations.',
      50
    ),
    (
      'hospitality_tourism_events_route',
      'experienced_specialist_senior_manager',
      'Experienced Specialist / Senior Manager',
      'Senior managers and specialists with independent commercial or programme ownership. Master''s may help niches but is not automatic seniority.',
      60
    ),
    (
      'hospitality_tourism_events_route',
      'head_multisite_leadership',
      'Head / Multi-site Leadership',
      'Heads of function and multi-site/regional leadership. Substantial experience required.',
      70
    ),
    (
      'hospitality_tourism_events_route',
      'director_general_management',
      'Director / General Management',
      'Hotel/resort GMs, directors of events/tourism/hospitality. Future progression only.',
      80
    ),
    (
      'hospitality_tourism_events_route',
      'executive_ownership_consultancy',
      'Executive / Ownership / Consultancy',
      'Group executives, consultants and ownership routes. Ownership is not automatic promotion or guaranteed employment.',
      90
    ),
    (
      'hospitality_tourism_events_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching. PhD typically required for academic tracks.',
      100
    )
) AS v(model_key, stage_key, label, description, sort_order)
  ON m.model_key = v.model_key
ON CONFLICT (stage_model_id, stage_key) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;
