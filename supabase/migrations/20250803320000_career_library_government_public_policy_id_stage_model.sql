-- =============================================================================
-- Career Knowledge Library — Government, Public Policy & International Development
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Distinct from Humanities academic Politics/IR/Social Policy, Law, Business PM,
-- Finance accountancy, Natural Sciences Environmental Science, EAF Environmental
-- Policy (land/food focus), Healthcare clinical, Education QTS.
-- Master’s / PhD are NOT automatic seniority. Elected office excluded from
-- standard employment progression. Security clearance only where genuine.
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
  'government_public_policy_international_development_route',
  'Government, public policy & international development route',
  'UK civil service, local government, policy, parliamentary, diplomatic, international development, public affairs, regulation and government analysis progression. Master''s and PhD are not automatic seniority. Senior Civil Service, diplomatic leadership and executive roles are future progression. Elected office is excluded from ordinary employment ladders.',
  true,
  170,
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
      'government_public_policy_international_development_route',
      'foundation_public_service_support',
      'Foundation / Public-Service Support',
      'Administrative, casework support, grants admin and programme support. Degree not required for many posts.',
      10
    ),
    (
      'government_public_policy_international_development_route',
      'graduate_public_service_entry',
      'Graduate / Public-Service Entry',
      'Fast Stream, graduate schemes and first officer/analyst roles. Degree commonly expected; appointment not guaranteed by qualification alone.',
      20
    ),
    (
      'government_public_policy_international_development_route',
      'officer_analyst_practitioner',
      'Officer / Analyst / Practitioner',
      'Competent policy, research, programme, public-affairs and public-service officers.',
      30
    ),
    (
      'government_public_policy_international_development_route',
      'experienced_adviser_programme',
      'Experienced Adviser / Programme Practitioner',
      'Experienced advisers and programme practitioners with independent workstream ownership. Master''s may help niches but is not automatic seniority.',
      40
    ),
    (
      'government_public_policy_international_development_route',
      'senior_adviser_specialist',
      'Senior Adviser / Specialist',
      'Senior advisers and specialists mentoring others and owning complex remits.',
      50
    ),
    (
      'government_public_policy_international_development_route',
      'manager_principal',
      'Manager / Principal',
      'Policy, programme and research managers; principal advisers.',
      60
    ),
    (
      'government_public_policy_international_development_route',
      'head_senior_civil_service',
      'Head / Senior Civil Service',
      'Heads of function and Senior Civil Service grades. Substantial experience required; future progression.',
      70
    ),
    (
      'government_public_policy_international_development_route',
      'director_diplomatic_leadership',
      'Director / Diplomatic Leadership',
      'Directors and senior diplomatic leadership where legitimately appropriate. Future progression only.',
      80
    ),
    (
      'government_public_policy_international_development_route',
      'executive_public_service_leadership',
      'Executive / Public-Service Leadership',
      'Permanent Secretary pathway, local authority chief executives and public-body CEOs. Future progression only.',
      90
    ),
    (
      'government_public_policy_international_development_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research institute and university teaching. PhD typically required for academic tracks.',
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
