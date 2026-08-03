/**
 * Seed Career Knowledge Library: Healthcare & Medicine field + specialisms.
 *
 * Uses healthcare_professional_route (qualification → registration → practice…).
 * Does NOT modify Engineering or IT.
 *
 *   npx tsx scripts/seed-career-library-healthcare-medicine.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureHealthcareStageModel,
} from './career-library-healthcare/shared'

type SpecialismSeed = {
  name: string
  description: string
  professionalBody: string
  regulatedProfession?: boolean
  disabledStageKeys?: string[]
}

const HEALTHCARE_SPECIALISMS: SpecialismSeed[] = [
  {
    name: 'Medicine',
    description:
      'Medical practice covering diagnosis, treatment and prevention of disease across NHS, private and academic settings, regulated by the GMC.',
    professionalBody: 'General Medical Council (GMC)',
  },
  {
    name: 'Nursing',
    description:
      'Nursing care across hospital, community and specialist settings, regulated by the Nursing and Midwifery Council (NMC).',
    professionalBody: 'Nursing and Midwifery Council (NMC)',
  },
  {
    name: 'Pharmacy',
    description:
      'Pharmacy practice including community, hospital and clinical pharmacy, regulated by the General Pharmaceutical Council (GPhC).',
    professionalBody: 'General Pharmaceutical Council (GPhC)',
  },
  {
    name: 'Dentistry',
    description:
      'Dental care including general dentistry, hospital dentistry and dental specialties, regulated by the General Dental Council (GDC).',
    professionalBody: 'General Dental Council (GDC)',
  },
  {
    name: 'Midwifery',
    description:
      'Midwifery care for pregnancy, birth and postnatal period across NHS and community settings, regulated by the NMC.',
    professionalBody: 'Nursing and Midwifery Council (NMC)',
  },
  {
    name: 'Physiotherapy',
    description:
      'Physiotherapy assessment and rehabilitation for movement, function and recovery, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Occupational Therapy',
    description:
      'Occupational therapy enabling people to participate in daily living and meaningful occupations, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Radiography',
    description:
      'Diagnostic and therapeutic radiography including imaging and radiotherapy practice, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Paramedic Science',
    description:
      'Paramedic urgent and emergency care in community, ambulance and hospital settings, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Biomedical Science',
    description:
      'Laboratory biomedical science supporting diagnosis and monitoring of disease, typically HCPC-registered biomedical scientists.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Public Health',
    description:
      'Public health practice spanning health protection, health improvement and healthcare public health in local and national systems.',
    professionalBody: 'UK Public Health Register (UKPHR) / Faculty of Public Health',
    regulatedProfession: false,
  },
  {
    name: 'Healthcare Science',
    description:
      'Healthcare science roles across life sciences, physiological sciences and physical sciences supporting diagnosis and treatment.',
    professionalBody: 'Academy for Healthcare Science / HCPC (where applicable)',
    regulatedProfession: false,
  },
  {
    name: 'Speech and Language Therapy',
    description:
      'Speech and language therapy for communication and swallowing disorders across NHS, education and community settings, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Dietetics',
    description:
      'Dietetic assessment and nutrition therapy for individuals and populations, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Optometry',
    description:
      'Optometry including eye examinations, refractive care and ocular health in community and hospital settings, regulated by the GOC.',
    professionalBody: 'General Optical Council (GOC)',
  },
  {
    name: 'Orthoptics',
    description:
      'Orthoptic assessment and management of eye movement and binocular vision disorders, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Prosthetics & Orthotics',
    description:
      'Design and provision of prostheses and orthoses to support mobility and function, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Clinical Psychology',
    description:
      'Clinical psychology assessment and psychological interventions for mental and physical health, regulated by the HCPC.',
    professionalBody: 'Health and Care Professions Council (HCPC)',
  },
  {
    name: 'Healthcare Management',
    description:
      'Healthcare management and leadership of NHS and private health services, pathways and operational delivery.',
    professionalBody: 'NHS Leadership Academy / Chartered Management Institute (CMI)',
    regulatedProfession: false,
    disabledStageKeys: ['registration_licence'],
  },
  {
    name: 'Clinical Research',
    description:
      'Clinical research delivery and methodology across trials, laboratories, NHS R&D and academic research settings.',
    professionalBody: 'NIHR / MHRA (regulatory context)',
    regulatedProfession: false,
  },
]

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureHealthcareStageModel(supabase)

  const fieldSlug = normalizeSlug(undefined, 'Healthcare & Medicine')
  if (!fieldSlug) throw new Error('Invalid Healthcare & Medicine slug')

  let fieldId: string
  let fieldCreated = false

  const { data: existingField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .or(`slug.eq.${fieldSlug},name.ilike.Healthcare & Medicine`)
    .maybeSingle()

  if (existingField?.id) {
    fieldId = existingField.id
    console.log(`Field already exists: ${existingField.name} (${existingField.slug})`)
  } else {
    const { data: created, error: fieldError } = await supabase
      .from('career_library_fields')
      .insert({
        name: 'Healthcare & Medicine',
        slug: fieldSlug,
        description:
          'UK healthcare and medicine careers spanning clinical professions, healthcare science, public health, management and research. Progression is driven by professional qualification, registration/licence, clinical training and regulatory standards — not Degree/Master’s/PhD by default.',
        status: 'draft',
        active: true,
        sort_order: 30,
      })
      .select('id, name, slug')
      .single()

    if (fieldError || !created) {
      throw new Error(fieldError?.message ?? 'Failed to create Healthcare & Medicine field')
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

  for (let i = 0; i < HEALTHCARE_SPECIALISMS.length; i++) {
    const item = HEALTHCARE_SPECIALISMS[i]
    const slug = normalizeSlug(undefined, item.name)
    if (!slug) {
      skippedDuplicates += 1
      skippedNames.push(item.name)
      continue
    }

    if (existingBySlug.has(slug) || existingByName.has(item.name.trim().toLowerCase())) {
      // Ensure stage model assignment even if specialism already exists
      await supabase
        .from('career_library_specialisms')
        .update({
          stage_model_id: modelId,
          professional_body: item.professionalBody,
          regulated_profession: item.regulatedProfession ?? true,
          status: 'draft',
        })
        .eq('field_id', fieldId)
        .eq('slug', slug)
      skippedDuplicates += 1
      skippedNames.push(item.name)
      continue
    }

    const description = item.disabledStageKeys?.length
      ? `${item.description}\n\n[[disabled_stage_keys:${item.disabledStageKeys.join(',')}]]`
      : item.description

    const row: Record<string, unknown> = {
      field_id: fieldId,
      name: item.name,
      slug,
      description,
      stage_model_id: modelId,
      regulated_profession: item.regulatedProfession ?? true,
      professional_body: item.professionalBody,
      status: 'draft',
      active: true,
      sort_order: (i + 1) * 10,
    }

    if (item.disabledStageKeys?.length) {
      row.disabled_stage_keys = item.disabledStageKeys
    }

    let { data, error } = await supabase
      .from('career_library_specialisms')
      .insert(row)
      .select('id, name, slug')
      .single()

    if (error && (error.message?.includes('disabled_stage_keys') || error.code === '42703')) {
      delete row.disabled_stage_keys
      const retry = await supabase
        .from('career_library_specialisms')
        .insert(row)
        .select('id, name, slug')
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      if (error.code === '23505') {
        skippedDuplicates += 1
        skippedNames.push(item.name)
        continue
      }
      throw new Error(`${item.name}: ${error.message}`)
    }

    createdCount += 1
    createdNames.push(data!.name)
    existingBySlug.add(slug)
    existingByName.add(item.name.trim().toLowerCase())
  }

  console.log('\n=== Career Knowledge Library — Healthcare & Medicine foundation ===')
  console.log(
    `Field: ${fieldCreated ? 'created' : 'already existed'} (id=${fieldId}, slug=${fieldSlug})`
  )
  console.log(`Stage model linked: healthcare_professional_route (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Duplicates skipped / already present: ${skippedDuplicates}`)
  if (createdNames.length) {
    console.log('Created:')
    for (const n of createdNames) console.log(`  - ${n}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
