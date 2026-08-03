-- =============================================================================
-- Career Knowledge Library — Arts, Media & Creative Industries stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Progression via creative support, graduate entry, junior practice, experience,
-- senior specialism, creative leadership and studio/executive direction.
-- Master’s / PhD mainly for HE teaching and research — not automatic seniority.
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
  'arts_media_creative_route',
  'Arts, media & creative industries route',
  'UK arts, media and creative industries progression via creative support, graduate/creative entry, junior professional practice, experienced creative delivery, senior specialism, creative leadership, executive/studio direction and academic/research careers. Portfolio, experience and responsibility drive progression. Master''s and PhD are not automatic seniority outside higher education and research.',
  true,
  120,
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
      'arts_media_creative_route',
      'foundation_creative_support',
      'Foundation / Creative Support',
      'Studio assistants, production runners, creative admin and entry support. Degree not required for many roles.',
      10
    ),
    (
      'arts_media_creative_route',
      'graduate_creative_entry',
      'Graduate / Creative Entry',
      'Graduate schemes, junior trainees and first creative roles. Relevant degree/portfolio commonly expected.',
      20
    ),
    (
      'arts_media_creative_route',
      'junior_creative_professional',
      'Junior Creative Professional',
      'Early-career creatives delivering supervised briefs with growing independence.',
      30
    ),
    (
      'arts_media_creative_route',
      'experienced_creative',
      'Experienced Creative',
      'Experienced practitioners owning complex briefs and client/stakeholder delivery. Not automatic from Master''s.',
      40
    ),
    (
      'arts_media_creative_route',
      'senior_specialist',
      'Senior Specialist',
      'Senior specialists and lead creatives with deep craft expertise and mentoring responsibility.',
      50
    ),
    (
      'arts_media_creative_route',
      'creative_leadership',
      'Creative Leadership',
      'Creative leads, heads of craft and team leadership. Future progression requiring substantial experience.',
      60
    ),
    (
      'arts_media_creative_route',
      'executive_studio_director',
      'Executive / Studio Director',
      'Creative directors, studio directors, executive producers and equivalent. Future progression only.',
      70
    ),
    (
      'arts_media_creative_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching in arts, media and creative disciplines. PhD typically required for academic tracks.',
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
