/**
 * Work in My Education assessment — types.
 * Blueprint is typed config (v1); later Admin CRUD can replace the loader.
 */

export const WIE_ASSESSMENT_BLUEPRINT_VERSION = 'wie-assessment-v1.0.0'

export type AssessmentQuestionType =
  | 'single_select'
  | 'multi_select'
  | 'text'
  | 'autocomplete'
  | 'number'
  | 'boolean'
  | 'year'
  | 'country'
  | 'registration'
  | 'skill_list'
  | 'language_list'

export type ShowWhenOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'truthy' | 'falsy'

export type ShowWhenCondition = {
  answer_key: string
  operator: ShowWhenOperator
  expected_value?: unknown
}

export type ShowWhenGroup = {
  logic: 'and' | 'or'
  conditions: ShowWhenCondition[]
}

export type AssessmentQuestionOption = {
  value: string
  label: string
  help_text?: string
}

export type AssessmentQuestion = {
  id: string
  key: string
  label: string
  help_text: string
  type: AssessmentQuestionType
  required: boolean
  options?: AssessmentQuestionOption[]
  validation?: {
    min?: number
    max?: number
    max_length?: number
    pattern?: string
  }
  show_when?: ShowWhenGroup | null
  maps_to: string
  sort_order: number
}

export type AssessmentBlueprint = {
  version: string
  pathway: 'work_in_my_education'
  name: string
  active: boolean
  created_at: string
  questions: AssessmentQuestion[]
  readiness_notes: string[]
}

export type AssessmentRegistrationAnswer = {
  has_registration?: boolean | string | null
  body?: string | null
  status?: string | null
  scope?: string | null
}

export type AssessmentPreferencesAnswer = {
  related_field_only?: boolean | string | null
  open_to_related_fields?: boolean | string | null
  open_to_retraining?: boolean | string | null
  academic_route?: boolean | string | null
}

/** Flat answer bag keyed by question key (and nested registration/preferences). */
export type WorkInEducationAssessmentAnswers = {
  /** Legacy coarse band — still accepted; derived from taxonomy when group+type set */
  education_level?: string | null
  /** Canonical taxonomy group (e.g. undergraduate) */
  qualification_group?: string | null
  /** Canonical taxonomy type (e.g. bachelors, pgce, hnc) */
  qualification_type?: string | null
  /** Overseas equivalence: confirmed | not_confirmed | unsure */
  equivalence_status?: string | null
  qualification_title?: string | null
  subject?: string | null
  specialisation?: string | null
  qualification_country?: string | null
  graduation_status?: string | null
  graduation_year?: number | null
  years_relevant_experience?: number | null
  current_job_title?: string | null
  has_uk_experience?: string | boolean | null
  registration?: AssessmentRegistrationAnswer | null
  licences?: string[] | null
  skills?: string[] | null
  english_level?: string | null
  preferences?: AssessmentPreferencesAnswer | null
  /** Engineering optional */
  engineering_registration?: string | null
  /** Teaching optional */
  qts_status?: string | null
  /** Overseas recognition optional (maps to equivalence_status) */
  uk_recognition_confirmed?: string | null
  [key: string]: unknown
}

export type ClarificationAnswers = {
  selected_specialism_id?: string | null
}

export type AssessmentRequest = {
  blueprint_version?: string
  answers: WorkInEducationAssessmentAnswers
  clarification_answers?: ClarificationAnswers
  includeDrafts?: boolean
}

export type MappingProvenance = {
  answer_key: string
  profile_path: string
  transformation: string
}

export type ProfileMappingResult = {
  profile: import('../types').WorkInEducationProfile
  mapping_warnings: string[]
  mapping_provenance: MappingProvenance[]
}

export type PresentationMessage = {
  message_key: string
  params: Record<string, string | number | boolean | null>
  text: string
}

export type PresentationNextAction = {
  type: 'clarification' | 'registration' | 'recognition' | 'experience' | 'course' | 'review'
  message_key: string
  params: Record<string, string | number | boolean | null>
  text: string
}

export type AssessmentPresentation = {
  headline_key: string
  headline_params: Record<string, string | number | boolean | null>
  headline: string
  summary_items: PresentationMessage[]
  next_action_items: PresentationNextAction[]
}

export type AssessmentStatus = 'complete' | 'needs_clarification' | 'invalid'

export type WorkInEducationAssessmentResult = {
  pathway: 'work_in_my_education'
  blueprint_version: string
  assessment_status: AssessmentStatus
  profile: import('../types').WorkInEducationProfile | null
  mapping: ProfileMappingResult | null
  match: import('../types').WorkInEducationMatchResult | null
  resolution: import('../types').FieldSpecialismResolution | null
  recommendations: import('../types').WorkInEducationMatchResult['recommendations'] | null
  clarification: {
    required: boolean
    reason: string
    options: Array<{
      specialism_id: string
      name: string
      slug: string
      score: number
      reason: string
    }>
  }
  summary: {
    matched_education: string
    primary_direction: string
    immediate_count: number
    realistic_next_count: number
    future_count: number
    academic_count: number
    blocked_count: number
  }
  presentation: AssessmentPresentation
  next_actions: PresentationNextAction[]
  warnings: string[]
  validation_errors: string[]
  visible_question_keys: string[]
  trace: {
    mapping_ms: number
    matcher_ms: number
    total_ms: number
    query_count: number
    forced_specialism_id: string | null
  }
}
