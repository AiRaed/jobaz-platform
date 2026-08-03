/**
 * Seed Career Knowledge Library: IT & Technology field + specialisms.
 *
 * Uses experience_level stage model (skill/experience), NOT Engineering academic_level.
 * Does not modify Engineering data.
 *
 *   npx tsx scripts/seed-career-library-it-technology.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import { createServiceClient, ensureItSkillStageModel } from './career-library-it/shared'

type SpecialismSeed = {
  name: string
  description: string
  professionalBody?: string | null
}

const IT_SPECIALISMS: SpecialismSeed[] = [
  {
    name: 'Software Development',
    description:
      'Designs, builds and maintains software applications and services using programming languages, frameworks and modern delivery practices.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Web Development',
    description:
      'Builds websites and web applications, covering front-end interfaces, back-end services and full web delivery stacks.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Mobile Development',
    description:
      'Creates native and cross-platform mobile apps for iOS and Android, including app stores, UX and device capabilities.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Full Stack Development',
    description:
      'Delivers end-to-end product features across client, API and data layers with ownership of the full delivery stack.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Frontend Development',
    description:
      'Implements user interfaces, accessibility and client-side performance for web and product experiences.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Backend Development',
    description:
      'Builds server-side APIs, services, data access and business logic that power products and platforms.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'DevOps',
    description:
      'Improves software delivery through CI/CD, infrastructure as code, observability and collaboration between development and operations.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Cloud Computing',
    description:
      'Designs, migrates and operates workloads on public and hybrid cloud platforms with cost, reliability and security in mind.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Cyber Security',
    description:
      'Protects systems, data and users through security engineering, operations, risk management and incident response.',
    professionalBody: 'Chartered Institute of Information Security (CIISec)',
  },
  {
    name: 'Networking',
    description:
      'Designs, configures and supports enterprise networks, connectivity, routing and network security controls.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Systems Administration',
    description:
      'Operates and maintains servers, identity, endpoints and platform services that keep organisational IT running.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'IT Support',
    description:
      'Provides first- and second-line technical support, service desk operations and end-user IT assistance.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Database Administration',
    description:
      'Administers relational and non-relational databases, focusing on availability, performance, backup and data integrity.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Data Engineering',
    description:
      'Builds reliable data pipelines, platforms and warehouses that make data available for analytics and products.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Data Analytics',
    description:
      'Turns data into insight through analysis, reporting, visualisation and evidence-based recommendations.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Data Science',
    description:
      'Applies statistical methods, experimentation and modelling to extract insight and support data-driven decisions.',
    professionalBody: 'Royal Statistical Society (RSS)',
  },
  {
    name: 'Artificial Intelligence',
    description:
      'Designs and deploys AI systems and capabilities, including applied AI products, evaluation and responsible AI practice.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Machine Learning',
    description:
      'Builds, trains, evaluates and productionises machine learning models and ML systems.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Business Intelligence',
    description:
      'Delivers BI reporting, semantic models and self-service analytics that support organisational decision-making.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'QA & Software Testing',
    description:
      'Assures software quality through manual and automated testing, test strategy and quality engineering practices.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Game Development',
    description:
      'Creates interactive games and real-time experiences across engines, gameplay systems, tools and platforms.',
    professionalBody: 'TIGA',
  },
  {
    name: 'Embedded Systems',
    description:
      'Develops software for constrained devices and firmware that interacts closely with hardware and real-time systems.',
    professionalBody: 'IET',
  },
  {
    name: 'IoT',
    description:
      'Builds connected device solutions spanning sensors, edge software, device management and IoT platforms.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'ERP / CRM Systems',
    description:
      'Implements and supports enterprise ERP and CRM platforms, including configuration, integration and business process change.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Enterprise Architecture',
    description:
      'Shapes organisation-wide technology strategy, capability maps and architectural standards across business and IT.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Solutions Architecture',
    description:
      'Designs end-to-end technical solutions for products and programmes, balancing requirements, constraints and delivery.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Blockchain',
    description:
      'Develops distributed ledger applications, smart contracts and blockchain-enabled products and platforms.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Computer Vision',
    description:
      'Builds systems that extract meaning from images and video using computer vision and applied deep learning.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
  {
    name: 'Robotics Software',
    description:
      'Develops software for robots and autonomous systems, including perception, control, simulation and robot platforms.',
    professionalBody: 'IET',
  },
  {
    name: 'Other IT & Technology',
    description:
      'Covers IT and technology pathways that do not fit a listed specialism, used for broader, mixed or emerging routes.',
    professionalBody: 'BCS, The Chartered Institute for IT',
  },
]

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureItSkillStageModel(supabase)

  const fieldSlug = normalizeSlug(undefined, 'IT & Technology')
  if (!fieldSlug) throw new Error('Invalid IT & Technology slug')

  let fieldId: string
  let fieldCreated = false

  const { data: existingField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .or(`slug.eq.${fieldSlug},name.ilike.IT & Technology`)
    .maybeSingle()

  if (existingField?.id) {
    fieldId = existingField.id
    console.log(`Field already exists: ${existingField.name} (${existingField.slug})`)
  } else {
    const { data: created, error: fieldError } = await supabase
      .from('career_library_fields')
      .insert({
        name: 'IT & Technology',
        slug: fieldSlug,
        description:
          'IT and technology careers spanning software, infrastructure, security, data, AI and digital platforms. Progression is primarily skill- and experience-based; degrees are often optional and certifications, portfolios and practical delivery are frequently decisive.',
        status: 'draft',
        active: true,
        sort_order: 20,
      })
      .select('id, name, slug')
      .single()

    if (fieldError || !created) {
      throw new Error(fieldError?.message ?? 'Failed to create IT & Technology field')
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

  for (let i = 0; i < IT_SPECIALISMS.length; i++) {
    const item = IT_SPECIALISMS[i]
    const slug = normalizeSlug(undefined, item.name)
    if (!slug) {
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
        stage_model_id: modelId,
        regulated_profession: false,
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

  console.log('\n=== Career Knowledge Library — IT & Technology foundation ===')
  console.log(
    `IT & Technology field: ${fieldCreated ? 'created' : 'already existed'} (id=${fieldId}, slug=${fieldSlug})`
  )
  console.log(`Stage model linked: it_skill_experience (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Duplicates skipped: ${skippedDuplicates}`)
  if (createdNames.length) {
    console.log('Created:')
    for (const n of createdNames) console.log(`  - ${n}`)
  }
  if (skippedNames.length) {
    console.log('Skipped (already present):')
    for (const n of skippedNames) console.log(`  - ${n}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
