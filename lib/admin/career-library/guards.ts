import type { SupabaseClient } from '@supabase/supabase-js'
import { slugifyCareerLibraryName, stageKeyFromLabel } from './types'

export function normalizeSlug(raw: string | undefined, fallbackName: string): string | null {
  const fromRaw = raw?.trim() ? slugifyCareerLibraryName(raw) : ''
  const slug = fromRaw || slugifyCareerLibraryName(fallbackName)
  return slug || null
}

export function normalizeStageKey(raw: string | undefined, fallbackLabel: string): string | null {
  const fromRaw = raw?.trim() ? stageKeyFromLabel(raw) : ''
  const key = fromRaw || stageKeyFromLabel(fallbackLabel)
  return key || null
}

export async function countSpecialismsForField(
  supabase: SupabaseClient,
  fieldId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('career_library_specialisms')
    .select('id', { count: 'exact', head: true })
    .eq('field_id', fieldId)
  if (error) return -1
  return count ?? 0
}

export async function countSpecialismsForStageModel(
  supabase: SupabaseClient,
  stageModelId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('career_library_specialisms')
    .select('id', { count: 'exact', head: true })
    .eq('stage_model_id', stageModelId)
  if (error) return -1
  return count ?? 0
}

export async function countSpecialismDependents(
  supabase: SupabaseClient,
  specialismId: string
): Promise<number> {
  const tables = [
    'career_library_roles',
    'career_library_learning_options',
    'career_library_qualification_recognition',
    'career_library_report_rules',
  ] as const

  let total = 0
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', specialismId)
    if (error) return -1
    total += count ?? 0
  }
  return total
}

/** Learning options may reference a role; delete uses ON DELETE SET NULL. */
export async function countRoleLearningLinks(
  supabase: SupabaseClient,
  roleId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('career_library_learning_options')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', roleId)
  if (error) return -1
  return count ?? 0
}
