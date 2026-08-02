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
