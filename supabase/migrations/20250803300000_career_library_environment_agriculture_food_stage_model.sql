-- =============================================================================
-- Career Knowledge Library — Environment, Agriculture & Food stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Focus: land, food systems, agriculture, environmental management and
-- sustainability. Distinct from Natural Sciences Environmental Science and
-- from Engineering / Construction / Business operations.
-- Master’s / PhD are NOT automatic seniority.
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
  'environment_agriculture_food_route',
  'Environment, agriculture & food route',
  'UK environment, agriculture and food progression via technical support, graduate entry, professional practice, experienced and senior specialism, leadership/operations, executive/director roles and academic/research careers. Master''s and PhD are not automatic seniority outside higher education and research. Distinct from Natural Sciences laboratory tracks and Engineering.',
  true,
  160,
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
      'environment_agriculture_food_route',
      'foundation_technical_support',
      'Foundation / Technical Support',
      'Farm, laboratory, field, food plant and estate support roles. Degree not required for many posts.',
      10
    ),
    (
      'environment_agriculture_food_route',
      'graduate_entry',
      'Graduate Entry',
      'Graduate trainees and first professional roles. Relevant degree commonly expected; not yet senior.',
      20
    ),
    (
      'environment_agriculture_food_route',
      'professional_practitioner',
      'Professional Practitioner',
      'Competent practitioners in agriculture, food, environment, forestry, conservation or rural land roles.',
      30
    ),
    (
      'environment_agriculture_food_route',
      'experienced_specialist',
      'Experienced Specialist',
      'Experienced specialists with independent project or site ownership. Master''s may help niches but is not automatic seniority.',
      40
    ),
    (
      'environment_agriculture_food_route',
      'senior_specialist',
      'Senior Specialist',
      'Senior specialists mentoring juniors and owning complex technical remits.',
      50
    ),
    (
      'environment_agriculture_food_route',
      'leadership_operations',
      'Leadership / Operations',
      'Farm, site, operations and programme leadership. Future progression requiring substantial experience.',
      60
    ),
    (
      'environment_agriculture_food_route',
      'executive_director',
      'Executive / Director',
      'Directors and heads of environmental, agricultural or food functions. Future progression only.',
      70
    ),
    (
      'environment_agriculture_food_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching. PhD typically required for academic tracks.',
      80
    )
) AS v(model_key, stage_key, label, description, sort_order)
  ON m.model_key = v.model_key
ON CONFLICT (stage_model_id, stage_key) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;
