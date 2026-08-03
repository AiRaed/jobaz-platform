import {
  DISABLED_STAGE_MARKER_RE,
  stripDisabledStageMarker,
} from './disabledStages'
import type {
  CareerLibraryAcademicRequirement,
  CareerLibraryField,
  CareerLibraryFieldStatus,
  CareerLibraryFitClassification,
  CareerLibraryPublishStatus,
  CareerLibraryRegistrationRequirement,
  CareerLibraryRole,
  CareerLibraryRoleCategory,
  CareerLibraryRoleStatus,
  CareerLibrarySeniorityLevel,
  CareerLibrarySpecialism,
  CareerLibraryStage,
  CareerLibraryStageModel,
} from './types'

type FieldRow = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type StageModelRow = {
  id: string
  model_key: string
  name: string
  description: string | null
  active: boolean
  is_system?: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type StageRow = {
  id: string
  stage_model_id: string
  stage_key: string
  label: string
  description: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

type SpecialismRow = {
  id: string
  field_id: string
  name: string
  slug: string
  description?: string | null
  stage_model_id: string | null
  disabled_stage_keys?: string[] | null
  regulated_profession: boolean
  professional_body: string | null
  status: string
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  career_library_fields?: { name: string } | { name: string }[] | null
  career_library_stage_models?:
    | { model_key: string; name: string }
    | { model_key: string; name: string }[]
    | null
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function fieldStatus(value: string | null | undefined, active: boolean): CareerLibraryFieldStatus {
  if (value === 'approved' || value === 'draft' || value === 'disabled') return value
  return active ? 'draft' : 'disabled'
}

export function mapFieldRow(row: FieldRow, specialismCount = 0): CareerLibraryField {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    status: fieldStatus(row.status, row.active),
    active: Boolean(row.active),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    specialismCount,
  }
}

export function mapStageRow(row: StageRow): CareerLibraryStage {
  return {
    id: row.id,
    stageModelId: row.stage_model_id,
    stageKey: row.stage_key,
    label: row.label,
    description: row.description ?? '',
    sortOrder: row.sort_order ?? 0,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapStageModelRow(
  row: StageModelRow,
  stages: StageRow[] = []
): CareerLibraryStageModel {
  return {
    id: row.id,
    modelKey: row.model_key,
    name: row.name,
    description: row.description ?? '',
    active: Boolean(row.active),
    isSystem: Boolean(row.is_system),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stages: stages
      .map(mapStageRow)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
  }
}

function parseDisabledStageKeysFromDescription(description: string): string[] {
  const match = description.match(DISABLED_STAGE_MARKER_RE)
  if (!match?.[1]) return []
  return match[1]
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => /^[a-z][a-z0-9_]*$/.test(k))
}

export function mapSpecialismRow(
  row: SpecialismRow,
  dependentCount = 0
): CareerLibrarySpecialism {
  const field = one(row.career_library_fields)
  const stage = one(row.career_library_stage_models)
  const rawDescription = row.description ?? ''
  const fromColumn = Array.isArray(row.disabled_stage_keys)
    ? row.disabled_stage_keys.filter((k): k is string => typeof k === 'string' && k.trim() !== '')
    : []
  const fromMarker = parseDisabledStageKeysFromDescription(rawDescription)
  return {
    id: row.id,
    fieldId: row.field_id,
    name: row.name,
    slug: row.slug,
    description: stripDisabledStageMarker(rawDescription),
    stageModelId: row.stage_model_id,
    disabledStageKeys: fromColumn.length ? fromColumn : fromMarker,
    regulatedProfession: Boolean(row.regulated_profession),
    professionalBody: row.professional_body,
    status: (row.status === 'approved' ? 'approved' : 'draft') as CareerLibraryPublishStatus,
    active: Boolean(row.active),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fieldName: field?.name,
    stageModelKey: stage?.model_key ?? null,
    stageModelName: stage?.name ?? null,
    dependentCount,
  }
}

type RoleRow = {
  id: string
  specialism_id: string
  stage_id?: string | null
  name: string
  slug: string
  description?: string | null
  role_category?: string | null
  seniority_level?: string | null
  minimum_experience_years?: number | null
  experience_requirement_label?: string | null
  professional_registration_requirement?: string | null
  professional_membership_requirement?: string | null
  academic_requirement?: string | null
  is_research_role?: boolean | null
  is_academic_role?: boolean | null
  is_regulated_or_restricted?: boolean | null
  eligibility_note?: string | null
  fit_classification?: string | null
  priority?: number | null
  status: string
  active: boolean
  sort_order: number
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  career_library_specialisms?:
    | {
        name: string
        field_id: string
        career_library_fields?: { name: string } | { name: string }[] | null
      }
    | {
        name: string
        field_id: string
        career_library_fields?: { name: string } | { name: string }[] | null
      }[]
    | null
  career_library_stages?:
    | { stage_key: string; label: string }
    | { stage_key: string; label: string }[]
    | null
}

function asRoleCategory(value: string | null | undefined): CareerLibraryRoleCategory {
  const allowed: CareerLibraryRoleCategory[] = [
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
  return allowed.includes(value as CareerLibraryRoleCategory)
    ? (value as CareerLibraryRoleCategory)
    : 'professional_practice'
}

function asSeniority(value: string | null | undefined): CareerLibrarySeniorityLevel {
  const allowed: CareerLibrarySeniorityLevel[] = [
    'entry',
    'early_career',
    'mid_level',
    'senior',
    'principal',
    'leadership',
    'academic_research',
  ]
  return allowed.includes(value as CareerLibrarySeniorityLevel)
    ? (value as CareerLibrarySeniorityLevel)
    : 'entry'
}

function asRegistration(
  value: string | null | undefined
): CareerLibraryRegistrationRequirement {
  const allowed: CareerLibraryRegistrationRequirement[] = [
    'none',
    'desirable',
    'commonly_expected',
    'required',
  ]
  return allowed.includes(value as CareerLibraryRegistrationRequirement)
    ? (value as CareerLibraryRegistrationRequirement)
    : 'none'
}

function asAcademicReq(value: string | null | undefined): CareerLibraryAcademicRequirement {
  const allowed: CareerLibraryAcademicRequirement[] = [
    'none',
    'degree_relevant',
    'masters_relevant',
    'phd_relevant',
    'accredited_degree_preferred',
  ]
  return allowed.includes(value as CareerLibraryAcademicRequirement)
    ? (value as CareerLibraryAcademicRequirement)
    : 'degree_relevant'
}

function asFit(value: string | null | undefined): CareerLibraryFitClassification {
  const allowed: CareerLibraryFitClassification[] = [
    'immediate',
    'realistic_next',
    'future_progression',
    'academic_or_research',
  ]
  return allowed.includes(value as CareerLibraryFitClassification)
    ? (value as CareerLibraryFitClassification)
    : 'realistic_next'
}

function asRoleStatus(value: string | null | undefined, active: boolean): CareerLibraryRoleStatus {
  if (value === 'approved' || value === 'draft' || value === 'disabled') return value
  return active ? 'draft' : 'disabled'
}

export function mapRoleRow(row: RoleRow): CareerLibraryRole {
  const specialism = one(row.career_library_specialisms)
  const field = one(specialism?.career_library_fields)
  const stage = one(row.career_library_stages)
  const meta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata
      : {}

  return {
    id: row.id,
    specialismId: row.specialism_id,
    stageId: row.stage_id ?? null,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    roleCategory: asRoleCategory(row.role_category),
    seniorityLevel: asSeniority(row.seniority_level),
    minimumExperienceYears: row.minimum_experience_years ?? 0,
    experienceRequirementLabel:
      row.experience_requirement_label ?? 'Experience requirements to be confirmed',
    professionalRegistrationRequirement: asRegistration(
      row.professional_registration_requirement
    ),
    professionalMembershipRequirement: asRegistration(row.professional_membership_requirement),
    academicRequirement: asAcademicReq(row.academic_requirement),
    isResearchRole: Boolean(row.is_research_role),
    isAcademicRole: Boolean(row.is_academic_role),
    isRegulatedOrRestricted: Boolean(row.is_regulated_or_restricted),
    eligibilityNote: row.eligibility_note ?? '',
    fitClassification: asFit(row.fit_classification),
    priority: row.priority ?? row.sort_order ?? 0,
    status: asRoleStatus(row.status, row.active),
    active: Boolean(row.active),
    sortOrder: row.sort_order ?? 0,
    metadata: meta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    specialismName: specialism?.name,
    fieldId: specialism?.field_id,
    fieldName: field?.name,
    stageKey: stage?.stage_key ?? (typeof meta.stage_key === 'string' ? meta.stage_key : null),
    stageLabel: stage?.label ?? (typeof meta.stage_label === 'string' ? meta.stage_label : null),
  }
}
