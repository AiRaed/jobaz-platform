/**
 * Work in My Education course alignment — types only.
 * Computed metadata layer; does not replace existing opportunity rows.
 */

export const WIE_GOAL = 'work_in_education' as const

export type CareerGoalPath =
  | 'work_in_education'
  | 'work_in_experience'
  | 'start_new_career'
  | 'grow_current_career'
  | 'extra_income'
  | 'start_business'

export type WieCoursePurpose =
  | 'career_bridge'
  | 'uk_workplace_bridge'
  | 'technical_skill_booster'
  | 'professional_pathway'
  | 'cpd_add_on'
  | 'not_suitable_for_work_in_education'

export type WieRecommendationStrength = 'high' | 'medium' | 'low' | 'none'

export type WieUserStageFit =
  | 'foundation'
  | 'apprentice'
  | 'graduate'
  | 'specialist'
  | 'professional'
  | 'any_early_career'

export type WieAdminBadge =
  | 'work_in_education_aligned'
  | 'not_for_work_in_education'
  | 'needs_education_field_mapping'
  | 'needs_specialism_mapping'
  | 'needs_stage_mapping'
  | 'possible_contamination_risk'

export type WieCourseAlignmentInput = {
  title: string
  shortLabel?: string | null
  coursePurpose?: string | null
  educationFields?: string[] | null
  specialisations?: string[] | null
  goalKeys?: string[] | null
  routeLabels?: string[] | null
  commercialStatus?: string | null
  providerStatus?: string | null
  adminNotes?: string | null
  /** Optional explicit stage hints from library / admin */
  stageHints?: string[] | null
}

export type WieCourseAlignment = {
  education_field: string[]
  specialism: string[]
  stage: string[]
  purpose: WieCoursePurpose
  recommended_for_goal: CareerGoalPath[]
  recommendation_strength: WieRecommendationStrength
  user_stage_fit: WieUserStageFit[]
  commercial_status: string
  provider_status: string
  primary_goal_paths: CareerGoalPath[]
  excluded_goal_paths: CareerGoalPath[]
  admin_badges: WieAdminBadge[]
  contamination_risk: boolean
  exclusion_reason: string | null
  purpose_label: string
}

export type WieRecommendContext = {
  educationField?: string | null
  specialism?: string | null
  stageKey?: string | null
  stageLabel?: string | null
}

export type WieAlignmentAuditSummary = {
  total_reviewed: number
  work_in_education_aligned: number
  missing_education_field: number
  missing_specialism: number
  missing_stage: number
  excluded_from_work_in_education: number
  contamination_risks: number
  high_priority_missing_providers: number
  sample_excluded: string[]
  sample_contamination: string[]
  sample_missing_provider: string[]
}
