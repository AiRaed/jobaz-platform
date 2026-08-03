-- =============================================================================
-- Career Knowledge Library — Natural Sciences & Research stage model
-- =============================================================================
-- Additive only. Does NOT modify Engineering, IT, or Healthcare stage models.
-- Progression supports technical/apprenticeship, graduate, specialist science,
-- leadership and academic/research pathways. Master’s/PhD are not automatic seniority.
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
  'natural_sciences_research',
  'Natural sciences & research route',
  'Progression for natural sciences and research careers: technical/college entry, graduate science, practitioner and specialist scientist roles, senior/principal science, laboratory and research leadership, academic/research, and scientific executive leadership. Master''s/PhD affect eligibility for research and academic roles — not automatic professional seniority.',
  true,
  70,
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
      'natural_sciences_research',
      'foundation_technical_entry',
      'Foundation / Technical Entry',
      'College, apprenticeship, HNC/HND and technician routes into laboratory, field and scientific support work.',
      10
    ),
    (
      'natural_sciences_research',
      'graduate_entry',
      'Graduate Entry',
      'First professional science roles typically entered with a relevant Bachelor''s degree (or equivalent). Master''s may help but is not automatically required.',
      20
    ),
    (
      'natural_sciences_research',
      'scientific_practitioner',
      'Scientific Practitioner',
      'Independent delivery of scientific work in laboratory, field, analytical or applied settings.',
      30
    ),
    (
      'natural_sciences_research',
      'experienced_scientist',
      'Experienced Scientist',
      'Experienced scientists with sustained delivery ownership, method development or project responsibility.',
      40
    ),
    (
      'natural_sciences_research',
      'specialist_scientist',
      'Specialist Scientist',
      'Domain-specialist scientific roles; Master''s or doctorate may be commonly useful where the specialty genuinely requires it.',
      50
    ),
    (
      'natural_sciences_research',
      'senior_principal_scientist',
      'Senior / Principal Scientist',
      'Senior and principal scientist roles with technical authority, mentoring and complex R&D ownership.',
      60
    ),
    (
      'natural_sciences_research',
      'research_lab_leadership',
      'Research Leadership / Laboratory Leadership',
      'Leadership of research groups, laboratory operations, programmes or scientific services.',
      70
    ),
    (
      'natural_sciences_research',
      'academic_research',
      'Academic / Research',
      'Doctoral, postdoctoral, fellowship and academic teaching/research roles. PhD typically required for postdoc and academic tracks.',
      80
    ),
    (
      'natural_sciences_research',
      'executive_scientific_director',
      'Executive / Scientific Director',
      'Future progression into scientific directorate, R&D executive and organisational science leadership.',
      90
    )
) AS v(model_key, stage_key, label, description, sort_order)
  ON m.model_key = v.model_key
ON CONFLICT (stage_model_id, stage_key) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;
