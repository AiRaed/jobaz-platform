/**
 * Library-driven browse loaders for Work in My Education.
 * Field → Specialism → Stage — all from Career Knowledge Library tables.
 * No hard-coded names or invented stages.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { DISABLED_STAGE_MARKER_RE } from '@/lib/admin/career-library/disabledStages'
import type {
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
} from './types'

export type LibraryBrowseField = KnowledgeFieldRow & { sort_order?: number | null }
export type LibraryBrowseSpecialism = KnowledgeSpecialismRow & {
  sort_order?: number | null
  disabled_stage_keys?: string[] | null
}
export type LibraryBrowseStage = KnowledgeStageRow & { sort_order?: number | null }

function parseDisabledKeysFromDescription(description: string | null | undefined): string[] {
  if (!description) return []
  const m = description.match(DISABLED_STAGE_MARKER_RE)
  if (!m?.[1]) return []
  return m[1]
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

function statusVisible(status: string | null | undefined, includeDrafts: boolean): boolean {
  const s = (status ?? '').toLowerCase()
  if (s === 'disabled') return false
  if (includeDrafts) return s === 'draft' || s === 'approved' || s === ''
  return s === 'approved' || s === ''
}

export async function loadLibraryFields(
  supabase: SupabaseClient,
  opts: { includeDrafts: boolean }
): Promise<{ fields: LibraryBrowseField[]; queryCount: number; empty: boolean }> {
  const { data, error } = await supabase
    .from('career_library_fields')
    .select('id, name, slug, description, active, status, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw new Error(`Failed to load fields: ${error.message}`)

  const fields = ((data ?? []) as LibraryBrowseField[]).filter((f) =>
    statusVisible(f.status, opts.includeDrafts)
  )
  return { fields, queryCount: 1, empty: fields.length === 0 }
}

export async function loadLibrarySpecialismsForField(
  supabase: SupabaseClient,
  fieldId: string,
  opts: { includeDrafts: boolean }
): Promise<{ specialisms: LibraryBrowseSpecialism[]; queryCount: number; empty: boolean }> {
  let q = supabase
    .from('career_library_specialisms')
    .select(
      'id, field_id, name, slug, description, regulated_profession, professional_body, active, status, stage_model_id, sort_order, disabled_stage_keys'
    )
    .eq('field_id', fieldId)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const { data, error } = await q
  if (error) {
    // Column may be missing on older DBs — retry without disabled_stage_keys
    if (/disabled_stage_keys/i.test(error.message)) {
      const retry = await supabase
        .from('career_library_specialisms')
        .select(
          'id, field_id, name, slug, description, regulated_profession, professional_body, active, status, stage_model_id, sort_order'
        )
        .eq('field_id', fieldId)
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (retry.error) throw new Error(`Failed to load specialisms: ${retry.error.message}`)
      const specialisms = ((retry.data ?? []) as LibraryBrowseSpecialism[]).filter((s) =>
        statusVisible(s.status, opts.includeDrafts)
      )
      return { specialisms, queryCount: 2, empty: specialisms.length === 0 }
    }
    throw new Error(`Failed to load specialisms: ${error.message}`)
  }

  const specialisms = ((data ?? []) as LibraryBrowseSpecialism[]).filter((s) =>
    statusVisible(s.status, opts.includeDrafts)
  )
  return { specialisms, queryCount: 1, empty: specialisms.length === 0 }
}

export async function loadLibraryStagesForSpecialism(
  supabase: SupabaseClient,
  specialismId: string
): Promise<{
  specialism: LibraryBrowseSpecialism | null
  stages: LibraryBrowseStage[]
  queryCount: number
  empty: boolean
  reason?: string
}> {
  let queryCount = 0

  let specRes = await supabase
    .from('career_library_specialisms')
    .select(
      'id, field_id, name, slug, description, regulated_profession, professional_body, active, status, stage_model_id, sort_order, disabled_stage_keys'
    )
    .eq('id', specialismId)
    .eq('active', true)
    .maybeSingle()
  queryCount += 1

  if (specRes.error && /disabled_stage_keys/i.test(specRes.error.message)) {
    specRes = await supabase
      .from('career_library_specialisms')
      .select(
        'id, field_id, name, slug, description, regulated_profession, professional_body, active, status, stage_model_id, sort_order'
      )
      .eq('id', specialismId)
      .eq('active', true)
      .maybeSingle()
    queryCount += 1
  }

  if (specRes.error) throw new Error(`Failed to load specialism: ${specRes.error.message}`)
  const specialism = (specRes.data as LibraryBrowseSpecialism | null) ?? null
  if (!specialism) {
    return {
      specialism: null,
      stages: [],
      queryCount,
      empty: true,
      reason: 'specialism_not_found',
    }
  }

  if (!specialism.stage_model_id) {
    return {
      specialism,
      stages: [],
      queryCount,
      empty: true,
      reason: 'no_stage_model',
    }
  }

  const stagesRes = await supabase
    .from('career_library_stages')
    .select('id, stage_model_id, stage_key, label, active, sort_order')
    .eq('stage_model_id', specialism.stage_model_id)
    .eq('active', true)
    .order('sort_order', { ascending: true })
  queryCount += 1
  if (stagesRes.error) throw new Error(`Failed to load stages: ${stagesRes.error.message}`)

  const disabled = new Set([
    ...(Array.isArray(specialism.disabled_stage_keys)
      ? specialism.disabled_stage_keys.filter((k): k is string => typeof k === 'string')
      : []),
    ...parseDisabledKeysFromDescription(specialism.description),
  ])

  const stages = ((stagesRes.data ?? []) as LibraryBrowseStage[]).filter(
    (st) => !disabled.has(st.stage_key)
  )

  return {
    specialism,
    stages,
    queryCount,
    empty: stages.length === 0,
    reason: stages.length === 0 ? 'no_active_stages' : undefined,
  }
}

export async function loadLibraryRolesForSpecialismStage(
  supabase: SupabaseClient,
  args: {
    specialismId: string
    stageId: string
    includeDrafts: boolean
    maxRoles?: number
    includeOtherStages?: boolean
    maxOtherStageRoles?: number
  }
): Promise<{
  selectedStageRoles: KnowledgeRoleRow[]
  otherStageRoles: KnowledgeRoleRow[]
  queryCount: number
}> {
  const maxRoles = args.maxRoles ?? 80
  const maxOther = args.maxOtherStageRoles ?? 40

  let selectedQ = supabase
    .from('career_library_roles')
    .select(
      'id, specialism_id, stage_id, name, slug, description, role_category, seniority_level, minimum_experience_years, experience_requirement_label, professional_registration_requirement, professional_membership_requirement, academic_requirement, is_research_role, is_academic_role, is_regulated_or_restricted, eligibility_note, fit_classification, priority, status, active, metadata'
    )
    .eq('specialism_id', args.specialismId)
    .eq('stage_id', args.stageId)
    .eq('active', true)
    .order('priority', { ascending: true })
    .limit(maxRoles)

  if (!args.includeDrafts) {
    selectedQ = selectedQ.eq('status', 'approved')
  } else {
    selectedQ = selectedQ.in('status', ['draft', 'approved'])
  }

  const selectedRes = await selectedQ
  if (selectedRes.error) throw new Error(`Failed to load roles: ${selectedRes.error.message}`)

  const selectedStageRoles = ((selectedRes.data ?? []) as KnowledgeRoleRow[]).filter(
    (r) => (r.status ?? '').toLowerCase() !== 'disabled'
  )

  let otherStageRoles: KnowledgeRoleRow[] = []
  let queryCount = 1

  if (args.includeOtherStages !== false) {
    let otherQ = supabase
      .from('career_library_roles')
      .select(
        'id, specialism_id, stage_id, name, slug, description, role_category, seniority_level, minimum_experience_years, experience_requirement_label, professional_registration_requirement, professional_membership_requirement, academic_requirement, is_research_role, is_academic_role, is_regulated_or_restricted, eligibility_note, fit_classification, priority, status, active, metadata'
      )
      .eq('specialism_id', args.specialismId)
      .eq('active', true)
      .neq('stage_id', args.stageId)
      .order('priority', { ascending: true })
      .limit(maxOther)

    if (!args.includeDrafts) {
      otherQ = otherQ.eq('status', 'approved')
    } else {
      otherQ = otherQ.in('status', ['draft', 'approved'])
    }

    const otherRes = await otherQ
    queryCount += 1
    if (otherRes.error) throw new Error(`Failed to load related roles: ${otherRes.error.message}`)
    otherStageRoles = ((otherRes.data ?? []) as KnowledgeRoleRow[]).filter(
      (r) => (r.status ?? '').toLowerCase() !== 'disabled'
    )
  }

  return { selectedStageRoles, otherStageRoles, queryCount }
}

export async function loadLibraryFieldById(
  supabase: SupabaseClient,
  fieldId: string
): Promise<KnowledgeFieldRow | null> {
  const { data, error } = await supabase
    .from('career_library_fields')
    .select('id, name, slug, description, active, status')
    .eq('id', fieldId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load field: ${error.message}`)
  return (data as KnowledgeFieldRow | null) ?? null
}

export async function loadLibraryStageById(
  supabase: SupabaseClient,
  stageId: string
): Promise<KnowledgeStageRow | null> {
  const { data, error } = await supabase
    .from('career_library_stages')
    .select('id, stage_model_id, stage_key, label, active')
    .eq('id', stageId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load stage: ${error.message}`)
  return (data as KnowledgeStageRow | null) ?? null
}
