/**
 * Lookup helpers for Work in My Profession library (no course matching).
 */

import { loadProfessionKnowledge } from './seed'
import type {
  ProfessionField,
  ProfessionLookupSelection,
  ProfessionRole,
  ProfessionSpecialism,
  ProfessionalLevelKey,
} from './types'

export function listProfessionFields(): ProfessionField[] {
  return loadProfessionKnowledge().fields
}

export function listProfessionalLevels() {
  return loadProfessionKnowledge().levels
}

export function getProfessionFieldBySlug(slug: string): ProfessionField | null {
  return listProfessionFields().find((f) => f.slug === slug) ?? null
}

export function getProfessionFieldById(id: string): ProfessionField | null {
  return listProfessionFields().find((f) => f.id === id) ?? null
}

export function listSpecialismsForField(fieldIdOrSlug: string): ProfessionSpecialism[] {
  const field =
    getProfessionFieldById(fieldIdOrSlug) || getProfessionFieldBySlug(fieldIdOrSlug)
  if (!field) return []
  return loadProfessionKnowledge().specialisms.filter((s) => s.field_id === field.id)
}

export function getSpecialismBySlug(
  fieldSlug: string,
  specialismSlug: string
): ProfessionSpecialism | null {
  const field = getProfessionFieldBySlug(fieldSlug)
  if (!field) return null
  return (
    loadProfessionKnowledge().specialisms.find(
      (s) => s.field_id === field.id && s.slug === specialismSlug
    ) ?? null
  )
}

export function listRoles(selection: ProfessionLookupSelection = {}): ProfessionRole[] {
  const knowledge = loadProfessionKnowledge()
  let roles = knowledge.roles

  const field =
    (selection.field_id && getProfessionFieldById(selection.field_id)) ||
    (selection.field_slug && getProfessionFieldBySlug(selection.field_slug)) ||
    null

  if (field) {
    roles = roles.filter((r) => r.profession_field_id === field.id)
  }

  let specialism: ProfessionSpecialism | null = null
  if (selection.specialism_id) {
    specialism = knowledge.specialisms.find((s) => s.id === selection.specialism_id) ?? null
  } else if (selection.specialism_slug && field) {
    specialism =
      knowledge.specialisms.find(
        (s) => s.field_id === field.id && s.slug === selection.specialism_slug
      ) ?? null
  }

  if (specialism) {
    roles = roles.filter((r) => r.specialism_id === specialism!.id)
  }

  if (selection.professional_level) {
    roles = roles.filter((r) => r.professional_level === selection.professional_level)
  }

  return roles
}

/** Field → Specialism → Level → UK target roles (foundation match helper). */
export function lookupProfessionRoles(input: {
  fieldSlug: string
  specialismSlug: string
  professionalLevel: ProfessionalLevelKey
}): {
  field: ProfessionField | null
  specialism: ProfessionSpecialism | null
  level: ProfessionalLevelKey
  roles: ProfessionRole[]
} {
  const field = getProfessionFieldBySlug(input.fieldSlug)
  const specialism = getSpecialismBySlug(input.fieldSlug, input.specialismSlug)
  const roles = listRoles({
    field_slug: input.fieldSlug,
    specialism_slug: input.specialismSlug,
    professional_level: input.professionalLevel,
  })
  return {
    field,
    specialism,
    level: input.professionalLevel,
    roles,
  }
}
