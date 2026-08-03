/**
 * Shared helpers for Natural Sciences & Research Career Knowledge Library.
 * Stage model: natural_sciences_research
 * Does NOT use Engineering, IT, or Healthcare stage models.
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

export type NaturalSciencesStageKey =
  | 'foundation_technical_entry'
  | 'graduate_entry'
  | 'scientific_practitioner'
  | 'experienced_scientist'
  | 'specialist_scientist'
  | 'senior_principal_scientist'
  | 'research_lab_leadership'
  | 'academic_research'
  | 'executive_scientific_director'

export const NATURAL_SCIENCES_STAGE_KEYS: NaturalSciencesStageKey[] = [
  'foundation_technical_entry',
  'graduate_entry',
  'scientific_practitioner',
  'experienced_scientist',
  'specialist_scientist',
  'senior_principal_scientist',
  'research_lab_leadership',
  'academic_research',
  'executive_scientific_director',
]

export type RoleSeed = {
  name: string
  description: string
  stageKey: NaturalSciencesStageKey
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
}

export type SpecialismPack = {
  slug: string
  label: string
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  siblingSlugs: string[]
  roles: RoleSeed[]
}

const STAGE_DEFAULTS: Record<
  NaturalSciencesStageKey,
  {
    seniorityLevel: CareerLibrarySeniorityLevel
    minimumExperienceYears: number
    experienceRequirementLabel: string
    fitClassification: CareerLibraryFitClassification
    academicRequirement: CareerLibraryAcademicRequirement
    professionalRegistrationRequirement: CareerLibraryRegistrationRequirement
  }
> = {
  foundation_technical_entry: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'Apprenticeship, college, HNC/HND or equivalent technical training; degree not required',
    fitClassification: 'immediate',
    academicRequirement: 'none',
    professionalRegistrationRequirement: 'none',
  },
  graduate_entry: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Relevant Bachelor’s degree typically expected; Master’s optional',
    fitClassification: 'immediate',
    academicRequirement: 'degree_relevant',
    professionalRegistrationRequirement: 'none',
  },
  scientific_practitioner: {
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years scientific experience or strong graduate capability',
    fitClassification: 'realistic_next',
    academicRequirement: 'degree_relevant',
    professionalRegistrationRequirement: 'none',
  },
  experienced_scientist: {
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5+ years relevant scientific experience',
    fitClassification: 'realistic_next',
    academicRequirement: 'degree_relevant',
    professionalRegistrationRequirement: 'none',
  },
  specialist_scientist: {
    seniorityLevel: 'senior',
    minimumExperienceYears: 4,
    experienceRequirementLabel:
      'Specialist scientific experience; Master’s commonly useful where specialty requires it',
    fitClassification: 'future_progression',
    academicRequirement: 'masters_relevant',
    professionalRegistrationRequirement: 'desirable',
  },
  senior_principal_scientist: {
    seniorityLevel: 'principal',
    minimumExperienceYears: 7,
    experienceRequirementLabel:
      'Typically 7+ years with technical authority; PhD may help for R&D but is not automatic seniority',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
    professionalRegistrationRequirement: 'desirable',
  },
  research_lab_leadership: {
    seniorityLevel: 'leadership',
    minimumExperienceYears: 8,
    experienceRequirementLabel:
      'Significant laboratory, programme or research leadership experience typically required',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
    professionalRegistrationRequirement: 'desirable',
  },
  academic_research: {
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'Doctorate typically required for postdoc/academic tracks; Master’s may suit some research assistant routes',
    fitClassification: 'academic_or_research',
    academicRequirement: 'phd_relevant',
    professionalRegistrationRequirement: 'none',
  },
  executive_scientific_director: {
    seniorityLevel: 'leadership',
    minimumExperienceYears: 12,
    experienceRequirementLabel: 'Extensive scientific leadership experience; future progression only',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
    professionalRegistrationRequirement: 'desirable',
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
  stageKey: NaturalSciencesStageKey,
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
  }
): RoleSeed {
  const d = STAGE_DEFAULTS[stageKey]
  const isResearch =
    opts.isResearchRole ??
    (stageKey === 'academic_research' || /research|postdoc|doctoral/i.test(name))
  const isAcademic =
    opts.isAcademicRole ??
    (stageKey === 'academic_research' &&
      /lecturer|professor|reader|teaching fellow/i.test(name))
  return {
    name,
    description,
    stageKey,
    roleCategory:
      opts.roleCategory ??
      (stageKey === 'academic_research'
        ? isAcademic
          ? 'academic'
          : 'research'
        : stageKey === 'research_lab_leadership' || stageKey === 'executive_scientific_director'
          ? 'leadership'
          : stageKey === 'foundation_technical_entry' || stageKey === 'graduate_entry'
            ? 'graduate_entry'
            : 'professional_practice'),
    seniorityLevel: opts.seniorityLevel ?? d.seniorityLevel,
    minimumExperienceYears: opts.minimumExperienceYears ?? d.minimumExperienceYears,
    experienceRequirementLabel: opts.experienceRequirementLabel ?? d.experienceRequirementLabel,
    professionalRegistrationRequirement:
      opts.professionalRegistrationRequirement ?? d.professionalRegistrationRequirement,
    professionalMembershipRequirement: opts.professionalMembershipRequirement ?? 'desirable',
    academicRequirement: opts.academicRequirement ?? d.academicRequirement,
    isResearchRole: isResearch,
    isAcademicRole: isAcademic,
    isRegulatedOrRestricted: opts.isRegulatedOrRestricted ?? false,
    eligibilityNote: opts.eligibilityNote,
    fitClassification: opts.fitClassification ?? d.fitClassification,
    priority: opts.priority,
  }
}

const STAGES_DEF: Array<{
  stage_key: NaturalSciencesStageKey
  label: string
  description: string
  sort_order: number
}> = [
  {
    stage_key: 'foundation_technical_entry',
    label: 'Foundation / Technical Entry',
    description:
      'College, apprenticeship, HNC/HND and technician routes into laboratory, field and scientific support work.',
    sort_order: 10,
  },
  {
    stage_key: 'graduate_entry',
    label: 'Graduate Entry',
    description:
      'First professional science roles typically entered with a relevant Bachelor’s degree.',
    sort_order: 20,
  },
  {
    stage_key: 'scientific_practitioner',
    label: 'Scientific Practitioner',
    description: 'Independent delivery of scientific work in laboratory, field or applied settings.',
    sort_order: 30,
  },
  {
    stage_key: 'experienced_scientist',
    label: 'Experienced Scientist',
    description: 'Experienced scientists with sustained delivery ownership.',
    sort_order: 40,
  },
  {
    stage_key: 'specialist_scientist',
    label: 'Specialist Scientist',
    description: 'Domain-specialist scientific roles.',
    sort_order: 50,
  },
  {
    stage_key: 'senior_principal_scientist',
    label: 'Senior / Principal Scientist',
    description: 'Senior and principal scientist roles with technical authority.',
    sort_order: 60,
  },
  {
    stage_key: 'research_lab_leadership',
    label: 'Research Leadership / Laboratory Leadership',
    description: 'Leadership of research groups, laboratories or scientific programmes.',
    sort_order: 70,
  },
  {
    stage_key: 'academic_research',
    label: 'Academic / Research',
    description: 'Doctoral, postdoctoral, fellowship and academic roles.',
    sort_order: 80,
  },
  {
    stage_key: 'executive_scientific_director',
    label: 'Executive / Scientific Director',
    description: 'Scientific directorate and R&D executive leadership.',
    sort_order: 90,
  },
]

export async function ensureNaturalSciencesStageModel(supabase: SupabaseClient): Promise<{
  modelId: string
  stageByKey: Map<string, { id: string; stage_key: string; label: string }>
}> {
  let modelId: string
  const { data: existing } = await supabase
    .from('career_library_stage_models')
    .select('id')
    .eq('model_key', 'natural_sciences_research')
    .maybeSingle()

  if (existing?.id) {
    modelId = existing.id
    await supabase
      .from('career_library_stage_models')
      .update({
        name: 'Natural sciences & research route',
        description:
          'Progression for natural sciences and research careers across technical, graduate, specialist, leadership and academic pathways.',
        active: true,
        is_system: true,
        sort_order: 70,
      })
      .eq('id', modelId)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_stage_models')
      .insert({
        model_key: 'natural_sciences_research',
        name: 'Natural sciences & research route',
        description:
          'Progression for natural sciences and research careers across technical, graduate, specialist, leadership and academic pathways.',
        active: true,
        sort_order: 70,
        is_system: true,
      })
      .select('id')
      .single()
    if (error || !created) {
      throw new Error(`Failed to create natural_sciences_research: ${error?.message ?? 'unknown'}`)
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
    throw new Error(`natural_sciences_research stages missing: ${stagesErr?.message ?? 'empty'}`)
  }

  const stageByKey = new Map(stages.map((s) => [s.stage_key, s]))
  for (const key of NATURAL_SCIENCES_STAGE_KEYS) {
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
    if (reservedNames.has(nameKey)) {
      crossSkipped.push(seed.name)
      continue
    }
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
        natural_sciences_stage: stage.stage_key,
        specialism_slug: pack.slug,
        country_focus: 'uk',
        professional_body_focus: pack.professionalBody,
        related_bodies: pack.relatedBodies,
        eligibility_model_version: 1,
        progression_model: 'natural_sciences_research',
        sources: pack.sources,
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

export async function populateNaturalSciencesPack(
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
  for (const row of existingRoles ?? []) reservedNames.add(row.name.trim().toLowerCase())

  const byStage = new Map<NaturalSciencesStageKey, RoleSeed[]>()
  for (const key of NATURAL_SCIENCES_STAGE_KEYS) byStage.set(key, [])
  for (const role of pack.roles) byStage.get(role.stageKey)!.push(role)

  const stageResults: Record<
    string,
    { created: string[]; skipped: string[]; crossSkipped: string[] }
  > = {}

  for (const key of NATURAL_SCIENCES_STAGE_KEYS) {
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

export async function runNaturalSciencesPopulate(packs: SpecialismPack[], title: string) {
  const supabase = createServiceClient()
  const { modelId, stageByKey } = await ensureNaturalSciencesStageModel(supabase)

  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id, slug')
    .eq('slug', 'natural-sciences-research')
    .maybeSingle()

  if (!field?.id) {
    throw new Error('Natural Sciences & Research field not found. Run seed script first.')
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
  const { data: allSpecs } = await supabase.from('career_library_specialisms').select('id, slug, field_id')
  const reservedNames = new Set<string>()
  for (const sib of allSpecs ?? []) {
    // Reserve titles from other fields + other NS specialisms not in this run
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
  console.log(`Stage model: natural_sciences_research (${modelId}) | draft | active\n`)

  for (const pack of packs) {
    const result = await populateNaturalSciencesPack(
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
    for (const key of NATURAL_SCIENCES_STAGE_KEYS) {
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
