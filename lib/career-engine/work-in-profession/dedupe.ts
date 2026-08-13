/**
 * Deduplicate Work in My Profession role targets.
 * Key: field + specialism + level + role_title + licence_or_check_required
 */

import type { ProfessionRole } from './types'

export type ProfessionRoleDedupeKey = {
  profession_field_id: string
  specialism_id: string
  professional_level: string
  role_title: string
  licence_or_check_required: string
}

export function normalizeLicence(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export function normalizeRoleTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function professionRoleDedupeKey(role: ProfessionRole): string {
  return [
    role.profession_field_id,
    role.specialism_id,
    role.professional_level,
    normalizeRoleTitle(role.role_title),
    normalizeLicence(role.licence_or_check_required),
  ].join('||')
}

function scoreRole(role: ProfessionRole): number {
  let score = 0
  if (role.description?.trim()) score += 2
  if (role.cv_focus_points?.length) score += role.cv_focus_points.length
  if (role.progression_roles?.length) score += role.progression_roles.length
  if (role.uk_role_keywords?.length) score += role.uk_role_keywords.length
  if (role.typical_entry_requirement?.trim()) score += 1
  if (role.min_experience_label?.trim()) score += 1
  if (role.licence_or_check_required?.trim()) score += 1
  return score
}

function mergeRoles(keep: ProfessionRole, drop: ProfessionRole): ProfessionRole {
  const preferred = scoreRole(drop) > scoreRole(keep) ? drop : keep
  const other = preferred === keep ? drop : keep
  return {
    ...preferred,
    id: keep.id,
    role_title: preferred.role_title.trim(),
    licence_or_check_required:
      preferred.licence_or_check_required?.trim() ||
      other.licence_or_check_required?.trim() ||
      null,
    uk_role_keywords: Array.from(
      new Set([...(preferred.uk_role_keywords || []), ...(other.uk_role_keywords || [])])
    ),
    progression_roles: Array.from(
      new Set([...(preferred.progression_roles || []), ...(other.progression_roles || [])])
    ),
    cv_focus_points: Array.from(
      new Set([...(preferred.cv_focus_points || []), ...(other.cv_focus_points || [])])
    ),
    description: preferred.description?.trim() || other.description?.trim() || preferred.description,
    typical_entry_requirement:
      preferred.typical_entry_requirement?.trim() ||
      other.typical_entry_requirement?.trim() ||
      preferred.typical_entry_requirement,
    min_experience_label:
      preferred.min_experience_label?.trim() ||
      other.min_experience_label?.trim() ||
      preferred.min_experience_label,
    realistic_start_now: preferred.realistic_start_now || other.realistic_start_now,
  }
}

export type DedupeRolesResult = {
  roles: ProfessionRole[]
  raw_count: number
  unique_count: number
  duplicates_removed: number
}

/** Merge duplicate role targets; keeps first id, merges richer metadata. */
export function dedupeProfessionRoles(roles: ProfessionRole[]): DedupeRolesResult {
  const byKey = new Map<string, ProfessionRole>()
  let duplicates_removed = 0

  for (const role of roles) {
    const title = role.role_title?.trim()
    if (!title) continue

    const cleaned: ProfessionRole = { ...role, role_title: title }
    const key = professionRoleDedupeKey(cleaned)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, cleaned)
      continue
    }
    byKey.set(key, mergeRoles(existing, cleaned))
    duplicates_removed += 1
  }

  const deduped = Array.from(byKey.values())
  return {
    roles: deduped,
    raw_count: roles.length,
    unique_count: deduped.length,
    duplicates_removed,
  }
}
