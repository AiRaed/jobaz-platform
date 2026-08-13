/**
 * Canonical qualification taxonomy for Career Knowledge Engine.
 * Shared by WIE wizard, eligibility, pathway UI, and admin forms.
 * Do not hard-code parallel option lists elsewhere.
 */

export type QualificationGroupId =
  | 'no_formal'
  | 'school'
  | 'college_vocational'
  | 'undergraduate'
  | 'postgraduate'
  | 'doctoral'
  | 'professional'
  | 'overseas'
  | 'other_unsure'

/** RQF / UK framework level when reliable; never invent when ambiguous. */
export type UkQualificationLevel =
  | 'entry'
  | 'level_1'
  | 'level_2'
  | 'level_3'
  | 'level_4'
  | 'level_5'
  | 'level_6'
  | 'level_7'
  | 'level_8'
  | 'unknown'

export type EquivalenceStatus =
  | 'uk'
  | 'confirmed'
  | 'not_confirmed'
  | 'unsure'
  | 'not_applicable'

/**
 * Semantic kind — prevents treating teaching / professional / licence
 * credentials as generic academic degree levels.
 */
export type QualificationSemanticKind =
  | 'academic'
  | 'vocational'
  | 'teaching'
  | 'professional_certificate'
  | 'professional_registration'
  | 'statutory_licence'
  | 'industry_accreditation'
  | 'none'
  | 'other'

export type QualificationTypeId = string

export type QualificationTypeDef = {
  id: QualificationTypeId
  label: string
  /** Reliable UK level, or unknown when ambiguous */
  uk_level: UkQualificationLevel
  kind: QualificationSemanticKind
  /**
   * When true, Level 7 teaching quals (e.g. PGCE) must not satisfy
   * generic master’s academic requirements.
   */
  not_generic_masters?: boolean
  /** Distinguish integrated master’s (MEng) from taught master’s (MSc). */
  is_integrated_masters?: boolean
  help_text?: string
}

export type QualificationGroupDef = {
  id: QualificationGroupId
  label: string
  help_text?: string
  types: QualificationTypeDef[]
  /** Show awarding country + equivalence prompts */
  asks_overseas_context?: boolean
}

/**
 * Normalized qualification record stored on the WIE profile.
 * Additive — does not replace legacy education_level.
 */
export type NormalizedQualification = {
  group: QualificationGroupId
  type: QualificationTypeId
  uk_level: UkQualificationLevel
  kind: QualificationSemanticKind
  not_generic_masters: boolean
  is_integrated_masters: boolean
  equivalence_status: EquivalenceStatus
  professional_body: string | null
  registration_or_licence: string | null
  raw_user_input: string | null
  /** Legacy coarse band kept for older consumers */
  education_level_legacy:
    | 'college'
    | 'bachelor'
    | 'master'
    | 'doctorate'
    | 'professional'
    | 'other'
}

export type ResolveQualificationInput = {
  /** New taxonomy fields (preferred) */
  qualification_group?: string | null
  qualification_type?: string | null
  equivalence_status?: string | null
  professional_body?: string | null
  registration_or_licence?: string | null
  /** Legacy single education_level answer or profile value */
  education_level?: string | null
  qualification_title?: string | null
  qualification_country?: string | null
  uk_recognition_confirmed?: string | null
}
