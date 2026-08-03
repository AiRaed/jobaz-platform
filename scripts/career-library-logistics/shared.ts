/**
 * Shared helpers for Logistics, Supply Chain & Transport Management.
 * Stage model: logistics_supply_chain_transport_management_route
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { normalizeSlug } from '../../lib/admin/career-library/guards'
import type {
  CareerLibraryAcademicRequirement,
  CareerLibraryFitClassification,
  CareerLibraryRegistrationRequirement,
  CareerLibraryRoleCategory,
  CareerLibrarySeniorityLevel,
} from '../../lib/admin/career-library/types'

export type LsctStageKey =
  | 'foundation_logistics_support'
  | 'apprentice_technical_entry'
  | 'graduate_management_entry'
  | 'professional_practitioner'
  | 'experienced_specialist'
  | 'senior_manager'
  | 'head_logistics_supply_chain'
  | 'director_executive'
  | 'academic_research'

export const LSCT_STAGE_KEYS: LsctStageKey[] = [
  'foundation_logistics_support',
  'apprentice_technical_entry',
  'graduate_management_entry',
  'professional_practitioner',
  'experienced_specialist',
  'senior_manager',
  'head_logistics_supply_chain',
  'director_executive',
  'academic_research',
]

export const FIELD_SLUG = 'logistics-supply-chain-transport-management'
export const MODEL_KEY = 'logistics_supply_chain_transport_management_route'

export type MastersExpectation =
  | 'optional'
  | 'desirable'
  | 'commonly_expected'
  | 'required'

export type LicenceLevel =
  | 'not_applicable'
  | 'useful'
  | 'strongly_recommended'
  | 'employer_commonly_expects'
  | 'legally_required_context'

export type RoleMeta = {
  mastersExpectation?: MastersExpectation
  domainTag?: string
  vocationalRoute?: boolean
  apprenticeshipRoute?: boolean
  workInMyEducationPriority?: 'primary' | 'secondary' | 'limited_context'
  lowBarrierOperational?: boolean
  licences?: Array<{ name: string; level: LicenceLevel; note?: string }>
  professionalQualification?: string | null
}

export type RoleSeed = {
  name: string
  description: string
  stageKey: LsctStageKey
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
  meta?: RoleMeta
}

export type SpecialismPack = {
  slug: string
  label: string
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  siblingSlugs: string[]
  domainTag: string
  roles: RoleSeed[]
}

const STAGE_DEFAULTS: Record<
  LsctStageKey,
  {
    seniorityLevel: CareerLibrarySeniorityLevel
    minimumExperienceYears: number
    experienceRequirementLabel: string
    fitClassification: CareerLibraryFitClassification
    academicRequirement: CareerLibraryAcademicRequirement
  }
> = {
  foundation_logistics_support: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'School-leaver or first logistics support; degree not required — limited Work in My Education context',
    fitClassification: 'immediate',
    academicRequirement: 'none',
  },
  apprentice_technical_entry: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'Apprenticeship or college/technical trainee route; practical training expected',
    fitClassification: 'immediate',
    academicRequirement: 'none',
  },
  graduate_management_entry: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'Relevant logistics/supply-chain/business degree commonly expected for graduate schemes',
    fitClassification: 'immediate',
    academicRequirement: 'degree_relevant',
  },
  professional_practitioner: {
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel:
      'Typically 2–4 years in planning, procurement, warehouse coordination or transport ops',
    fitClassification: 'realistic_next',
    academicRequirement: 'degree_relevant',
  },
  experienced_specialist: {
    seniorityLevel: 'senior',
    minimumExperienceYears: 4,
    experienceRequirementLabel:
      'Typically 4+ years with independent workstream ownership; Master’s may help analytics/strategy',
    fitClassification: 'realistic_next',
    academicRequirement: 'degree_relevant',
  },
  senior_manager: {
    seniorityLevel: 'senior',
    minimumExperienceYears: 6,
    experienceRequirementLabel:
      'Typically 6+ years with people/process leadership — experience required beyond qualification',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  head_logistics_supply_chain: {
    seniorityLevel: 'principal',
    minimumExperienceYears: 8,
    experienceRequirementLabel:
      'Substantial management experience leading logistics, supply chain or procurement functions',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  director_executive: {
    seniorityLevel: 'leadership',
    minimumExperienceYears: 10,
    experienceRequirementLabel:
      'Director / CSCO pathway — extensive leadership; future progression only',
    fitClassification: 'future_progression',
    academicRequirement: 'masters_relevant',
  },
  academic_research: {
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'Doctorate typically required for academic tracks; research experience expected',
    fitClassification: 'academic_or_research',
    academicRequirement: 'phd_relevant',
  },
}

export function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

export function createServiceClient(): SupabaseClient {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function r(
  name: string,
  stageKey: LsctStageKey,
  description: string,
  opts: {
    roleCategory?: CareerLibraryRoleCategory
    priority: number
    eligibilityNote: string
    seniorityLevel?: CareerLibrarySeniorityLevel
    minimumExperienceYears?: number
    experienceRequirementLabel?: string
    fitClassification?: CareerLibraryFitClassification
    academicRequirement?: CareerLibraryAcademicRequirement
    professionalRegistrationRequirement?: CareerLibraryRegistrationRequirement
    professionalMembershipRequirement?: CareerLibraryRegistrationRequirement
    isResearchRole?: boolean
    isAcademicRole?: boolean
    isRegulatedOrRestricted?: boolean
    meta?: RoleMeta
  }
): RoleSeed {
  const d = STAGE_DEFAULTS[stageKey]
  const isResearch = opts.isResearchRole ?? stageKey === 'academic_research'
  const isAcademic =
    opts.isAcademicRole ??
    (stageKey === 'academic_research' && /lecturer|professor|reader/i.test(name))

  let defaultCategory: CareerLibraryRoleCategory = 'professional_practice'
  if (stageKey === 'academic_research') {
    defaultCategory = isAcademic ? 'academic' : 'research'
  } else if (
    stageKey === 'director_executive' ||
    stageKey === 'head_logistics_supply_chain' ||
    stageKey === 'senior_manager'
  ) {
    defaultCategory = 'leadership'
  } else if (stageKey === 'experienced_specialist') {
    defaultCategory = 'technical_specialist'
  } else if (
    stageKey === 'foundation_logistics_support' ||
    stageKey === 'apprentice_technical_entry' ||
    stageKey === 'graduate_management_entry'
  ) {
    defaultCategory = 'graduate_entry'
  } else if (/analyst|planner|analytics|or\b|operations research/i.test(name)) {
    defaultCategory = 'technical_specialist'
  } else if (/warehouse|fleet|port|airport|site/i.test(name)) {
    defaultCategory = 'site_delivery'
  }

  const lowBarrier =
    opts.meta?.lowBarrierOperational ?? stageKey === 'foundation_logistics_support'

  return {
    name,
    description,
    stageKey,
    roleCategory: opts.roleCategory ?? defaultCategory,
    seniorityLevel: opts.seniorityLevel ?? d.seniorityLevel,
    minimumExperienceYears: opts.minimumExperienceYears ?? d.minimumExperienceYears,
    experienceRequirementLabel: opts.experienceRequirementLabel ?? d.experienceRequirementLabel,
    professionalRegistrationRequirement: opts.professionalRegistrationRequirement ?? 'none',
    professionalMembershipRequirement: opts.professionalMembershipRequirement ?? 'desirable',
    academicRequirement: opts.academicRequirement ?? d.academicRequirement,
    isResearchRole: isResearch,
    isAcademicRole: isAcademic,
    isRegulatedOrRestricted: opts.isRegulatedOrRestricted ?? false,
    eligibilityNote: opts.eligibilityNote,
    fitClassification: opts.fitClassification ?? d.fitClassification,
    priority: opts.priority,
    meta: {
      mastersExpectation: 'optional',
      vocationalRoute: stageKey === 'apprentice_technical_entry',
      apprenticeshipRoute: stageKey === 'apprentice_technical_entry',
      workInMyEducationPriority: lowBarrier ? 'limited_context' : 'primary',
      lowBarrierOperational: lowBarrier,
      licences: [],
      professionalQualification: null,
      ...opts.meta,
    },
  }
}

const STAGES_DEF: Array<{
  stage_key: LsctStageKey
  label: string
  description: string
  sort_order: number
}> = [
  {
    stage_key: 'foundation_logistics_support',
    label: 'Foundation / Logistics Support',
    description: 'Limited logistics support context.',
    sort_order: 10,
  },
  {
    stage_key: 'apprentice_technical_entry',
    label: 'Apprentice / Technical Entry',
    description: 'Apprenticeship and technical trainee routes.',
    sort_order: 20,
  },
  {
    stage_key: 'graduate_management_entry',
    label: 'Graduate / Management Entry',
    description: 'Graduate schemes and first analyst/planner roles.',
    sort_order: 30,
  },
  {
    stage_key: 'professional_practitioner',
    label: 'Professional Practitioner',
    description: 'Competent logistics and supply-chain practitioners.',
    sort_order: 40,
  },
  {
    stage_key: 'experienced_specialist',
    label: 'Experienced Specialist',
    description: 'Experienced specialists.',
    sort_order: 50,
  },
  {
    stage_key: 'senior_manager',
    label: 'Senior Manager',
    description: 'Senior managers.',
    sort_order: 60,
  },
  {
    stage_key: 'head_logistics_supply_chain',
    label: 'Head of Logistics / Supply Chain',
    description: 'Heads of function.',
    sort_order: 70,
  },
  {
    stage_key: 'director_executive',
    label: 'Director / Executive',
    description: 'Directors and executives.',
    sort_order: 80,
  },
  {
    stage_key: 'academic_research',
    label: 'Academic / Research',
    description: 'Academic and research careers.',
    sort_order: 90,
  },
]

export async function ensureLsctStageModel(supabase: SupabaseClient): Promise<{
  modelId: string
  stageByKey: Map<string, { id: string; stage_key: string; label: string }>
}> {
  let modelId: string
  const { data: existing } = await supabase
    .from('career_library_stage_models')
    .select('id')
    .eq('model_key', MODEL_KEY)
    .maybeSingle()

  if (existing?.id) {
    modelId = existing.id
    await supabase
      .from('career_library_stage_models')
      .update({
        name: 'Logistics, supply chain & transport management route',
        description:
          'UK logistics and supply-chain management progression. Master\'s/PhD are not automatic seniority. Driver/operative roles limited for Work in My Education.',
        active: true,
        is_system: true,
        sort_order: 190,
      })
      .eq('id', modelId)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_stage_models')
      .insert({
        model_key: MODEL_KEY,
        name: 'Logistics, supply chain & transport management route',
        description:
          'UK logistics, supply chain and transport management progression by experience and responsibility.',
        active: true,
        sort_order: 190,
        is_system: true,
      })
      .select('id')
      .single()
    if (error || !created) {
      throw new Error(`Failed to create ${MODEL_KEY}: ${error?.message ?? 'unknown'}`)
    }
    modelId = created.id
  }

  for (const s of STAGES_DEF) {
    const { data: stageRow } = await supabase
      .from('career_library_stages')
      .select('id')
      .eq('stage_model_id', modelId)
      .eq('stage_key', s.stage_key)
      .maybeSingle()

    if (stageRow?.id) {
      await supabase
        .from('career_library_stages')
        .update({
          label: s.label,
          description: s.description,
          sort_order: s.sort_order,
          active: true,
        })
        .eq('id', stageRow.id)
    } else {
      const { error } = await supabase.from('career_library_stages').insert({
        stage_model_id: modelId,
        stage_key: s.stage_key,
        label: s.label,
        description: s.description,
        sort_order: s.sort_order,
        active: true,
      })
      if (error && error.code !== '23505') {
        throw new Error(`Failed to create stage ${s.stage_key}: ${error.message}`)
      }
    }
  }

  const { data: stages, error: stagesErr } = await supabase
    .from('career_library_stages')
    .select('id, stage_key, label, sort_order')
    .eq('stage_model_id', modelId)
    .order('sort_order', { ascending: true })

  if (stagesErr || !stages?.length) {
    throw new Error(`${MODEL_KEY} stages missing: ${stagesErr?.message ?? 'empty'}`)
  }

  const stageByKey = new Map(stages.map((s) => [s.stage_key, s]))
  for (const key of LSCT_STAGE_KEYS) {
    if (!stageByKey.has(key)) throw new Error(`Missing stage: ${key}`)
  }
  return { modelId, stageByKey }
}

async function insertRolesForStage(
  supabase: SupabaseClient,
  pack: SpecialismPack,
  specialismId: string,
  stage: { id: string; stage_key: string; label: string },
  roles: RoleSeed[],
  existingSlugs: Set<string>,
  reservedNames: Set<string>
): Promise<{ created: string[]; skipped: string[]; crossSkipped: string[] }> {
  const created: string[] = []
  const skipped: string[] = []
  const crossSkipped: string[] = []

  for (const seed of roles) {
    const nameKey = seed.name.trim().toLowerCase()
    const baseSlug = normalizeSlug(undefined, seed.name)
    if (!baseSlug) {
      skipped.push(seed.name)
      continue
    }
    const slug = `${stage.stage_key}-${baseSlug}`

    if (existingSlugs.has(slug)) {
      skipped.push(seed.name)
      continue
    }
    if (reservedNames.has(nameKey)) {
      crossSkipped.push(seed.name)
      continue
    }

    const meta = seed.meta ?? {}
    const { error } = await supabase.from('career_library_roles').insert({
      specialism_id: specialismId,
      stage_id: stage.id,
      name: seed.name,
      slug,
      description: seed.description,
      status: 'draft',
      active: true,
      sort_order: seed.priority,
      priority: seed.priority,
      role_category: seed.roleCategory,
      seniority_level: seed.seniorityLevel,
      minimum_experience_years: seed.minimumExperienceYears,
      experience_requirement_label: seed.experienceRequirementLabel,
      professional_registration_requirement: seed.professionalRegistrationRequirement,
      professional_membership_requirement: seed.professionalMembershipRequirement,
      academic_requirement: seed.academicRequirement,
      is_research_role: seed.isResearchRole,
      is_academic_role: seed.isAcademicRole,
      is_regulated_or_restricted: seed.isRegulatedOrRestricted,
      eligibility_note: seed.eligibilityNote,
      fit_classification: seed.fitClassification,
      metadata: {
        stage_id: stage.id,
        stage_key: stage.stage_key,
        stage_label: stage.label,
        lsct_stage: stage.stage_key,
        specialism_slug: pack.slug,
        domain_tag: pack.domainTag,
        country_focus: 'uk',
        professional_body_focus: pack.professionalBody,
        related_bodies: pack.relatedBodies,
        eligibility_model_version: 1,
        progression_model: MODEL_KEY,
        sources: pack.sources,
        masters_expectation: meta.mastersExpectation ?? 'optional',
        vocational_route: meta.vocationalRoute ?? false,
        apprenticeship_route: meta.apprenticeshipRoute ?? false,
        work_in_my_education_priority: meta.workInMyEducationPriority ?? 'primary',
        low_barrier_operational: meta.lowBarrierOperational ?? false,
        licences: meta.licences ?? [],
        professional_qualification: meta.professionalQualification ?? null,
      },
    })

    if (error) {
      if (error.code === '23505') {
        skipped.push(seed.name)
        continue
      }
      throw new Error(`${pack.label}: ${seed.name} [${stage.stage_key}]: ${error.message}`)
    }
    created.push(seed.name)
    existingSlugs.add(slug)
    reservedNames.add(nameKey)
  }
  return { created, skipped, crossSkipped }
}

export async function populateLsctPack(
  supabase: SupabaseClient,
  pack: SpecialismPack,
  stageByKey: Map<string, { id: string; stage_key: string; label: string }>,
  reservedNames: Set<string>,
  fieldId: string
) {
  const { data: specialism, error: specErr } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug, professional_body')
    .eq('slug', pack.slug)
    .eq('field_id', fieldId)
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(`${pack.label} specialism not found: ${specErr?.message ?? 'missing'}`)
  }

  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({ professional_body: pack.professionalBody })
      .eq('id', specialism.id)
  }

  const { data: siblings } = await supabase
    .from('career_library_specialisms')
    .select('id, slug')
    .eq('field_id', fieldId)
    .in('slug', pack.siblingSlugs)

  for (const sib of siblings ?? []) {
    const { data: roles } = await supabase
      .from('career_library_roles')
      .select('name')
      .eq('specialism_id', sib.id)
    for (const row of roles ?? []) reservedNames.add(row.name.trim().toLowerCase())
  }

  const { data: existingRoles, error: rolesErr } = await supabase
    .from('career_library_roles')
    .select('slug, name')
    .eq('specialism_id', specialism.id)

  if (rolesErr) throw new Error(rolesErr.message)
  const existingSlugs = new Set((existingRoles ?? []).map((row) => row.slug))

  const byStage = new Map<LsctStageKey, RoleSeed[]>()
  for (const key of LSCT_STAGE_KEYS) byStage.set(key, [])
  for (const role of pack.roles) byStage.get(role.stageKey)!.push(role)

  const stageResults: Record<
    string,
    { created: string[]; skipped: string[]; crossSkipped: string[] }
  > = {}

  for (const key of LSCT_STAGE_KEYS) {
    stageResults[key] = await insertRolesForStage(
      supabase,
      pack,
      specialism.id,
      stageByKey.get(key)!,
      byStage.get(key) ?? [],
      existingSlugs,
      reservedNames
    )
  }

  const { count } = await supabase
    .from('career_library_roles')
    .select('id', { count: 'exact', head: true })
    .eq('specialism_id', specialism.id)
    .eq('status', 'draft')

  return { specialism, stageResults, draftCount: count ?? 0 }
}

export async function runLsctPopulate(packs: SpecialismPack[], title: string) {
  const supabase = createServiceClient()
  const { modelId, stageByKey } = await ensureLsctStageModel(supabase)

  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id, slug')
    .eq('slug', FIELD_SLUG)
    .maybeSingle()

  if (!field?.id) {
    throw new Error(
      'Logistics, Supply Chain & Transport Management field not found. Run seed script first.'
    )
  }

  const allSeedNames = packs.flatMap((p) => p.roles.map((role) => role.name))
  const seen = new Set<string>()
  const internalDupes: string[] = []
  for (const n of allSeedNames) {
    const k = n.trim().toLowerCase()
    if (seen.has(k)) internalDupes.push(n)
    seen.add(k)
  }
  if (internalDupes.length) {
    throw new Error(`Duplicate titles within seed packs: ${internalDupes.join('; ')}`)
  }

  const packSlugs = new Set(packs.map((p) => p.slug))
  const { data: allSpecs } = await supabase
    .from('career_library_specialisms')
    .select('id, slug, field_id')

  const reservedNames = new Set<string>()
  for (const sib of allSpecs ?? []) {
    if (sib.field_id === field.id && packSlugs.has(sib.slug)) continue
    const { data: roles } = await supabase
      .from('career_library_roles')
      .select('name')
      .eq('specialism_id', sib.id)
    for (const role of roles ?? []) reservedNames.add(role.name.trim().toLowerCase())
  }

  let totalCreated = 0
  let totalSameSkipped = 0
  let totalCrossSkipped = 0

  console.log(`\n=== ${title} ===`)
  console.log(`Stage model: ${MODEL_KEY} (${modelId}) | draft | active\n`)

  for (const pack of packs) {
    const result = await populateLsctPack(
      supabase,
      pack,
      stageByKey,
      reservedNames,
      field.id
    )
    let created = 0
    let sameSkipped = 0
    let crossSkipped = 0
    console.log(`--- ${result.specialism.name} (${result.specialism.slug}) ---`)
    for (const key of LSCT_STAGE_KEYS) {
      const sr = result.stageResults[key]
      created += sr.created.length
      sameSkipped += sr.skipped.length
      crossSkipped += sr.crossSkipped.length
      if (sr.created.length || sr.crossSkipped.length) {
        console.log(`${key}: +${sr.created.length}`)
        for (const n of sr.created) console.log(`  + ${n}`)
        for (const n of sr.crossSkipped) console.log(`  - conflict: ${n}`)
      }
    }
    totalCreated += created
    totalSameSkipped += sameSkipped
    totalCrossSkipped += crossSkipped
    console.log(
      `Created: ${created} | Draft total: ${result.draftCount} | same-skip: ${sameSkipped} | cross-skip: ${crossSkipped}\n`
    )
  }

  console.log('=== Combined totals ===')
  console.log(`Total roles created: ${totalCreated}`)
  console.log(`Duplicates skipped (same specialism): ${totalSameSkipped}`)
  console.log(`Duplicates skipped (cross-specialism / prior field): ${totalCrossSkipped}`)
  return { totalCreated, totalSameSkipped, totalCrossSkipped }
}
