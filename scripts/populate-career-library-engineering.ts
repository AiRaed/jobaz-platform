/**
 * Populate Career Knowledge Library: Engineering field + specialisms.
 *
 * Uses the same data layer / validation as admin Career Library APIs
 * (normalizeSlug, service-role Supabase client). No raw SQL inserts.
 *
 *   npx tsx scripts/populate-career-library-engineering.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
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

type SpecialismSeed = {
  name: string
  description: string
  regulatedProfession?: boolean
  professionalBody?: string | null
}

const ENGINEERING_SPECIALISMS: SpecialismSeed[] = [
  {
    name: 'Civil Engineering',
    description:
      'Designs, builds and maintains infrastructure such as roads, bridges, buildings and water systems for safe public use.',
  },
  {
    name: 'Mechanical Engineering',
    description:
      'Applies mechanics, materials and energy systems to design and improve machines, products and industrial equipment.',
  },
  {
    name: 'Electrical Engineering',
    description:
      'Focuses on the generation, distribution and use of electrical power, including grids, motors and electrical systems.',
  },
  {
    name: 'Electronic Engineering',
    description:
      'Designs electronic circuits, devices and embedded systems used in communications, control and consumer technology.',
  },
  {
    name: 'Chemical Engineering',
    description:
      'Transforms raw materials into useful products through chemical processes in industries such as energy, chemicals and manufacturing.',
  },
  {
    name: 'Industrial Engineering',
    description:
      'Improves systems of people, processes and technology to raise productivity, quality and operational efficiency.',
  },
  {
    name: 'Aerospace Engineering',
    description:
      'Designs and develops aircraft, spacecraft and related systems for flight within and beyond the atmosphere.',
  },
  {
    name: 'Automotive Engineering',
    description:
      'Develops vehicles and vehicle systems, covering design, powertrain, safety, manufacturing and performance.',
  },
  {
    name: 'Environmental Engineering',
    description:
      'Applies engineering methods to protect air, water and land, including pollution control and environmental remediation.',
  },
  {
    name: 'Petroleum Engineering',
    description:
      'Focuses on exploration, extraction and production of oil and gas, including reservoir and drilling engineering.',
  },
  {
    name: 'Mechatronics',
    description:
      'Integrates mechanical, electrical and control engineering to create intelligent automated systems and robotics.',
  },
  {
    name: 'Architecture',
    description:
      'Designs buildings and the built environment, balancing form, function, safety, sustainability and user needs.',
  },
  {
    name: 'Quantity Surveying',
    description:
      'Manages cost, contracts and commercial control on construction and infrastructure projects from design to delivery.',
  },
  {
    name: 'Structural Engineering',
    description:
      'Ensures buildings and structures are safe and stable under loads, using analysis of materials and structural systems.',
  },
  {
    name: 'Geotechnical Engineering',
    description:
      'Studies soil and rock behaviour to design foundations, earthworks, tunnels and ground-support solutions.',
  },
  {
    name: 'Water Engineering',
    description:
      'Plans and delivers water supply, wastewater, drainage and flood-management systems for communities and industry.',
  },
  {
    name: 'Marine Engineering',
    description:
      'Designs and maintains machinery and systems used on ships, offshore platforms and marine vessels.',
  },
  {
    name: 'Naval Architecture',
    description:
      'Designs the form, structure and performance of ships and marine vessels for safe and efficient operation.',
  },
  {
    name: 'Renewable Energy Engineering',
    description:
      'Develops clean energy systems such as wind, solar, hydro and related grid integration technologies.',
  },
  {
    name: 'Mining Engineering',
    description:
      'Plans and operates the extraction of minerals safely and efficiently, including mine design and processing.',
  },
  {
    name: 'Materials Engineering',
    description:
      'Selects, develops and tests materials so products and structures meet performance, durability and safety needs.',
  },
  {
    name: 'Biomedical Engineering',
    description:
      'Applies engineering to healthcare, including medical devices, imaging systems and assistive technologies.',
  },
  {
    name: 'Nuclear Engineering',
    description:
      'Works with nuclear systems for energy production, safety, radiation protection and related technical applications.',
  },
  {
    name: 'Railway Engineering',
    description:
      'Designs and maintains rail infrastructure, rolling stock and systems for safe and reliable railway operations.',
  },
  {
    name: 'Fire Engineering',
    description:
      'Uses fire science and engineering to protect life and property through fire safety design and risk control.',
  },
  {
    name: 'Building Services Engineering',
    description:
      'Designs mechanical and electrical building systems such as heating, ventilation, lighting and energy services.',
  },
  {
    name: 'Other Engineering',
    description:
      'Covers engineering pathways that do not fit a listed specialism, used when a user’s education or route is broader or mixed.',
  },
]

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

  // Prefer academic_level for engineering education routes (same linkage as admin create).
  const { data: stageModel, error: stageErr } = await supabase
    .from('career_library_stage_models')
    .select('id, model_key')
    .eq('model_key', 'academic_level')
    .eq('active', true)
    .maybeSingle()

  if (stageErr || !stageModel?.id) {
    throw new Error(
      `Could not resolve academic_level stage model: ${stageErr?.message ?? 'not found'}`
    )
  }

  const fieldSlug = normalizeSlug(undefined, 'Engineering')
  if (!fieldSlug) throw new Error('Invalid Engineering slug')

  let fieldId: string
  let fieldCreated = false

  const { data: existingField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .or(`slug.eq.${fieldSlug},name.ilike.Engineering`)
    .maybeSingle()

  if (existingField?.id) {
    fieldId = existingField.id
    console.log(`Field already exists: ${existingField.name} (${existingField.slug})`)
  } else {
    const { data: created, error: fieldError } = await supabase
      .from('career_library_fields')
      .insert({
        name: 'Engineering',
        slug: fieldSlug,
        description:
          'Engineering and related built-environment disciplines covering design, infrastructure, manufacturing, energy and technical systems.',
        status: 'draft',
        active: true,
        sort_order: 10,
      })
      .select('id, name, slug')
      .single()

    if (fieldError || !created) {
      throw new Error(fieldError?.message ?? 'Failed to create Engineering field')
    }
    fieldId = created.id
    fieldCreated = true
    console.log(`Created field: ${created.name} (${created.slug})`)
  }

  const { data: existingSpecialisms, error: listErr } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug')
    .eq('field_id', fieldId)

  if (listErr) throw new Error(listErr.message)

  const existingBySlug = new Set((existingSpecialisms ?? []).map((s) => s.slug))
  const existingByName = new Set(
    (existingSpecialisms ?? []).map((s) => s.name.trim().toLowerCase())
  )

  let createdCount = 0
  let skippedDuplicates = 0
  const createdNames: string[] = []
  const skippedNames: string[] = []

  for (let i = 0; i < ENGINEERING_SPECIALISMS.length; i++) {
    const item = ENGINEERING_SPECIALISMS[i]
    const slug = normalizeSlug(undefined, item.name)
    if (!slug) {
      console.warn(`Skipped invalid slug for: ${item.name}`)
      skippedDuplicates += 1
      skippedNames.push(item.name)
      continue
    }

    if (existingBySlug.has(slug) || existingByName.has(item.name.trim().toLowerCase())) {
      skippedDuplicates += 1
      skippedNames.push(item.name)
      continue
    }

    const { data, error } = await supabase
      .from('career_library_specialisms')
      .insert({
        field_id: fieldId,
        name: item.name,
        slug,
        description: item.description,
        stage_model_id: stageModel.id,
        regulated_profession: item.regulatedProfession ?? false,
        professional_body: item.professionalBody ?? null,
        status: 'draft',
        active: true,
        sort_order: (i + 1) * 10,
      })
      .select('id, name, slug')
      .single()

    if (error) {
      if (error.code === '23505') {
        skippedDuplicates += 1
        skippedNames.push(item.name)
        continue
      }
      throw new Error(`${item.name}: ${error.message}`)
    }

    createdCount += 1
    createdNames.push(data.name)
    existingBySlug.add(slug)
    existingByName.add(item.name.trim().toLowerCase())
  }

  console.log('\n=== Career Knowledge Library — Engineering populate summary ===')
  console.log(
    `Engineering field: ${fieldCreated ? 'created' : 'already existed'} (id=${fieldId}, slug=${fieldSlug})`
  )
  console.log(`Stage model linked: academic_level (${stageModel.id})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Duplicates skipped: ${skippedDuplicates}`)
  if (createdNames.length) {
    console.log('Created:')
    for (const n of createdNames) console.log(`  - ${n}`)
  }
  if (skippedNames.length) {
    console.log('Skipped:')
    for (const n of skippedNames) console.log(`  - ${n}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
