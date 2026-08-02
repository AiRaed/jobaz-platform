/**
 * Populate Career Knowledge Library roles for Civil Engineering only.
 *
 * Links roles to academic_level stages (degree / masters / phd) via metadata.
 * Draft status only. No courses, recognition, or assessment changes.
 *
 *   npx tsx scripts/populate-career-library-civil-engineering-roles.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { normalizeSlug } from '../lib/admin/career-library/guards'

function loadEnvLocal() {
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

type RoleSeed = {
  name: string
  description: string
}

/** Bachelor's / Degree — entry and standard professional UK roles */
const DEGREE_ROLES: RoleSeed[] = [
  {
    name: 'Graduate Civil Engineer',
    description:
      'Entry UK role on a structured training scheme, supporting design, site work and progression toward ICE professional qualification.',
  },
  {
    name: 'Assistant Civil Engineer',
    description:
      'Supports project teams with drawings, calculations, site coordination and document control under supervision of senior engineers.',
  },
  {
    name: 'Civil Design Engineer',
    description:
      'Prepares civil design packages for infrastructure and building projects using CAD/BIM tools and UK design standards.',
  },
  {
    name: 'Site Engineer',
    description:
      'Delivers setting-out, quality checks and contractor liaison on UK construction sites for civil and infrastructure works.',
  },
  {
    name: 'Highways Engineer',
    description:
      'Works on highway design, traffic infrastructure and road improvement schemes for local authorities and consultants.',
  },
  {
    name: 'Drainage Engineer',
    description:
      'Designs surface water and foul drainage systems, including SuDS and network assessments for UK developments.',
  },
  {
    name: 'Water / Wastewater Engineer (Graduate)',
    description:
      'Supports water treatment, networks and wastewater projects within UK water utilities and consulting practices.',
  },
  {
    name: 'Structural Design Assistant (Civil)',
    description:
      'Assists with structural analysis and detailing for civil structures such as retaining walls, foundations and small bridges.',
  },
  {
    name: 'Infrastructure Engineer',
    description:
      'Contributes to multidisciplinary infrastructure schemes covering earthworks, utilities and public realm delivery.',
  },
  {
    name: 'Civil Engineering Technician / Technician Engineer pathway',
    description:
      'Provides technical drawing, surveying support and design assistance; may align with EngTech / IEng development routes.',
  },
]

/** Master's — advanced design, project and specialist UK roles */
const MASTERS_ROLES: RoleSeed[] = [
  {
    name: 'Civil Design Engineer (Advanced)',
    description:
      'Leads complex design packages and technical coordination on larger UK infrastructure and building projects.',
  },
  {
    name: 'Project Engineer (Civil)',
    description:
      'Owns work packages through design and delivery, managing programme, interfaces and stakeholder communication.',
  },
  {
    name: 'Senior Site Engineer',
    description:
      'Supervises site engineering teams, temporary works awareness and quality assurance on major civil contracts.',
  },
  {
    name: 'Geotechnical Engineer',
    description:
      'Assesses ground conditions and designs foundations, earthworks and ground-improvement solutions for UK projects.',
  },
  {
    name: 'Structural Engineer (Civil Infrastructure)',
    description:
      'Designs and checks structural elements of bridges, tunnels, retaining structures and civil frames.',
  },
  {
    name: 'Flood Risk / Hydraulic Engineer',
    description:
      'Undertakes hydraulic modelling, flood risk assessment and drainage strategy work under UK planning and EA guidance.',
  },
  {
    name: 'Transportation / Highways Design Engineer',
    description:
      'Delivers advanced highway geometry, junction design and transport infrastructure schemes for UK clients.',
  },
  {
    name: 'Bridge Engineer',
    description:
      'Specialises in bridge assessment, strengthening and new bridge design for highways and rail networks.',
  },
  {
    name: 'Asset Management Engineer (Civil)',
    description:
      'Plans inspection, maintenance and renewal strategies for civil infrastructure assets across public and private owners.',
  },
  {
    name: 'BIM / Digital Engineering Lead (Civil)',
    description:
      'Leads digital delivery, information management and coordinated BIM workflows on civil infrastructure programmes.',
  },
]

/** PhD — research, university, innovation and highly specialised UK roles */
const PHD_ROLES: RoleSeed[] = [
  {
    name: 'Research Associate / Postdoctoral Researcher (Civil Engineering)',
    description:
      'Conducts funded research in universities or research centres on advanced civil engineering topics and publications.',
  },
  {
    name: 'University Lecturer / Assistant Professor (Civil Engineering)',
    description:
      'Teaches civil engineering modules and supervises student projects while developing an academic research portfolio.',
  },
  {
    name: 'Principal / Specialist Geotechnical Consultant',
    description:
      'Provides expert geotechnical advice on complex ground-structure interaction, risk and forensic investigations.',
  },
  {
    name: 'Computational / Numerical Modelling Specialist (Civil)',
    description:
      'Develops advanced finite-element, CFD or structural models for research-led design and innovation projects.',
  },
  {
    name: 'Innovation / R&D Engineer (Infrastructure)',
    description:
      'Leads new materials, digital twin or low-carbon construction research within industry R&D or Catapult-style centres.',
  },
  {
    name: 'Climate Resilience / Adaptation Specialist (Civil Infrastructure)',
    description:
      'Advises on climate-risk modelling and resilient infrastructure strategies for cities, utilities and government.',
  },
  {
    name: 'Senior Flood Risk Scientist / Hydraulic Modelling Specialist',
    description:
      'Delivers advanced catchment and coastal modelling research supporting policy, planning and major flood schemes.',
  },
  {
    name: 'Materials / Concrete Technology Specialist',
    description:
      'Researches and advises on advanced construction materials performance, durability and low-carbon concrete systems.',
  },
  {
    name: 'Technical Authority / Expert Witness (Civil Engineering)',
    description:
      'Acts as a recognised technical authority on disputes, standards development and highly specialised engineering problems.',
  },
  {
    name: 'Research & Innovation Manager (Civil / Infrastructure)',
    description:
      'Manages research programmes, industry–university partnerships and innovation funding for civil infrastructure.',
  },
]

type StageKey = 'degree' | 'masters' | 'phd'

async function insertRolesForStage(
  supabase: SupabaseClient,
  specialismId: string,
  stage: { id: string; stage_key: string; label: string },
  roles: RoleSeed[],
  existingSlugs: Set<string>
): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = []
  const skipped: string[] = []

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i]
    const baseSlug = normalizeSlug(undefined, role.name)
    if (!baseSlug) {
      skipped.push(role.name)
      continue
    }
    // Prefix with stage so Degree/Master variants of similar titles remain unique
    const slug = `${stage.stage_key}-${baseSlug}`

    if (existingSlugs.has(slug)) {
      skipped.push(role.name)
      continue
    }

    const { error } = await supabase.from('career_library_roles').insert({
      specialism_id: specialismId,
      name: role.name,
      slug,
      description: role.description,
      status: 'draft',
      active: true,
      sort_order: (i + 1) * 10,
      metadata: {
        stage_id: stage.id,
        stage_key: stage.stage_key as StageKey,
        stage_label: stage.label,
        academic_level: stage.stage_key,
        specialism_slug: 'civil-engineering',
        country_focus: 'uk',
      },
    })

    if (error) {
      if (error.code === '23505') {
        skipped.push(role.name)
        continue
      }
      throw new Error(`${role.name} [${stage.stage_key}]: ${error.message}`)
    }

    created.push(role.name)
    existingSlugs.add(slug)
  }

  return { created, skipped }
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: specialism, error: specErr } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug, stage_model_id')
    .eq('slug', 'civil-engineering')
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(
      `Civil Engineering specialism not found: ${specErr?.message ?? 'missing row'}`
    )
  }

  const { data: model, error: modelErr } = await supabase
    .from('career_library_stage_models')
    .select('id, model_key')
    .eq('model_key', 'academic_level')
    .maybeSingle()

  if (modelErr || !model) {
    throw new Error(`academic_level stage model not found: ${modelErr?.message ?? 'missing'}`)
  }

  const { data: stages, error: stagesErr } = await supabase
    .from('career_library_stages')
    .select('id, stage_key, label, sort_order')
    .eq('stage_model_id', model.id)
    .in('stage_key', ['degree', 'masters', 'phd'])
    .order('sort_order', { ascending: true })

  if (stagesErr || !stages?.length) {
    throw new Error(`Academic stages not found: ${stagesErr?.message ?? 'empty'}`)
  }

  const stageByKey = new Map(stages.map((s) => [s.stage_key, s]))
  for (const key of ['degree', 'masters', 'phd'] as const) {
    if (!stageByKey.has(key)) {
      throw new Error(`Missing academic stage: ${key}`)
    }
  }

  const { data: existingRoles, error: rolesErr } = await supabase
    .from('career_library_roles')
    .select('slug')
    .eq('specialism_id', specialism.id)

  if (rolesErr) throw new Error(rolesErr.message)
  const existingSlugs = new Set((existingRoles ?? []).map((r) => r.slug))

  const degree = await insertRolesForStage(
    supabase,
    specialism.id,
    stageByKey.get('degree')!,
    DEGREE_ROLES,
    existingSlugs
  )
  const masters = await insertRolesForStage(
    supabase,
    specialism.id,
    stageByKey.get('masters')!,
    MASTERS_ROLES,
    existingSlugs
  )
  const phd = await insertRolesForStage(
    supabase,
    specialism.id,
    stageByKey.get('phd')!,
    PHD_ROLES,
    existingSlugs
  )

  const totalCreated = degree.created.length + masters.created.length + phd.created.length
  const totalSkipped = degree.skipped.length + masters.skipped.length + phd.skipped.length

  console.log('\n=== Civil Engineering roles populate summary ===')
  console.log(`Specialism: ${specialism.name} (${specialism.slug})`)
  console.log(`Stage model: academic_level`)
  console.log(`Status: draft`)
  console.log(`Roles created: ${totalCreated}`)
  console.log(`Duplicates skipped: ${totalSkipped}`)

  console.log('\nDegree / Bachelor roles:')
  for (const n of degree.created) console.log(`  - ${n}`)
  if (!degree.created.length) console.log('  (none new)')

  console.log("\nMaster's roles:")
  for (const n of masters.created) console.log(`  - ${n}`)
  if (!masters.created.length) console.log('  (none new)')

  console.log('\nPhD roles:')
  for (const n of phd.created) console.log(`  - ${n}`)
  if (!phd.created.length) console.log('  (none new)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
