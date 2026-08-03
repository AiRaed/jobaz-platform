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

const STAGE_KEY_RE = /^[a-z][a-z0-9_]*$/

/** Deduplicate and validate stage keys for specialism.disabled_stage_keys. */
export function normalizeDisabledStageKeys(raw: unknown): string[] | null {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) return null
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string') return null
    const key = item.trim().toLowerCase()
    if (!key) continue
    if (!STAGE_KEY_RE.test(key)) return null
    if (seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

export async function validateDisabledStageKeysForModel(
  supabase: SupabaseClient,
  stageModelId: string,
  disabledStageKeys: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (disabledStageKeys.length === 0) return { ok: true }

  const { data: stages, error } = await supabase
    .from('career_library_stages')
    .select('stage_key')
    .eq('stage_model_id', stageModelId)

  if (error) {
    return { ok: false, error: 'Could not validate disabled stages against the stage model.' }
  }

  const allowed = new Set((stages ?? []).map((s) => s.stage_key))
  const unknown = disabledStageKeys.filter((k) => !allowed.has(k))
  if (unknown.length) {
    return {
      ok: false,
      error: `Unknown stage key(s) for this model: ${unknown.join(', ')}.`,
    }
  }
  return { ok: true }
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
