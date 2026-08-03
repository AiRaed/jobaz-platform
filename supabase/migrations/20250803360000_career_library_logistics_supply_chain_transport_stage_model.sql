-- =============================================================================
-- Career Knowledge Library — Logistics, Supply Chain & Transport Management
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Work in My Education focus: graduate, planning, procurement, management,
-- analytics and academic routes. Low-barrier driver/warehouse-operative roles
-- are limited foundation context only (Start a New Career / Experience later).
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
  'logistics_supply_chain_transport_management_route',
  'Logistics, supply chain & transport management route',
  'UK logistics, supply chain, procurement, planning, distribution, fleet, aviation, maritime and trade-compliance management progression. Master''s and PhD are not automatic seniority. Driver, courier and warehouse-operative roles are limited foundation context for Work in My Education.',
  true,
  190,
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
      'logistics_supply_chain_transport_management_route',
      'foundation_logistics_support',
      'Foundation / Logistics Support',
      'Limited logistics support context only. Degree not required. Not the centre of Work in My Education recommendations.',
      10
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'apprentice_technical_entry',
      'Apprentice / Technical Entry',
      'Apprenticeships and college/technical trainee routes into logistics, procurement and planning support.',
      20
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'graduate_management_entry',
      'Graduate / Management Entry',
      'Graduate schemes and first analyst/planner roles. Relevant degree commonly expected; appointment competitive.',
      30
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'professional_practitioner',
      'Professional Practitioner',
      'Competent planners, buyers, coordinators and logistics professionals.',
      40
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'experienced_specialist',
      'Experienced Specialist',
      'Experienced specialists with independent workstream ownership. Master''s may help analytics/strategy niches.',
      50
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'senior_manager',
      'Senior Manager',
      'Senior managers owning complex logistics, procurement or transport remits.',
      60
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'head_logistics_supply_chain',
      'Head of Logistics / Supply Chain',
      'Heads of logistics, supply chain, procurement or transport. Substantial experience required.',
      70
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'director_executive',
      'Director / Executive',
      'Directors and C-suite supply-chain leadership. Future progression only.',
      80
    ),
    (
      'logistics_supply_chain_transport_management_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching. PhD typically required for academic tracks.',
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
