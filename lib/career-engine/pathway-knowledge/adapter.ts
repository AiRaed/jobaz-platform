/**
 * Supabase Career Knowledge Library → CareerPathwayKnowledge adapter.
 * Assessment engine does not call this; result UI / API do.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { isTitleSafeForWorkInEducation } from '@/lib/career-engine/work-in-education/course-alignment'
import type { CareerPathwayKnowledge, CareerPathwayKnowledgeAdapter } from './types'
import { emptyPathwayKnowledge, filledBlock, placeholderBlock } from './placeholders'
import {
  buildPathwayDetailResponse,
  roleRowToDetailRole,
} from './build-detail'
import type {
  PathwayDetailResponse,
  PathwayMatchContextPayload,
} from './detail-types'

function humaniseEnum(raw: string | null | undefined): string | null {
  if (!raw || raw === 'none') return null
  return raw.replace(/_/g, ' ')
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function metaRecord(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>
  }
  return {}
}

type RoleJoinRow = {
  id: string
  name: string
  description?: string | null
  role_category?: string | null
  seniority_level?: string | null
  minimum_experience_years?: number | null
  experience_requirement_label?: string | null
  professional_registration_requirement?: string | null
  professional_membership_requirement?: string | null
  academic_requirement?: string | null
  eligibility_note?: string | null
  is_research_role?: boolean | null
  is_academic_role?: boolean | null
  is_regulated_or_restricted?: boolean | null
  metadata?: unknown
  status?: string | null
  active?: boolean | null
  specialism_id?: string | null
  career_library_stages?: { stage_key?: string; label?: string } | null
  career_library_specialisms?: {
    id?: string
    name?: string
    professional_body?: string | null
    regulated_profession?: boolean
    career_library_fields?: { name?: string } | null
  } | null
}

const ROLE_SELECT = `
  id,
  name,
  description,
  role_category,
  seniority_level,
  minimum_experience_years,
  experience_requirement_label,
  professional_registration_requirement,
  professional_membership_requirement,
  academic_requirement,
  eligibility_note,
  is_research_role,
  is_academic_role,
  is_regulated_or_restricted,
  metadata,
  status,
  active,
  specialism_id,
  career_library_stages ( stage_key, label ),
  career_library_specialisms (
    id,
    name,
    professional_body,
    regulated_profession,
    career_library_fields ( name )
  )
`

async function fetchRoleRow(
  supabase: SupabaseClient,
  pathwayId: string
): Promise<RoleJoinRow | null> {
  const { data: role, error } = await supabase
    .from('career_library_roles')
    .select(ROLE_SELECT)
    .eq('id', pathwayId)
    .maybeSingle()

  if (error || !role) return null
  return role as RoleJoinRow
}

function mapRoleToKnowledge(
  supabase: SupabaseClient,
  role: RoleJoinRow,
  pathwayId: string
): Promise<CareerPathwayKnowledge> {
  return buildKnowledgeFromRole(supabase, role, pathwayId)
}

async function buildKnowledgeFromRole(
  supabase: SupabaseClient,
  role: RoleJoinRow,
  pathwayId: string
): Promise<CareerPathwayKnowledge> {
  const specialism = role.career_library_specialisms
  const stage = role.career_library_stages
  const meta = metaRecord(role.metadata)

  const fieldName = specialism?.career_library_fields?.name ?? 'Career field'
  const specialismName = specialism?.name ?? 'Specialism'
  const stageLabel = stage?.label ?? null
  const id = pathwayId

  const aboutItems: string[] = []
  if (role.description?.trim()) aboutItems.push(role.description.trim())
  if (role.eligibility_note?.trim()) aboutItems.push(role.eligibility_note.trim())
  if (role.role_category) aboutItems.push(`Category: ${humaniseEnum(role.role_category)}`)
  if (role.seniority_level) aboutItems.push(`Seniority: ${humaniseEnum(role.seniority_level)}`)

  const qualItems: string[] = []
  const academic = humaniseEnum(role.academic_requirement)
  if (academic) qualItems.push(`Academic requirement: ${academic}`)
  if (role.experience_requirement_label?.trim()) {
    qualItems.push(role.experience_requirement_label.trim())
  } else if (typeof role.minimum_experience_years === 'number' && role.minimum_experience_years > 0) {
    qualItems.push(`Typically ${role.minimum_experience_years}+ years of relevant experience`)
  }

  const regItems: string[] = []
  const regReq = humaniseEnum(role.professional_registration_requirement)
  if (regReq) regItems.push(`Registration: ${regReq}`)
  const memReq = humaniseEnum(role.professional_membership_requirement)
  if (memReq) regItems.push(`Membership: ${memReq}`)
  if (specialism?.professional_body) {
    regItems.push(`Professional body: ${specialism.professional_body}`)
  }
  if (specialism?.regulated_profession || role.is_regulated_or_restricted) {
    regItems.push('This pathway may be regulated or restricted in the UK')
  }

  const licenceItems = asStringArray(meta.licences ?? meta.useful_licences)
  const skillItems = asStringArray(meta.required_skills ?? meta.skills)
  const coreSkillItems = asStringArray(meta.core_skills ?? meta.professional_skills)
  const technicalSkillItems = asStringArray(meta.technical_skills)
  const transferItems = asStringArray(meta.transferable_skills)
  const employerItems = asStringArray(meta.typical_employers ?? meta.employers)
  const responsibilityItems = asStringArray(
    meta.responsibilities ?? meta.typical_responsibilities
  )
  const salaryItems = asStringArray(meta.salary ?? meta.typical_uk_salary ?? meta.salary_band)
  const progressionItems = asStringArray(meta.career_progression ?? meta.progression)

  // Prefer grouped skills in required_skills block (core + technical + listed)
  const mergedSkills = [
    ...coreSkillItems.map((s) => `Core: ${s}`),
    ...technicalSkillItems.map((s) => `Technical: ${s}`),
    ...skillItems,
  ]

  let courses: Array<{ title: string; provider: string | null; url: string | null }> = []
  try {
    let learningQuery = supabase
      .from('career_library_learning_options')
      .select('title, provider, url, option_type, status, active')
      .eq('active', true)
      .limit(8)
    if (specialism?.id) {
      learningQuery = learningQuery.or(`role_id.eq.${id},specialism_id.eq.${specialism.id}`)
    } else {
      learningQuery = learningQuery.eq('role_id', id)
    }
    const { data: learning } = await learningQuery
    const wieCtx = {
      educationField: fieldName,
      specialism: specialismName,
      stageKey: stage?.stage_key ?? null,
      stageLabel,
    }
    courses = (learning ?? [])
      .filter((row) => row.title)
      .map((row) => ({
        title: String(row.title),
        provider: row.provider ? String(row.provider) : null,
        url: row.url ? String(row.url) : null,
      }))
      // Drop practical job-entry contamination titles from WIE pathway learning
      .filter((c) => isTitleSafeForWorkInEducation(c.title, wieCtx))
  } catch {
    courses = []
  }

  let progressionRoles: Array<{
    role_id?: string | null
    title: string
    stage_label?: string | null
    seniority?: string | null
  }> = []
  if (specialism?.id) {
    const { data: siblings } = await supabase
      .from('career_library_roles')
      .select('id, name, seniority_level, priority, career_library_stages ( label )')
      .eq('specialism_id', specialism.id)
      .eq('active', true)
      .neq('id', id)
      .order('priority', { ascending: false })
      .limit(6)

    progressionRoles = (siblings ?? []).map((s) => {
      const st = s.career_library_stages as { label?: string } | null
      return {
        role_id: String(s.id),
        title: String(s.name),
        stage_label: st?.label ?? null,
        seniority: humaniseEnum(s.seniority_level as string),
      }
    })
  }

  const hasLibraryBody =
    aboutItems.length > 0 ||
    qualItems.length > 0 ||
    regItems.length > 0 ||
    licenceItems.length > 0 ||
    mergedSkills.length > 0 ||
    courses.length > 0 ||
    progressionRoles.length > 0

  return {
    pathway_id: id,
    role_title: String(role.name),
    field_name: fieldName,
    specialism_name: specialismName,
    stage_label: stageLabel,
    source: hasLibraryBody
      ? salaryItems.length || responsibilityItems.length
        ? 'career_knowledge_library'
        : 'partial'
      : 'placeholder',
    about: filledBlock('About this role', aboutItems),
    responsibilities:
      responsibilityItems.length > 0
        ? filledBlock('Typical responsibilities', responsibilityItems)
          : role.description?.trim()
          ? filledBlock('Typical responsibilities', [])
          : placeholderBlock(
              'Typical responsibilities',
              ''
            ),
    salary:
      salaryItems.length > 0
        ? filledBlock('Typical UK salary', salaryItems)
        : placeholderBlock(
            'Typical UK salary',
            'Salary information has not yet been added.'
          ),
    career_progression:
      progressionItems.length > 0
        ? filledBlock('Career progression', progressionItems)
        : stageLabel
          ? filledBlock(
              'Career progression',
              [
                `Current library stage: ${stageLabel}`,
                role.seniority_level
                  ? `Seniority band: ${humaniseEnum(role.seniority_level)}`
                  : 'Further progression steps will be published in the library.',
              ].filter(Boolean) as string[]
            )
          : placeholderBlock(
              'Career progression',
              'Progression guidance will appear once stage pathways are linked in the library.'
            ),
    required_qualifications: filledBlock('Required qualifications', qualItems),
    professional_registrations: filledBlock('Professional registrations', regItems),
    useful_licences: filledBlock('Useful licences', licenceItems),
    recommended_courses: {
      label: 'Recommended courses',
      items: courses,
      is_placeholder: courses.length === 0,
    },
    required_skills: filledBlock('Required skills', mergedSkills),
    transferable_skills: filledBlock('Transferable skills', transferItems),
    typical_employers: filledBlock('Typical employers', employerItems),
    next_progression_roles: {
      label: 'Next progression roles',
      items: progressionRoles,
      is_placeholder: progressionRoles.length === 0,
    },
    library_note: role.eligibility_note?.trim() || null,
  }
}

export function createSupabasePathwayKnowledgeAdapter(
  supabase: SupabaseClient
): CareerPathwayKnowledgeAdapter {
  return {
    async getPathwayKnowledge(pathwayId: string): Promise<CareerPathwayKnowledge> {
      return loadPathwayKnowledgeFromLibrary(supabase, pathwayId)
    },
  }
}

export async function loadPathwayKnowledgeFromLibrary(
  supabase: SupabaseClient,
  pathwayId: string
): Promise<CareerPathwayKnowledge> {
  const id = pathwayId?.trim()
  if (!id) {
    return emptyPathwayKnowledge('unknown', {
      role_title: 'Role',
      field_name: '',
      specialism_name: '',
    })
  }

  const role = await fetchRoleRow(supabase, id)
  if (!role) {
    return emptyPathwayKnowledge(id, {
      role_title: 'Role',
      field_name: 'Career field',
      specialism_name: 'Specialism',
    })
  }

  return mapRoleToKnowledge(supabase, role, id)
}

/**
 * Batch 7 — full pathway detail (found/not-found + role + knowledge).
 * Match context is optional and never invents eligibility.
 */
export async function loadPathwayDetailFromLibrary(
  supabase: SupabaseClient,
  pathwayId: string,
  opts?: {
    matchContext?: PathwayMatchContextPayload | null
    matchContextSource?: 'assessment_session' | 'query' | 'none'
  }
): Promise<PathwayDetailResponse> {
  const id = pathwayId?.trim()
  if (!id || id.length > 80) {
    return buildPathwayDetailResponse({
      found: false,
      role: null,
      knowledge: null,
      matchContext: null,
      matchContextSource: 'none',
      error_code: 'invalid_id',
    })
  }

  const role = await fetchRoleRow(supabase, id)
  if (!role) {
    return buildPathwayDetailResponse({
      found: false,
      role: null,
      knowledge: null,
      matchContext: null,
      matchContextSource: opts?.matchContextSource ?? 'none',
      error_code: 'not_found',
    })
  }

  const knowledge = await buildKnowledgeFromRole(supabase, role, id)
  const specialism = role.career_library_specialisms
  const stage = role.career_library_stages

  const detailRole = roleRowToDetailRole({
    id: role.id,
    name: String(role.name),
    role_category: role.role_category,
    seniority_level: role.seniority_level,
    minimum_experience_years: role.minimum_experience_years,
    experience_requirement_label: role.experience_requirement_label,
    professional_registration_requirement: role.professional_registration_requirement,
    professional_membership_requirement: role.professional_membership_requirement,
    academic_requirement: role.academic_requirement,
    is_regulated_or_restricted:
      role.is_regulated_or_restricted || specialism?.regulated_profession || false,
    is_academic_role: role.is_academic_role,
    is_research_role: role.is_research_role,
    status: role.status,
    active: role.active,
    field_name: specialism?.career_library_fields?.name ?? knowledge.field_name,
    specialism_name: specialism?.name ?? knowledge.specialism_name,
    stage_label: stage?.label ?? knowledge.stage_label,
  })

  return buildPathwayDetailResponse({
    found: true,
    role: detailRole,
    knowledge,
    matchContext: opts?.matchContext ?? null,
    matchContextSource: opts?.matchContextSource ?? (opts?.matchContext ? 'query' : 'none'),
  })
}

/** Client-side fetch adapter hitting the public pathway API. */
export function createHttpPathwayKnowledgeAdapter(
  apiPath = '/api/career-assistant/work-in-my-education/pathway'
): CareerPathwayKnowledgeAdapter {
  return {
    async getPathwayKnowledge(pathwayId: string) {
      const res = await fetch(`${apiPath}?id=${encodeURIComponent(pathwayId)}`)
      const data = await res.json()
      if (!res.ok || !data.pathway) {
        return emptyPathwayKnowledge(pathwayId, {
          role_title: 'Role',
          field_name: '',
          specialism_name: '',
        })
      }
      return data.pathway as CareerPathwayKnowledge
    },
  }
}

/** Client fetch for Batch 7 detail page (no Supabase). */
export async function fetchPathwayDetail(
  roleId: string,
  apiPath = '/api/career-assistant/work-in-my-education/pathway'
): Promise<PathwayDetailResponse> {
  const res = await fetch(`${apiPath}?id=${encodeURIComponent(roleId)}&detail=1`)
  const data = await res.json()
  if (res.status === 404 || data?.detail?.found === false) {
    return (
      data.detail ??
      buildPathwayDetailResponse({
        found: false,
        role: null,
        knowledge: null,
        matchContext: null,
        matchContextSource: 'none',
        error_code: 'not_found',
      })
    )
  }
  if (!res.ok || !data.detail) {
    return buildPathwayDetailResponse({
      found: false,
      role: null,
      knowledge: null,
      matchContext: null,
      matchContextSource: 'none',
      error_code: res.status === 503 ? 'unavailable' : 'not_found',
    })
  }
  return data.detail as PathwayDetailResponse
}
