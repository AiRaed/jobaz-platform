/**
 * Career Knowledge Library — admin foundation types.
 * Separate from the live Career Assistant / Career Engine.
 */

export type CareerLibraryFieldStatus = 'draft' | 'approved' | 'disabled'
export type CareerLibraryPublishStatus = 'draft' | 'approved'
export type CareerLibraryRoleStatus = 'draft' | 'approved' | 'disabled'

export type CareerLibraryRoleCategory =
  | 'graduate_entry'
  | 'professional_practice'
  | 'design'
  | 'site_delivery'
  | 'project_management'
  | 'technical_specialist'
  | 'research'
  | 'academic'
  | 'consultancy'
  | 'leadership'

export type CareerLibrarySeniorityLevel =
  | 'entry'
  | 'early_career'
  | 'mid_level'
  | 'senior'
  | 'principal'
  | 'leadership'
  | 'academic_research'

export type CareerLibraryRegistrationRequirement =
  | 'none'
  | 'desirable'
  | 'commonly_expected'
  | 'required'

export type CareerLibraryAcademicRequirement =
  | 'none'
  | 'degree_relevant'
  | 'masters_relevant'
  | 'phd_relevant'
  | 'accredited_degree_preferred'

export type CareerLibraryFitClassification =
  | 'immediate'
  | 'realistic_next'
  | 'future_progression'
  | 'academic_or_research'

export const CAREER_LIBRARY_ROLE_CATEGORIES: CareerLibraryRoleCategory[] = [
  'graduate_entry',
  'professional_practice',
  'design',
  'site_delivery',
  'project_management',
  'technical_specialist',
  'research',
  'academic',
  'consultancy',
  'leadership',
]

export const CAREER_LIBRARY_SENIORITY_LEVELS: CareerLibrarySeniorityLevel[] = [
  'entry',
  'early_career',
  'mid_level',
  'senior',
  'principal',
  'leadership',
  'academic_research',
]

export const CAREER_LIBRARY_REGISTRATION_REQUIREMENTS: CareerLibraryRegistrationRequirement[] = [
  'none',
  'desirable',
  'commonly_expected',
  'required',
]

export const CAREER_LIBRARY_ACADEMIC_REQUIREMENTS: CareerLibraryAcademicRequirement[] = [
  'none',
  'degree_relevant',
  'masters_relevant',
  'phd_relevant',
  'accredited_degree_preferred',
]

export const CAREER_LIBRARY_FIT_CLASSIFICATIONS: CareerLibraryFitClassification[] = [
  'immediate',
  'realistic_next',
  'future_progression',
  'academic_or_research',
]

/**
 * WIE-facing metadata keys (stored in JSON `metadata` — migration-safe defaults).
 * Admins can set these without schema breakage; missing keys use safe defaults.
 */
export type CareerLibraryStageMeaning = 'target' | 'current' | 'both'

export type CareerLibraryTrainingItemType =
  | 'course'
  | 'qualification'
  | 'licence'
  | 'certification'
  | 'skill'
  | 'career_preparation'
  | 'workshop'
  | 'knowledge_area'

export type CareerLibraryWieMetadata = {
  /** How the library stage should be interpreted in WIE matching */
  stageMeaning?: CareerLibraryStageMeaning
  currentStageApplicable?: boolean
  targetStageApplicable?: boolean
  trainingItemType?: CareerLibraryTrainingItemType
  providerEligible?: boolean
  completionTrackable?: boolean
}

/** Defaults when metadata keys are absent (do not break existing records). */
export const CAREER_LIBRARY_WIE_METADATA_DEFAULTS: Required<
  Pick<
    CareerLibraryWieMetadata,
    | 'stageMeaning'
    | 'currentStageApplicable'
    | 'targetStageApplicable'
    | 'trainingItemType'
    | 'providerEligible'
    | 'completionTrackable'
  >
> = {
  stageMeaning: 'target',
  currentStageApplicable: true,
  targetStageApplicable: true,
  trainingItemType: 'knowledge_area',
  providerEligible: false,
  completionTrackable: false,
}

export function readCareerLibraryWieMetadata(
  metadata: Record<string, unknown> | null | undefined
): Required<typeof CAREER_LIBRARY_WIE_METADATA_DEFAULTS> & CareerLibraryWieMetadata {
  const m = metadata && typeof metadata === 'object' ? metadata : {}
  const stageMeaningRaw = String(m.stageMeaning ?? m.stage_meaning ?? '').toLowerCase()
  const stageMeaning: CareerLibraryStageMeaning =
    stageMeaningRaw === 'current' || stageMeaningRaw === 'both' || stageMeaningRaw === 'target'
      ? stageMeaningRaw
      : CAREER_LIBRARY_WIE_METADATA_DEFAULTS.stageMeaning

  const trainingRaw = String(m.trainingItemType ?? m.training_item_type ?? '').toLowerCase()
  const allowed: CareerLibraryTrainingItemType[] = [
    'course',
    'qualification',
    'licence',
    'certification',
    'skill',
    'career_preparation',
    'workshop',
    'knowledge_area',
  ]
  const trainingItemType = (
    trainingRaw === 'license' ? 'licence' : trainingRaw
  ) as CareerLibraryTrainingItemType
  const resolvedType = allowed.includes(trainingItemType)
    ? trainingItemType
    : CAREER_LIBRARY_WIE_METADATA_DEFAULTS.trainingItemType

  const bool = (v: unknown, fallback: boolean) =>
    typeof v === 'boolean' ? v : fallback

  return {
    stageMeaning,
    currentStageApplicable: bool(
      m.currentStageApplicable ?? m.current_stage_applicable,
      CAREER_LIBRARY_WIE_METADATA_DEFAULTS.currentStageApplicable
    ),
    targetStageApplicable: bool(
      m.targetStageApplicable ?? m.target_stage_applicable,
      CAREER_LIBRARY_WIE_METADATA_DEFAULTS.targetStageApplicable
    ),
    trainingItemType: resolvedType,
    providerEligible: bool(
      m.providerEligible ?? m.provider_eligible,
      CAREER_LIBRARY_WIE_METADATA_DEFAULTS.providerEligible
    ),
    completionTrackable: bool(
      m.completionTrackable ?? m.completion_trackable,
      CAREER_LIBRARY_WIE_METADATA_DEFAULTS.completionTrackable
    ),
  }
}

export type CareerLibraryStage = {
  id: string
  stageModelId: string
  stageKey: string
  label: string
  description: string
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
  /** Optional WIE semantics (JSON metadata on stage row when present) */
  metadata?: Record<string, unknown>
}

export type CareerLibraryStageModel = {
  id: string
  modelKey: string
  name: string
  description: string
  active: boolean
  isSystem: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  stages: CareerLibraryStage[]
}

export type CareerLibraryField = {
  id: string
  name: string
  slug: string
  description: string
  status: CareerLibraryFieldStatus
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  specialismCount?: number
}

export type CareerLibrarySpecialism = {
  id: string
  fieldId: string
  name: string
  slug: string
  description: string
  stageModelId: string | null
  /** Stage keys from the linked model that are not relevant for this specialism. */
  disabledStageKeys: string[]
  regulatedProfession: boolean
  professionalBody: string | null
  status: CareerLibraryPublishStatus
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  fieldName?: string
  stageModelKey?: string | null
  stageModelName?: string | null
  dependentCount?: number
}

export type CareerLibraryFieldInput = {
  name: string
  slug?: string
  description?: string
  status?: CareerLibraryFieldStatus
  active?: boolean
  sortOrder?: number
}

export type CareerLibrarySpecialismInput = {
  fieldId: string
  name: string
  slug?: string
  description?: string
  stageModelId: string
  /** Stage keys to disable for this specialism (must belong to the chosen stage model). */
  disabledStageKeys?: string[]
  regulatedProfession?: boolean
  professionalBody?: string | null
  status?: CareerLibraryPublishStatus
  active?: boolean
  sortOrder?: number
}

export type CareerLibraryRole = {
  id: string
  specialismId: string
  stageId: string | null
  name: string
  slug: string
  description: string
  roleCategory: CareerLibraryRoleCategory
  seniorityLevel: CareerLibrarySeniorityLevel
  minimumExperienceYears: number
  experienceRequirementLabel: string
  professionalRegistrationRequirement: CareerLibraryRegistrationRequirement
  professionalMembershipRequirement: CareerLibraryRegistrationRequirement
  academicRequirement: CareerLibraryAcademicRequirement
  isResearchRole: boolean
  isAcademicRole: boolean
  isRegulatedOrRestricted: boolean
  eligibilityNote: string
  fitClassification: CareerLibraryFitClassification
  priority: number
  status: CareerLibraryRoleStatus
  active: boolean
  sortOrder: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  specialismName?: string
  fieldId?: string
  fieldName?: string
  stageKey?: string | null
  stageLabel?: string | null
}

export type CareerLibraryRoleInput = {
  specialismId: string
  stageId?: string | null
  name: string
  slug?: string
  description?: string
  roleCategory?: CareerLibraryRoleCategory
  seniorityLevel?: CareerLibrarySeniorityLevel
  minimumExperienceYears?: number
  experienceRequirementLabel?: string
  professionalRegistrationRequirement?: CareerLibraryRegistrationRequirement
  professionalMembershipRequirement?: CareerLibraryRegistrationRequirement
  academicRequirement?: CareerLibraryAcademicRequirement
  isResearchRole?: boolean
  isAcademicRole?: boolean
  isRegulatedOrRestricted?: boolean
  eligibilityNote?: string
  fitClassification?: CareerLibraryFitClassification
  priority?: number
  status?: CareerLibraryRoleStatus
  active?: boolean
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export type CareerLibraryStageModelInput = {
  modelKey?: string
  name: string
  description?: string
  active?: boolean
  sortOrder?: number
}

export type CareerLibraryStageInput = {
  stageModelId: string
  stageKey?: string
  label: string
  description?: string
  sortOrder?: number
  active?: boolean
}

export type CareerLibraryOverview = {
  fields: CareerLibraryField[]
  specialisms: CareerLibrarySpecialism[]
  stageModels: CareerLibraryStageModel[]
}

export function slugifyCareerLibraryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function stageKeyFromLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
}
