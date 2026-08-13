/**
 * Work in My Profession — knowledge library types (v1).
 * Separate from Work in My Education. Draft / internal only.
 */

export const WIP_LIBRARY_VERSION = 'work_in_profession.v1' as const
export const WIP_STATUS = 'draft_internal' as const

export type ProfessionalLevelKey =
  | 'helper_assistant'
  | 'beginner'
  | 'experienced_worker'
  | 'supervisor'
  | 'specialist_technician'
  | 'self_employed_owner'

export type ProfessionSeniority =
  | 'entry'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'owner'

export type ProfessionalLevel = {
  key: ProfessionalLevelKey
  label: string
  sort_order: number
  description: string
}

export type ProfessionField = {
  id: string
  slug: string
  name: string
  description: string
  sort_order: number
  status: typeof WIP_STATUS
}

export type ProfessionSpecialism = {
  id: string
  field_id: string
  slug: string
  name: string
  description: string
  sort_order: number
  status: typeof WIP_STATUS
}

export type ProfessionRole = {
  id: string
  role_title: string
  profession_field_id: string
  specialism_id: string
  professional_level: ProfessionalLevelKey
  seniority: ProfessionSeniority
  min_experience_label: string
  typical_entry_requirement: string
  licence_or_check_required: string | null
  uk_role_keywords: string[]
  realistic_start_now: boolean
  progression_roles: string[]
  description: string
  cv_focus_points: string[]
  status: typeof WIP_STATUS
}

export type ProfessionKnowledgeBundle = {
  version: typeof WIP_LIBRARY_VERSION
  status: typeof WIP_STATUS
  levels: ProfessionalLevel[]
  fields: ProfessionField[]
  specialisms: ProfessionSpecialism[]
  roles: ProfessionRole[]
}

export type ProfessionLookupSelection = {
  field_id?: string
  field_slug?: string
  specialism_id?: string
  specialism_slug?: string
  professional_level?: ProfessionalLevelKey
}
