/**
 * Bounded Career Knowledge Library reads for Work in My Education matching.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  KnowledgeBundle,
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
} from './types'

export async function loadActiveFieldsAndSpecialisms(
  supabase: SupabaseClient
): Promise<{
  fields: KnowledgeFieldRow[]
  specialisms: KnowledgeSpecialismRow[]
  queryCount: number
}> {
  let queryCount = 0

  const fieldsRes = await supabase
    .from('career_library_fields')
    .select('id, name, slug, description, active, status')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  queryCount += 1
  if (fieldsRes.error) throw new Error(`Failed to load fields: ${fieldsRes.error.message}`)

  const specsRes = await supabase
    .from('career_library_specialisms')
    .select(
      'id, field_id, name, slug, description, regulated_profession, professional_body, active, status, stage_model_id'
    )
    .eq('active', true)
    .order('sort_order', { ascending: true })
  queryCount += 1
  if (specsRes.error) throw new Error(`Failed to load specialisms: ${specsRes.error.message}`)

  return {
    fields: (fieldsRes.data ?? []) as KnowledgeFieldRow[],
    specialisms: (specsRes.data ?? []) as KnowledgeSpecialismRow[],
    queryCount,
  }
}

export async function loadStagesByIds(
  supabase: SupabaseClient,
  stageIds: string[]
): Promise<{ stagesById: Map<string, KnowledgeStageRow>; queryCount: number }> {
  const stagesById = new Map<string, KnowledgeStageRow>()
  if (!stageIds.length) return { stagesById, queryCount: 0 }

  const unique = [...new Set(stageIds)].slice(0, 500)
  const { data, error } = await supabase
    .from('career_library_stages')
    .select('id, stage_model_id, stage_key, label, active')
    .in('id', unique)
  if (error) throw new Error(`Failed to load stages: ${error.message}`)
  for (const row of data ?? []) {
    stagesById.set(row.id, row as KnowledgeStageRow)
  }
  return { stagesById, queryCount: 1 }
}

export async function loadRolesForSpecialisms(
  supabase: SupabaseClient,
  specialismIds: string[],
  opts: { includeDrafts: boolean; maxPerSpecialism: number }
): Promise<{ roles: KnowledgeRoleRow[]; queryCount: number }> {
  if (!specialismIds.length) return { roles: [], queryCount: 0 }

  let queryCount = 0
  const roles: KnowledgeRoleRow[] = []

  // Query per specialism with limit — avoids loading all 9k roles
  for (const specialismId of specialismIds) {
    let q = supabase
      .from('career_library_roles')
      .select(
        'id, specialism_id, stage_id, name, slug, description, role_category, seniority_level, minimum_experience_years, experience_requirement_label, professional_registration_requirement, professional_membership_requirement, academic_requirement, is_research_role, is_academic_role, is_regulated_or_restricted, eligibility_note, fit_classification, priority, status, active, metadata'
      )
      .eq('specialism_id', specialismId)
      .eq('active', true)
      .order('priority', { ascending: true })
      .limit(opts.maxPerSpecialism)

    if (!opts.includeDrafts) {
      q = q.eq('status', 'approved')
    } else {
      q = q.in('status', ['draft', 'approved'])
    }

    const { data, error } = await q
    queryCount += 1
    if (error) throw new Error(`Failed to load roles for specialism: ${error.message}`)
    for (const row of data ?? []) {
      roles.push(row as KnowledgeRoleRow)
    }
  }

  return { roles, queryCount }
}

export async function loadKnowledgeForMatch(
  supabase: SupabaseClient,
  specialismIds: string[],
  opts: { includeDrafts: boolean; maxPerSpecialism: number }
): Promise<KnowledgeBundle> {
  const base = await loadActiveFieldsAndSpecialisms(supabase)
  const roleLoad = await loadRolesForSpecialisms(supabase, specialismIds, opts)
  const stageIds = roleLoad.roles.map((r) => r.stage_id).filter((id): id is string => Boolean(id))
  const stages = await loadStagesByIds(supabase, stageIds)

  return {
    fields: base.fields,
    specialisms: base.specialisms,
    stagesById: stages.stagesById,
    roles: roleLoad.roles,
    queryCount: base.queryCount + roleLoad.queryCount + stages.queryCount,
  }
}
