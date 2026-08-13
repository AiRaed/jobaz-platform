/**
 * Work in My Education — types & contracts.
 * Knowledge-first retrieval; no LLM invention of careers.
 */

export type EducationLevel =
  | 'college'
  | 'bachelor'
  | 'master'
  | 'doctorate'
  | 'professional'
  | 'other'

export type GraduationStatus = 'completed' | 'studying' | 'incomplete'

export type RegistrationStatus = 'registered' | 'pending' | 'expired' | 'none'

export type RegistrationScope =
  | 'adult_nursing'
  | 'mental_health_nursing'
  | 'childrens_nursing'
  | 'learning_disability_nursing'
  | 'midwifery'
  | 'nursing_associate'
  | 'unknown'

export type LanguageLevel = 'basic' | 'conversational' | 'professional' | 'fluent' | 'native'

export type ProfessionalRegistrationInput = {
  body: string
  status: RegistrationStatus
  /** Optional regulated branch/part — never log registration_number */
  registration_scope?: RegistrationScope | null
  registration_number?: string | null
}

export type ScopeMatch = 'matched' | 'adjacent' | 'mismatched' | 'unknown'

export type RetrievalSource =
  | 'primary_specialism'
  | 'related_specialism'
  | 'general_field_role'

export type StructuredGap = {
  type:
    | 'clarification'
    | 'qualification_recognition'
    | 'registration'
    | 'registration_scope'
    | 'licence'
    | 'experience'
    | 'professional_status'
    | 'specialism_mismatch'
    | 'academic_requirement'
  severity: 'info' | 'warning' | 'blocker'
  code: string
  message_key: string
  message: string
  details: Record<string, unknown>
}

export type LanguageInput = {
  language: string
  level: LanguageLevel
}

export type CareerPreferencesInput = {
  wants_academic_route?: boolean | null
  wants_related_field_only?: boolean | null
  open_to_retraining?: boolean | null
  preferred_work_types?: string[]
  preferred_locations?: string[]
}

export type WorkInEducationProfile = {
  education_level: EducationLevel
  qualification_title: string
  subject: string
  specialisation?: string | null
  institution_country?: string | null
  qualification_country?: string | null
  graduation_status?: GraduationStatus
  graduation_year?: number | null
  years_relevant_experience?: number
  current_job_title?: string | null
  has_uk_experience?: boolean | null
  professional_registration?: ProfessionalRegistrationInput[]
  licences?: string[]
  skills?: string[]
  languages?: LanguageInput[]
  english_level?: string | null
  career_preferences?: CareerPreferencesInput
  /** Canonical taxonomy (additive; preferred over education_level alone) */
  qualification_group?: string | null
  qualification_type?: string | null
  equivalence_status?: string | null
  /** Resolved snapshot — also recomputed during normalisation */
  qualification?: import('../qualification-taxonomy').NormalizedQualification | null
}

export type NormalisedWorkInEducationProfile = {
  education_level: EducationLevel
  qualification_title_raw: string
  qualification_title_normalised: string
  subject_raw: string
  subject_normalised: string
  subject_tokens: string[]
  specialisation_raw: string | null
  specialisation_normalised: string | null
  specialisation_tokens: string[]
  institution_country: string | null
  qualification_country: string | null
  is_uk_qualification: boolean
  graduation_status: GraduationStatus
  graduation_year: number | null
  years_relevant_experience: number
  current_job_title: string | null
  current_job_tokens: string[]
  has_uk_experience: boolean | null
  professional_registration: ProfessionalRegistrationInput[]
  licences: string[]
  skills: string[]
  skill_tokens: string[]
  languages: LanguageInput[]
  english_level: string | null
  career_preferences: Required<
    Pick<
      CareerPreferencesInput,
      'wants_academic_route' | 'wants_related_field_only' | 'open_to_retraining'
    >
  > & {
    preferred_work_types: string[]
    preferred_locations: string[]
  }
  alias_hits: string[]
  /** Canonical qualification taxonomy (always resolved during normalisation) */
  qualification: import('../qualification-taxonomy').NormalizedQualification
}

export type ResolvedEntityRef = {
  id: string
  name: string
  slug: string
  score: number
  reasons: string[]
}

export type FieldSpecialismResolution = {
  primary_field: ResolvedEntityRef | null
  alternative_fields: ResolvedEntityRef[]
  primary_specialism: ResolvedEntityRef | null
  alternative_specialisms: ResolvedEntityRef[]
  confidence: number
  score_margin: number
  is_broad_subject: boolean
  match_reasons: string[]
  needs_clarification: boolean
  clarification_reason: string | null
  clarification_options: Array<{
    type: 'field' | 'specialism'
    id: string
    name: string
    slug: string
    score: number
    reason: string
  }>
}

export type QaSummaryFlag = 'PASS' | 'WARNING' | 'FAIL'

export type MatchQaSummary = {
  field_resolution: QaSummaryFlag
  specialism_resolution: QaSummaryFlag
  regulated_role_safety: QaSummaryFlag
  scope_safety: QaSummaryFlag
  seniority_safety: QaSummaryFlag
  professional_stage_safety: QaSummaryFlag
}

export type EligibilityStatus =
  | 'eligible'
  | 'conditionally_eligible'
  | 'not_yet_eligible'
  | 'needs_review'

export type EffectiveFit =
  | 'immediate'
  | 'realistic_next'
  | 'future_progression'
  | 'academic_or_research'
  | 'blocked_until_requirement'
  | 'needs_review'

export type EligibilityGap = StructuredGap

export type RoleEligibilityResult = {
  role_id: string
  role_title: string
  field: { id: string; name: string; slug: string }
  specialism: { id: string; name: string; slug: string }
  stage: { id: string | null; key: string | null; label: string | null }
  stored_fit: string | null
  effective_fit: EffectiveFit
  eligibility: {
    status: EligibilityStatus
    education_match: boolean
    experience_match: boolean
    registration_match: boolean
    licence_match: boolean
    country_recognition_review_needed: boolean
    qualification_scope_match: ScopeMatch
    registration_scope_match: ScopeMatch
  }
  gaps: EligibilityGap[]
  /** Match strength 0–100 from Eligibility & Match Scoring v2 */
  match_score: number
  match_reasons: string[]
  warnings: string[]
  demotion_reasons: string[]
  retrieval_source: RetrievalSource
  relation_reason: string
  scope_gate: string
  professional_stage_gate: string
  /** Canonical v2 evaluation (optional for older fixtures) */
  evaluation?: import('../evaluate-role-match').RoleMatchEvaluation
}

export type MatchLimits = {
  immediate: number
  realistic_next: number
  future_progression: number
  academic_or_research: number
  blocked_or_needs_review: number
}

export const DEFAULT_MATCH_LIMITS: MatchLimits = {
  immediate: 5,
  realistic_next: 5,
  future_progression: 5,
  academic_or_research: 3,
  blocked_or_needs_review: 5,
}

export type WorkInEducationMatchResult = {
  pathway: 'work_in_my_education'
  profile_summary: {
    education_level: EducationLevel
    qualification_title: string
    subject: string
    specialisation: string | null
    years_relevant_experience: number
    qualification_country: string | null
  }
  normalised_profile: NormalisedWorkInEducationProfile
  resolution: FieldSpecialismResolution
  recommendations: {
    immediate: RoleEligibilityResult[]
    realistic_next: RoleEligibilityResult[]
    future_progression: RoleEligibilityResult[]
    academic_or_research: RoleEligibilityResult[]
    blocked_or_needs_review: RoleEligibilityResult[]
  }
  qualification_recognition: {
    review_needed: boolean
    reason: string
    country: string
  }
  overall_gaps: EligibilityGap[]
  warnings: string[]
  qa_summary: MatchQaSummary
  data_provenance: {
    source: 'career_knowledge_library'
    role_ids: string[]
    field_ids: string[]
    specialism_ids: string[]
  }
  meta: {
    query_count: number
    elapsed_ms: number
    candidate_roles_considered: number
    include_drafts: boolean
    confidence_threshold: number
    score_margin_threshold: number
  }
}

export type MatchOptions = {
  includeDrafts?: boolean
  limits?: Partial<MatchLimits>
  confidenceThreshold?: number
  maxRelatedSpecialisms?: number
  maxRolesPerSpecialism?: number
  /**
   * Clarification loop: force a specialism already returned as an allowed option.
   * Never accept arbitrary IDs without prior clarification options.
   */
  forceSpecialismId?: string | null
}

/** In-memory knowledge rows used by deterministic matching (DB-backed). */
export type KnowledgeFieldRow = {
  id: string
  name: string
  slug: string
  description: string
  active: boolean
  status: string
}

export type KnowledgeSpecialismRow = {
  id: string
  field_id: string
  name: string
  slug: string
  description: string
  regulated_profession: boolean
  professional_body: string | null
  active: boolean
  status: string
  stage_model_id: string | null
}

export type KnowledgeStageRow = {
  id: string
  stage_model_id: string
  stage_key: string
  label: string
  active: boolean
}

export type KnowledgeRoleRow = {
  id: string
  specialism_id: string
  stage_id: string | null
  name: string
  slug: string
  description: string
  role_category: string | null
  seniority_level: string | null
  minimum_experience_years: number | null
  experience_requirement_label: string | null
  professional_registration_requirement: string | null
  professional_membership_requirement: string | null
  academic_requirement: string | null
  is_research_role: boolean | null
  is_academic_role: boolean | null
  is_regulated_or_restricted: boolean | null
  eligibility_note: string | null
  fit_classification: string | null
  priority: number | null
  status: string
  active: boolean
  metadata: Record<string, unknown> | null
}

export type KnowledgeBundle = {
  fields: KnowledgeFieldRow[]
  specialisms: KnowledgeSpecialismRow[]
  stagesById: Map<string, KnowledgeStageRow>
  roles: KnowledgeRoleRow[]
  queryCount: number
}
