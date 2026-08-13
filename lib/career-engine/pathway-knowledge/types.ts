/**
 * Career pathway knowledge contract — UI-facing, storage-agnostic.
 * Assessment/matcher never imports this module’s storage details.
 */

export type PathwayKnowledgeSource = 'career_knowledge_library' | 'placeholder' | 'partial'

export type PathwayTextBlock = {
  label: string
  items: string[]
  /** true when showing graceful placeholder rather than library content */
  is_placeholder: boolean
}

export type PathwayCourseHint = {
  title: string
  provider?: string | null
  url?: string | null
}

export type PathwayProgressionRole = {
  /** Linked library role id when available (for pathway navigation). */
  role_id?: string | null
  title: string
  stage_label?: string | null
  seniority?: string | null
}

export type CareerPathwayKnowledge = {
  pathway_id: string
  role_title: string
  field_name: string
  specialism_name: string
  stage_label: string | null
  source: PathwayKnowledgeSource
  about: PathwayTextBlock
  responsibilities: PathwayTextBlock
  salary: PathwayTextBlock
  career_progression: PathwayTextBlock
  required_qualifications: PathwayTextBlock
  professional_registrations: PathwayTextBlock
  useful_licences: PathwayTextBlock
  recommended_courses: {
    label: string
    items: PathwayCourseHint[]
    is_placeholder: boolean
  }
  required_skills: PathwayTextBlock
  transferable_skills: PathwayTextBlock
  typical_employers: PathwayTextBlock
  next_progression_roles: {
    label: string
    items: PathwayProgressionRole[]
    is_placeholder: boolean
  }
  /** Optional free-text note from library eligibility_note */
  library_note: string | null
}

/** Compact match summary used by CareerPathwayCard (from matcher output only). */
export type PathwayMatchSummary = {
  pathway_id: string
  title: string
  field_name: string
  specialism_name: string
  stage_label: string | null
  category: string
  eligibility_label: string
  /** Match strength 0–100 from Scoring v2 (legacy 0–1 still accepted in UI) */
  match_score: number
  lead_in: string
  why: Array<{ kind: 'positive' | 'gap' | 'warning'; text: string }>
  requirements: string[]
  next_step: string | null
}

export type CareerPathwayKnowledgeAdapter = {
  getPathwayKnowledge: (pathwayId: string) => Promise<CareerPathwayKnowledge>
}
