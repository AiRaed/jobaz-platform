/**
 * Shared helpers for Hospitality, Tourism & Events Career Knowledge Library.
 * Stage model: hospitality_tourism_events_route
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

export type HteStageKey =
  | 'foundation_operational_support'
  | 'trainee_vocational_entry'
  | 'graduate_management_entry'
  | 'supervisor_coordinator'
  | 'professional_practitioner_manager'
  | 'experienced_specialist_senior_manager'
  | 'head_multisite_leadership'
  | 'director_general_management'
  | 'executive_ownership_consultancy'
  | 'academic_research'

export const HTE_STAGE_KEYS: HteStageKey[] = [
  'foundation_operational_support',
  'trainee_vocational_entry',
  'graduate_management_entry',
  'supervisor_coordinator',
  'professional_practitioner_manager',
  'experienced_specialist_senior_manager',
  'head_multisite_leadership',
  'director_general_management',
  'executive_ownership_consultancy',
  'academic_research',
]

export const FIELD_SLUG = 'hospitality-tourism-events'
export const MODEL_KEY = 'hospitality_tourism_events_route'

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
  ownershipRoute?: boolean
  consultancyRoute?: boolean
  licences?: Array<{ name: string; level: LicenceLevel; note?: string }>
}

export type RoleSeed = {
  name: string
  description: string
  stageKey: HteStageKey
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
  HteStageKey,
  {
    seniorityLevel: CareerLibrarySeniorityLevel
    minimumExperienceYears: number
    experienceRequirementLabel: string
    fitClassification: CareerLibraryFitClassification
    academicRequirement: CareerLibraryAcademicRequirement
  }
> = {
  foundation_operational_support: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'School-leaver or first operational support; degree not required — limited Work in My Education context',
    fitClassification: 'immediate',
    academicRequirement: 'none',
  },
  trainee_vocational_entry: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'College, apprenticeship or vocational trainee route; practical training expected',
    fitClassification: 'immediate',
    academicRequirement: 'none',
  },
  graduate_management_entry: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'Relevant hospitality/tourism/events degree commonly expected for graduate schemes; appointment competitive',
    fitClassification: 'immediate',
    academicRequirement: 'degree_relevant',
  },
  supervisor_coordinator: {
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel:
      'Typically 1–3 years with supervisory or coordination responsibility',
    fitClassification: 'realistic_next',
    academicRequirement: 'degree_relevant',
  },
  professional_practitioner_manager: {
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel:
      'Typically 3+ years with proven operational or events delivery experience — degree alone is not enough',
    fitClassification: 'realistic_next',
    academicRequirement: 'degree_relevant',
  },
  experienced_specialist_senior_manager: {
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel:
      'Typically 5+ years with independent commercial/programme ownership; Master’s may help niches',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  head_multisite_leadership: {
    seniorityLevel: 'principal',
    minimumExperienceYears: 8,
    experienceRequirementLabel:
      'Substantial management experience including multi-site or function leadership',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  director_general_management: {
    seniorityLevel: 'leadership',
    minimumExperienceYears: 10,
    experienceRequirementLabel:
      'Extensive management experience; GM/director — future progression only',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  executive_ownership_consultancy: {
    seniorityLevel: 'leadership',
    minimumExperienceYears: 12,
    experienceRequirementLabel:
      'Executive, consultancy or ownership — not automatic employment progression',
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
  stageKey: HteStageKey,
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
    stageKey === 'executive_ownership_consultancy' ||
    stageKey === 'director_general_management' ||
    stageKey === 'head_multisite_leadership'
  ) {
    defaultCategory = 'leadership'
  } else if (stageKey === 'experienced_specialist_senior_manager') {
    defaultCategory = 'technical_specialist'
  } else if (
    stageKey === 'foundation_operational_support' ||
    stageKey === 'trainee_vocational_entry' ||
    stageKey === 'graduate_management_entry'
  ) {
    defaultCategory = 'graduate_entry'
  } else if (/revenue|analyst|analytics|commercial/i.test(name)) {
    defaultCategory = 'technical_specialist'
  } else if (/event|project|coordinator/i.test(name)) {
    defaultCategory = 'project_management'
  } else if (/consultant/i.test(name)) {
    defaultCategory = 'consultancy'
  } else if (/site|front office|kitchen|housekeeping|operations assistant/i.test(name)) {
    defaultCategory = 'site_delivery'
  }

  const lowBarrier = opts.meta?.lowBarrierOperational ?? stageKey === 'foundation_operational_support'

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
      vocationalRoute: stageKey === 'trainee_vocational_entry',
      apprenticeshipRoute: stageKey === 'trainee_vocational_entry',
      workInMyEducationPriority: lowBarrier ? 'limited_context' : 'primary',
      lowBarrierOperational: lowBarrier,
      ownershipRoute: false,
      consultancyRoute: false,
      licences: [],
      ...opts.meta,
    },
  }
}

const STAGES_DEF: Array<{
  stage_key: HteStageKey
  label: string
  description: string
  sort_order: number
}> = [
  {
    stage_key: 'foundation_operational_support',
    label: 'Foundation / Operational Support',
    description: 'Limited operational support context.',
    sort_order: 10,
  },
  {
    stage_key: 'trainee_vocational_entry',
    label: 'Trainee / Vocational Entry',
    description: 'Apprenticeship and vocational trainee routes.',
    sort_order: 20,
  },
  {
    stage_key: 'graduate_management_entry',
    label: 'Graduate / Management Entry',
    description: 'Graduate management schemes and first management-track roles.',
    sort_order: 30,
  },
  {
    stage_key: 'supervisor_coordinator',
    label: 'Supervisor / Coordinator',
    description: 'Supervisors and coordinators.',
    sort_order: 40,
  },
  {
    stage_key: 'professional_practitioner_manager',
    label: 'Professional Practitioner / Manager',
    description: 'Professional managers.',
    sort_order: 50,
  },
  {
    stage_key: 'experienced_specialist_senior_manager',
    label: 'Experienced Specialist / Senior Manager',
    description: 'Senior managers and specialists.',
    sort_order: 60,
  },
  {
    stage_key: 'head_multisite_leadership',
    label: 'Head / Multi-site Leadership',
    description: 'Heads and multi-site leadership.',
    sort_order: 70,
  },
  {
    stage_key: 'director_general_management',
    label: 'Director / General Management',
    description: 'Directors and general managers.',
    sort_order: 80,
  },
  {
    stage_key: 'executive_ownership_consultancy',
    label: 'Executive / Ownership / Consultancy',
    description: 'Executives, consultants and ownership routes.',
    sort_order: 90,
  },
  {
    stage_key: 'academic_research',
    label: 'Academic / Research',
    description: 'Academic and research careers.',
    sort_order: 100,
  },
]

export async function ensureHteStageModel(supabase: SupabaseClient): Promise<{
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
        name: 'Hospitality, tourism & events route',
        description:
          'UK hospitality, tourism and events progression. Master\'s/PhD are not automatic seniority. Low-barrier ops limited for Work in My Education.',
        active: true,
        is_system: true,
        sort_order: 180,
      })
      .eq('id', modelId)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_stage_models')
      .insert({
        model_key: MODEL_KEY,
        name: 'Hospitality, tourism & events route',
        description:
          'UK hospitality, tourism and events progression by experience and responsibility.',
        active: true,
        sort_order: 180,
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
  for (const key of HTE_STAGE_KEYS) {
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
        hte_stage: stage.stage_key,
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
        ownership_route: meta.ownershipRoute ?? false,
        consultancy_route: meta.consultancyRoute ?? false,
        licences: meta.licences ?? [],
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

export async function populateHtePack(
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

  const byStage = new Map<HteStageKey, RoleSeed[]>()
  for (const key of HTE_STAGE_KEYS) byStage.set(key, [])
  for (const role of pack.roles) byStage.get(role.stageKey)!.push(role)

  const stageResults: Record<
    string,
    { created: string[]; skipped: string[]; crossSkipped: string[] }
  > = {}

  for (const key of HTE_STAGE_KEYS) {
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

export async function runHtePopulate(packs: SpecialismPack[], title: string) {
  const supabase = createServiceClient()
  const { modelId, stageByKey } = await ensureHteStageModel(supabase)

  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id, slug')
    .eq('slug', FIELD_SLUG)
    .maybeSingle()

  if (!field?.id) {
    throw new Error('Hospitality, Tourism & Events field not found. Run seed script first.')
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
  const perSpec: Record<string, number> = {}

  console.log(`\n=== ${title} ===`)
  console.log(`Stage model: ${MODEL_KEY} (${modelId}) | draft | active\n`)

  for (const pack of packs) {
    const result = await populateHtePack(
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
    for (const key of HTE_STAGE_KEYS) {
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
    perSpec[pack.slug] = created
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
  return { totalCreated, totalSameSkipped, totalCrossSkipped, perSpec }
}
