/**
 * Shared helpers for IT & Technology Career Knowledge Library populate scripts.
 * Uses it_skill_experience stage model — not Engineering academic_level.
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

/** Canonical IT skill/experience stage keys (it_skill_experience model). */
export type ItSkillStageKey =
  | 'entry_trainee'
  | 'junior'
  | 'practitioner'
  | 'experienced'
  | 'senior'
  | 'lead_principal'
  | 'architect_specialist'
  | 'manager_head'
  | 'director_executive'
  | 'academic_research'

export const IT_SKILL_STAGE_KEYS: ItSkillStageKey[] = [
  'entry_trainee',
  'junior',
  'practitioner',
  'experienced',
  'senior',
  'lead_principal',
  'architect_specialist',
  'manager_head',
  'director_executive',
  'academic_research',
]

/** Alias used by role seed helpers. */
export type ExperienceStageKey = ItSkillStageKey

/** @deprecated Use IT_SKILL_STAGE_KEYS */
export const EXPERIENCE_STAGE_KEYS = IT_SKILL_STAGE_KEYS

export type RoleSeed = {
  name: string
  description: string
  stageKey: ExperienceStageKey
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
  ItSkillStageKey,
  {
    seniorityLevel: CareerLibrarySeniorityLevel
    minimumExperienceYears: number
    experienceRequirementLabel: string
    fitClassification: CareerLibraryFitClassification
    academicRequirement: CareerLibraryAcademicRequirement
  }
> = {
  entry_trainee: {
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'No prior professional IT experience required',
    fitClassification: 'immediate',
    academicRequirement: 'none',
  },
  junior: {
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Typically 0–2 years relevant experience or strong portfolio',
    fitClassification: 'immediate',
    academicRequirement: 'none',
  },
  practitioner: {
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–4 years relevant hands-on experience',
    fitClassification: 'realistic_next',
    academicRequirement: 'none',
  },
  experienced: {
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years relevant experience',
    fitClassification: 'realistic_next',
    academicRequirement: 'none',
  },
  senior: {
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel: 'Typically 5+ years relevant experience (not automatic from Master’s)',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  lead_principal: {
    seniorityLevel: 'principal',
    minimumExperienceYears: 7,
    experienceRequirementLabel: 'Typically 7+ years with technical ownership and mentoring',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  architect_specialist: {
    seniorityLevel: 'principal',
    minimumExperienceYears: 8,
    experienceRequirementLabel: 'Typically 8+ years with deep architecture or specialist expertise',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  manager_head: {
    seniorityLevel: 'leadership',
    minimumExperienceYears: 8,
    experienceRequirementLabel: 'Typically 8+ years including people, delivery or service responsibility',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  director_executive: {
    seniorityLevel: 'leadership',
    minimumExperienceYears: 12,
    experienceRequirementLabel: 'Typically 12+ years senior technology leadership',
    fitClassification: 'future_progression',
    academicRequirement: 'degree_relevant',
  },
  academic_research: {
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel:
      'Research experience typically expected; Master’s/PhD may be relevant but do not imply seniority',
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

/** Compact role builder — stage supplies seniority / experience / fit defaults. */
export function r(
  name: string,
  stageKey: ExperienceStageKey,
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
  const isResearch = opts.isResearchRole ?? stageKey === 'academic_research'
  const isAcademic = opts.isAcademicRole ?? stageKey === 'academic_research'
  return {
    name,
    description,
    stageKey,
    roleCategory:
      opts.roleCategory ??
      (stageKey === 'academic_research'
        ? isAcademic && !isResearch
          ? 'academic'
          : 'research'
        : stageKey === 'manager_head' || stageKey === 'director_executive'
          ? 'leadership'
          : stageKey === 'architect_specialist'
            ? 'design'
            : 'professional_practice'),
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
  }
}

export async function ensureItSkillStageModel(supabase: SupabaseClient): Promise<{
  modelId: string
  stageByKey: Map<string, { id: string; stage_key: string; label: string }>
}> {
  // Deactivate legacy duplicate IT model if present
  await supabase
    .from('career_library_stage_models')
    .update({ active: false })
    .eq('model_key', 'experience_level')

  const stagesDef: Array<{
    stage_key: ItSkillStageKey
    label: string
    description: string
    sort_order: number
  }> = [
    {
      stage_key: 'entry_trainee',
      label: 'Entry / Trainee',
      description:
        'Suitable for career starters, apprentices, support trainees and candidates with foundational skills.',
      sort_order: 10,
    },
    {
      stage_key: 'junior',
      label: 'Junior',
      description:
        'Usually 0–2 years experience. Degree may be useful but must not be mandatory unless genuinely required.',
      sort_order: 20,
    },
    {
      stage_key: 'practitioner',
      label: 'Practitioner',
      description: 'Independent delivery level. Usually 1–4 years experience.',
      sort_order: 30,
    },
    {
      stage_key: 'experienced',
      label: 'Experienced',
      description: 'Strong independent contributor. Usually 3–6 years experience.',
      sort_order: 40,
    },
    {
      stage_key: 'senior',
      label: 'Senior',
      description:
        'Usually 5+ years experience. Must not be assigned automatically because of a Master’s degree.',
      sort_order: 50,
    },
    {
      stage_key: 'lead_principal',
      label: 'Lead / Principal',
      description:
        'Requires substantial delivery experience, technical ownership and mentoring.',
      sort_order: 60,
    },
    {
      stage_key: 'architect_specialist',
      label: 'Architect / Specialist',
      description:
        'Reserved for advanced technical depth — architecture, security, cloud, data, AI, infrastructure or platform specialism.',
      sort_order: 70,
    },
    {
      stage_key: 'manager_head',
      label: 'Manager / Head',
      description: 'Requires people, delivery, budget, service or programme responsibility.',
      sort_order: 80,
    },
    {
      stage_key: 'director_executive',
      label: 'Director / Executive',
      description: 'Future progression only. Requires extensive leadership experience.',
      sort_order: 90,
    },
    {
      stage_key: 'academic_research',
      label: 'Academic / Research',
      description:
        'Genuine research/university roles only. Master’s/PhD may be relevant but must not imply automatic seniority.',
      sort_order: 100,
    },
  ]

  let modelId: string
  const { data: existing } = await supabase
    .from('career_library_stage_models')
    .select('id')
    .eq('model_key', 'it_skill_experience')
    .maybeSingle()

  if (existing?.id) {
    modelId = existing.id
    await supabase
      .from('career_library_stage_models')
      .update({
        name: 'IT skill & experience',
        description:
          'IT & Technology progression by practical skills, portfolio, certifications, commercial experience, technical depth and leadership responsibility.',
        active: true,
        is_system: true,
        sort_order: 50,
      })
      .eq('id', modelId)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_stage_models')
      .insert({
        model_key: 'it_skill_experience',
        name: 'IT skill & experience',
        description:
          'IT & Technology progression by practical skills, portfolio, certifications, commercial experience, technical depth and leadership responsibility.',
        active: true,
        sort_order: 50,
        is_system: true,
      })
      .select('id')
      .single()
    if (error || !created) {
      throw new Error(`Failed to create it_skill_experience model: ${error?.message ?? 'unknown'}`)
    }
    modelId = created.id
  }

  for (const s of stagesDef) {
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
    throw new Error(`it_skill_experience stages not found: ${stagesErr?.message ?? 'empty'}`)
  }

  const stageByKey = new Map(stages.map((s) => [s.stage_key, s]))
  for (const key of IT_SKILL_STAGE_KEYS) {
    if (!stageByKey.has(key)) throw new Error(`Missing IT skill stage: ${key}`)
  }

  return { modelId, stageByKey }
}

/** @deprecated Use ensureItSkillStageModel */
export const ensureExperienceStageModel = ensureItSkillStageModel

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
        experience_level: stage.stage_key,
        specialism_slug: pack.slug,
        country_focus: 'uk',
        professional_body_focus: pack.professionalBody,
        related_bodies: pack.relatedBodies,
        eligibility_model_version: 1,
        progression_model: 'skill_experience',
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

export async function populateItPack(
  supabase: SupabaseClient,
  pack: SpecialismPack,
  stageByKey: Map<string, { id: string; stage_key: string; label: string }>,
  reservedNames: Set<string>
) {
  const { data: specialism, error: specErr } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug, professional_body, regulated_profession')
    .eq('slug', pack.slug)
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(`${pack.label} specialism not found: ${specErr?.message ?? 'missing row'}`)
  }

  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({
        professional_body: pack.professionalBody,
        regulated_profession: false,
      })
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
    for (const r of roles ?? []) reservedNames.add(r.name.trim().toLowerCase())
  }

  const { data: existingRoles, error: rolesErr } = await supabase
    .from('career_library_roles')
    .select('slug, name')
    .eq('specialism_id', specialism.id)

  if (rolesErr) throw new Error(rolesErr.message)
  const existingSlugs = new Set((existingRoles ?? []).map((row) => row.slug))
  for (const row of existingRoles ?? []) reservedNames.add(row.name.trim().toLowerCase())

  const byStage = new Map<ExperienceStageKey, RoleSeed[]>()
  for (const key of IT_SKILL_STAGE_KEYS) byStage.set(key, [])
  for (const role of pack.roles) {
    byStage.get(role.stageKey)!.push(role)
  }

  const stageResults: Record<
    string,
    { created: string[]; skipped: string[]; crossSkipped: string[] }
  > = {}

  for (const key of IT_SKILL_STAGE_KEYS) {
    const stage = stageByKey.get(key)!
    stageResults[key] = await insertRolesForStage(
      supabase,
      pack,
      specialism.id,
      stage,
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

export async function runItPopulate(packs: SpecialismPack[], title: string) {
  const supabase = createServiceClient()
  const { modelId, stageByKey } = await ensureItSkillStageModel(supabase)

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
  const { data: allSpecs } = await supabase.from('career_library_specialisms').select('id, slug')

  const reservedNames = new Set<string>()
  for (const sib of allSpecs ?? []) {
    if (packSlugs.has(sib.slug)) continue
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
  console.log(`Stage model: it_skill_experience (${modelId}) | Status: draft | active: true\n`)

  for (const pack of packs) {
    const result = await populateItPack(supabase, pack, stageByKey, reservedNames)
    let created = 0
    let sameSkipped = 0
    let crossSkipped = 0

    console.log(`--- ${result.specialism.name} (${result.specialism.slug}) ---`)
    for (const key of EXPERIENCE_STAGE_KEYS) {
      const sr = result.stageResults[key]
      created += sr.created.length
      sameSkipped += sr.skipped.length
      crossSkipped += sr.crossSkipped.length
      if (sr.created.length || sr.crossSkipped.length) {
        console.log(`${key}: +${sr.created.length} created`)
        for (const n of sr.created) console.log(`  + ${n}`)
        for (const n of sr.crossSkipped) console.log(`  - skipped conflict: ${n}`)
      }
    }
    totalCreated += created
    totalSameSkipped += sameSkipped
    totalCrossSkipped += crossSkipped
    console.log(
      `Created this run: ${created} | Draft total: ${result.draftCount} | same-skip: ${sameSkipped} | cross-skip: ${crossSkipped}\n`
    )
  }

  console.log('=== Combined totals ===')
  console.log(`Total roles created: ${totalCreated}`)
  console.log(`Duplicates skipped (same specialism): ${totalSameSkipped}`)
  console.log(`Duplicates skipped (cross-specialism title conflict): ${totalCrossSkipped}`)
}
