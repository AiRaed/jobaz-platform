-- =============================================================================
-- Career Knowledge Library — Languages & Literature stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Progression via language support, graduate entry, professional linguist
-- practice, specialist depth, leadership and academic/research tracks.
-- Master’s / PhD mainly for university teaching and research.
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
  'languages_literature_route',
  'Languages & literature route',
  'UK languages and literature progression via language support, graduate entry, professional linguist practice (teaching, translation, interpreting, literary programmes), experienced and senior specialism, leadership, executive/director roles and academic/research careers. Master''s and PhD are not automatic seniority outside higher education and research.',
  true,
  140,
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
      'languages_literature_route',
      'foundation_language_support',
      'Foundation / Language Support',
      'Language centre assistants, library/literary programme support and admin. Degree not required for many roles.',
      10
    ),
    (
      'languages_literature_route',
      'graduate_language_entry',
      'Graduate / Language Entry',
      'Graduate language assistants, trainee teachers of English, junior translators and literary programme graduates. Relevant degree commonly expected.',
      20
    ),
    (
      'languages_literature_route',
      'professional_linguist',
      'Professional Linguist',
      'Practising linguists, language teachers, translators, interpreters and literary programme practitioners.',
      30
    ),
    (
      'languages_literature_route',
      'experienced_specialist',
      'Experienced Specialist',
      'Experienced specialists with independent assignment ownership. Master''s may help some niches but is not automatic seniority.',
      40
    ),
    (
      'languages_literature_route',
      'senior_specialist',
      'Senior Specialist',
      'Senior linguists and specialists mentoring juniors and owning complex remits.',
      50
    ),
    (
      'languages_literature_route',
      'leadership',
      'Leadership',
      'Language service leads, programme leads and team leadership. Future progression.',
      60
    ),
    (
      'languages_literature_route',
      'executive_director',
      'Executive / Director',
      'Heads of languages, directors of language centres and equivalent. Future progression only.',
      70
    ),
    (
      'languages_literature_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching in languages and literature. PhD typically required for academic tracks.',
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
