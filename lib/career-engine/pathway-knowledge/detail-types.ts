/**
 * Batch 7 — Pathway Detail response contract (serialisable, knowledge-first).
 * UI must not query Supabase; API/adapter only.
 */

import type { CareerPathwayKnowledge, PathwayKnowledgeSource } from './types'

export type PathwayMatchStatusLabel =
  | 'Eligible now'
  | 'Conditionally eligible'
  | 'Future career option'
  | 'Academic / research option'
  | 'Requirements still needed'
  | 'Needs review'
  | 'Match'

export type PathwayDetailRole = {
  id: string
  title: string
  field: string
  specialism: string
  professional_stage: string | null
  category: string | null
  seniority: string | null
  minimum_experience_years: number | null
  experience_label: string | null
  registration_requirement: string | null
  membership_requirement: string | null
  academic_requirement: string | null
  is_regulated: boolean
  is_academic: boolean
  is_research: boolean
  library_status: string | null
  active: boolean | null
}

/** Assessment-derived match context (display). Never trusted as sole eligibility truth. */
export type PathwayDetailMatchExplanation = {
  bucket_label: string | null
  eligibility_label: string | null
  match_status: PathwayMatchStatusLabel
  score: number | null
  lead_in: string | null
  why: Array<{ kind: 'positive' | 'gap' | 'warning'; text: string }>
  requirements_still_needed: string[]
  next_step: string | null
  /** True only when assessment label is explicitly Eligible now — never upgraded client-side. */
  assessment_says_accessible_now: boolean
  warnings: string[]
  blockers: string[]
}

export type PathwayDetailProvenance = {
  data_source: 'career_knowledge_library'
  knowledge_source: PathwayKnowledgeSource | null
  role_found: boolean
  missing_sections: string[]
  match_context_source: 'assessment_session' | 'query' | 'none'
}

export type PathwayDetailResponse = {
  found: boolean
  role: PathwayDetailRole | null
  match: PathwayDetailMatchExplanation | null
  knowledge: CareerPathwayKnowledge | null
  provenance: PathwayDetailProvenance
  error_code?: 'not_found' | 'invalid_id' | 'unavailable' | null
}

/** Client session context saved when opening View pathway from results. */
export type PathwayMatchContextPayload = {
  role_id: string
  title: string
  field_name: string
  specialism_name: string
  stage_label: string | null
  category: string
  eligibility_label: string
  match_score: number
  lead_in: string
  why: Array<{ kind: 'positive' | 'gap' | 'warning'; text: string }>
  requirements: string[]
  next_step: string | null
  saved_at: string
}
