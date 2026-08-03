-- =============================================================================
-- Career Knowledge Library — Business & Management stage model
-- =============================================================================
-- Additive only. Does NOT modify Engineering, IT, Healthcare, or Natural Sciences.
-- Progression is driven by experience, responsibility and commercial delivery.
-- Degree / Master’s / MBA / PhD are NOT automatic seniority.
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
  'business_management_route',
  'Business & management route',
  'UK business and management progression by practical experience, scope of responsibility, commercial/operational delivery and leadership evidence. Degrees and MBAs may support some routes but are not automatic seniority. PhD is mainly for academic/research eligibility.',
  true,
  80,
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
      'business_management_route',
      'foundation_business_support',
      'Foundation / Business Support',
      'Apprenticeship, college and vocational entry into administration, office and business support roles. Degree not required.',
      10
    ),
    (
      'business_management_route',
      'graduate_entry',
      'Graduate / Entry',
      'Graduate schemes and first professional business roles. Degree may be commonly expected for schemes but is not universal.',
      20
    ),
    (
      'business_management_route',
      'junior_practitioner',
      'Junior Practitioner',
      'Early-career business practitioners delivering defined work under guidance.',
      30
    ),
    (
      'business_management_route',
      'practitioner',
      'Practitioner',
      'Independent delivery of business, project, commercial or operational work.',
      40
    ),
    (
      'business_management_route',
      'experienced_manager',
      'Experienced / Manager',
      'Experienced practitioners and first-line managers with team, budget or workstream responsibility.',
      50
    ),
    (
      'business_management_route',
      'senior_manager_specialist',
      'Senior Manager / Specialist',
      'Senior management or deep specialist business roles with significant accountability.',
      60
    ),
    (
      'business_management_route',
      'head_programme_leadership',
      'Head / Programme Leadership',
      'Heads of function and programme-level leadership across operations, commercial or transformation.',
      70
    ),
    (
      'business_management_route',
      'director_executive',
      'Director / Executive',
      'Director and executive leadership. Future progression only — not immediate from Master’s/MBA alone.',
      80
    ),
    (
      'business_management_route',
      'consultant_independent',
      'Consultant / Independent',
      'Independent consulting, interim and self-employed advisory pathways.',
      90
    ),
    (
      'business_management_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching roles in business and management. PhD typically required for academic tracks.',
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
