/**
 * Seed Natural Sciences & Research field + specialisms.
 *   npx tsx scripts/seed-career-library-natural-sciences.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureNaturalSciencesStageModel,
} from './career-library-natural-sciences/shared'

type Spec = {
  name: string
  description: string
  professionalBody: string
  regulatedProfession?: boolean
}

const SPECIALISMS: Spec[] = [
  // Life & Biological
  {
    name: 'Biology',
    description: 'General biology spanning organismal, cellular and ecological study for research, industry and education.',
    professionalBody: 'Royal Society of Biology (RSB)',
  },
  {
    name: 'Biological Sciences',
    description: 'Broad biological sciences covering multi-disciplinary life-science pathways in research and applied settings.',
    professionalBody: 'Royal Society of Biology (RSB)',
  },
  {
    name: 'Molecular Biology',
    description: 'Molecular-level study of biological systems, nucleic acids, proteins and cellular machinery.',
    professionalBody: 'Royal Society of Biology (RSB)',
  },
  {
    name: 'Cell Biology',
    description: 'Study of cell structure, function and signalling in research, biotech and biomedical contexts.',
    professionalBody: 'Royal Society of Biology (RSB)',
  },
  {
    name: 'Microbiology',
    description: 'Study of microorganisms in laboratory, industrial, environmental and public-health science settings.',
    professionalBody: 'Royal Society of Biology (RSB) / Applied Microbiology International',
  },
  {
    name: 'Biochemistry',
    description: 'Chemical processes of living systems — proteins, metabolism, enzymes and biomolecular analysis.',
    professionalBody: 'Biochemical Society / Royal Society of Biology',
  },
  {
    name: 'Biotechnology',
    description: 'Application of biological systems to industrial, agricultural, healthcare and environmental products.',
    professionalBody: 'Royal Society of Biology (RSB)',
  },
  {
    name: 'Genetics and Genomics',
    description: 'Genetic analysis, genome sequencing and genomic interpretation in research and applied science.',
    professionalBody: 'Royal Society of Biology (RSB) / British Society for Genetic Medicine',
  },
  {
    name: 'Neuroscience',
    description: 'Scientific study of the nervous system spanning molecular, systems and behavioural neuroscience.',
    professionalBody: 'British Neuroscience Association / Royal Society of Biology',
  },
  {
    name: 'Zoology',
    description: 'Animal biology covering physiology, behaviour, ecology and conservation of animal species.',
    professionalBody: 'Royal Society of Biology (RSB)',
  },
  {
    name: 'Botany and Plant Science',
    description: 'Plant biology, crop science and botanical research for agriculture, conservation and industry.',
    professionalBody: 'Royal Society of Biology (RSB) / Association of Applied Biologists',
  },
  {
    name: 'Marine Biology',
    description: 'Biology of marine organisms and ecosystems, including field and laboratory marine science.',
    professionalBody: 'Marine Biological Association / Royal Society of Biology',
  },
  {
    name: 'Ecology',
    description: 'Ecological science of populations, communities and ecosystems for research and environmental practice.',
    professionalBody: 'British Ecological Society / Chartered Institute of Ecology and Environmental Management (CIEEM)',
  },
  {
    name: 'Biomedical Science',
    description:
      'Laboratory biomedical science for research and diagnostic support. Clinical HCPC-registered Biomedical Scientist routes are recorded where applicable and kept distinct from Healthcare clinical practice ownership.',
    professionalBody: 'Institute of Biomedical Science (IBMS) / HCPC (where applicable)',
    regulatedProfession: true,
  },
  {
    name: 'Pharmacology',
    description: 'Study of drug action, discovery and safety in research, industry and regulatory science.',
    professionalBody: 'British Pharmacological Society',
  },
  {
    name: 'Toxicology',
    description: 'Assessment of chemical and biological hazards to human health and the environment.',
    professionalBody: 'British Toxicology Society / Royal Society of Chemistry',
  },
  {
    name: 'Immunology',
    description: 'Immune system science for research, biotech, diagnostics and vaccine development.',
    professionalBody: 'British Society for Immunology',
  },
  // Chemical & Physical
  {
    name: 'Chemistry',
    description: 'Core chemistry spanning synthesis, analysis and physical chemistry in research and industry.',
    professionalBody: 'Royal Society of Chemistry (RSC)',
  },
  {
    name: 'Analytical Chemistry',
    description: 'Chemical measurement science — chromatography, spectroscopy and method validation.',
    professionalBody: 'Royal Society of Chemistry (RSC)',
  },
  {
    name: 'Medicinal Chemistry',
    description: 'Design and optimisation of bioactive molecules for drug discovery and development.',
    professionalBody: 'Royal Society of Chemistry (RSC)',
  },
  {
    name: 'Materials Chemistry',
    description: 'Chemistry of materials design, synthesis and characterisation for advanced applications.',
    professionalBody: 'Royal Society of Chemistry (RSC)',
  },
  {
    name: 'Physics',
    description: 'Fundamental and applied physics across research, instrumentation and technical science roles.',
    professionalBody: 'Institute of Physics (IOP)',
  },
  {
    name: 'Applied Physics',
    description: 'Physics applied to technology, instrumentation, industry and engineering-adjacent science.',
    professionalBody: 'Institute of Physics (IOP)',
  },
  {
    name: 'Astrophysics and Astronomy',
    description: 'Observational and theoretical study of the universe, space science and astronomical data.',
    professionalBody: 'Royal Astronomical Society / Institute of Physics',
  },
  {
    name: 'Medical Physics',
    description:
      'Physics applied to healthcare technologies and radiation. Clinical Scientist (Medical Physics) routes reflect UK STP/HCPC requirements and remain distinct from medical doctor roles.',
    professionalBody: 'IPEM / HCPC (Clinical Scientist where applicable)',
    regulatedProfession: true,
  },
  {
    name: 'Nuclear Science',
    description: 'Nuclear physics, radiation science and nuclear applications in energy, research and industry.',
    professionalBody: 'Institute of Physics / Nuclear Institute',
  },
  {
    name: 'Materials Science',
    description: 'Structure–property relationships of materials for research, manufacturing and product development.',
    professionalBody: 'Institute of Materials, Minerals and Mining (IOM3)',
  },
  {
    name: 'Nanoscience and Nanotechnology',
    description: 'Science and technology of materials and devices at the nanoscale.',
    professionalBody: 'Institute of Physics / Royal Society of Chemistry',
  },
  // Mathematical
  {
    name: 'Mathematics',
    description: 'Pure and general mathematics pathways into research, teaching and analytical careers.',
    professionalBody: 'Institute of Mathematics and its Applications (IMA)',
  },
  {
    name: 'Applied Mathematics',
    description: 'Mathematics applied to physical, biological, industrial and computational problems.',
    professionalBody: 'Institute of Mathematics and its Applications (IMA)',
  },
  {
    name: 'Statistics',
    description: 'Statistical science for research, government, industry and experimental design (distinct from IT Data Science).',
    professionalBody: 'Royal Statistical Society (RSS)',
  },
  {
    name: 'Operational Research',
    description: 'OR and decision science for optimisation, simulation and evidence-based operations.',
    professionalBody: 'The OR Society',
  },
  {
    name: 'Mathematical Modelling',
    description: 'Building and validating mathematical models of real-world systems for science and industry.',
    professionalBody: 'Institute of Mathematics and its Applications (IMA)',
  },
  // Earth & Environmental
  {
    name: 'Environmental Science',
    description: 'Interdisciplinary environmental science for monitoring, assessment and sustainability.',
    professionalBody: 'Institution of Environmental Sciences (IES) / CIEEM',
  },
  {
    name: 'Earth Science',
    description: 'Broad earth system science covering geological, atmospheric and planetary processes.',
    professionalBody: 'Geological Society of London',
  },
  {
    name: 'Geology',
    description: 'Geological science of rocks, minerals, resources and earth history for research and industry.',
    professionalBody: 'Geological Society of London',
  },
  {
    name: 'Geophysics',
    description: 'Physical methods applied to Earth structure, exploration and environmental geophysics.',
    professionalBody: 'Geological Society of London / Royal Astronomical Society',
  },
  {
    name: 'Geochemistry',
    description: 'Chemical composition and processes of Earth materials in research and exploration.',
    professionalBody: 'Geological Society of London / Royal Society of Chemistry',
  },
  {
    name: 'Oceanography',
    description: 'Physical, chemical and biological ocean science for research and marine monitoring.',
    professionalBody: 'Challenger Society for Marine Science',
  },
  {
    name: 'Meteorology',
    description: 'Atmospheric science and weather prediction for research, forecasting and climate services.',
    professionalBody: 'Royal Meteorological Society (RMetS)',
  },
  {
    name: 'Climate Science',
    description: 'Climate system science, modelling and climate-change research for policy and science.',
    professionalBody: 'Royal Meteorological Society / Royal Society',
  },
  {
    name: 'Hydrology',
    description: 'Science of water cycles, catchments and water resources for research and environmental practice.',
    professionalBody: 'British Hydrological Society / CIWEM',
  },
  {
    name: 'Soil Science',
    description: 'Soil properties, fertility and land management for agriculture, environment and research.',
    professionalBody: 'British Society of Soil Science',
  },
  {
    name: 'Conservation Science',
    description: 'Evidence-based conservation of species and habitats across research and applied practice.',
    professionalBody: 'CIEEM / British Ecological Society',
  },
  // Research & Scientific Operations
  {
    name: 'Laboratory Science',
    description: 'Cross-cutting laboratory practice, methods and scientific support across disciplines.',
    professionalBody: 'Institute of Science & Technology (IST) / Royal Society of Biology',
  },
  {
    name: 'Scientific Research',
    description: 'General scientific research careers spanning research assistant to principal investigator pathways.',
    professionalBody: 'UK Research and Innovation (UKRI) context / Learned societies',
  },
  {
    name: 'Research Management',
    description: 'Management of research funding, governance, projects and research operations.',
    professionalBody: 'Association of Research Managers and Administrators (ARMA)',
  },
  {
    name: 'Science Policy',
    description: 'Science advice, policy analysis and evidence for government, NGOs and learned societies.',
    professionalBody: 'Campaign for Science and Engineering / Learned societies',
  },
  {
    name: 'Science Communication',
    description: 'Public engagement, science media and outreach translating science for wider audiences.',
    professionalBody: 'British Science Association / ABSW',
  },
  {
    name: 'Scientific Publishing',
    description: 'Editorial, peer-review and publishing careers in scientific journals and STEM publishing.',
    professionalBody: 'ALPSP / Society publishers',
  },
  {
    name: 'Laboratory Management',
    description: 'Leadership of laboratory operations, facilities, safety and service delivery.',
    professionalBody: 'Institute of Science & Technology (IST)',
  },
  {
    name: 'Scientific Quality and Compliance',
    description: 'QA, GLP/GMP compliance, audit and regulatory quality in scientific organisations.',
    professionalBody: 'RQA / MHRA context (where applicable)',
  },
]

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureNaturalSciencesStageModel(supabase)

  const fieldSlug = normalizeSlug(undefined, 'Natural Sciences & Research')
  if (!fieldSlug) throw new Error('Invalid field slug')

  let fieldId: string
  let fieldCreated = false

  const { data: existingField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .or(`slug.eq.${fieldSlug},name.ilike.Natural Sciences & Research`)
    .maybeSingle()

  if (existingField?.id) {
    fieldId = existingField.id
    console.log(`Field already exists: ${existingField.name} (${existingField.slug})`)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_fields')
      .insert({
        name: 'Natural Sciences & Research',
        slug: fieldSlug,
        description:
          'Natural sciences and research careers spanning laboratory, field, environmental, mathematical and scientific operations pathways. Supports technical/apprenticeship, graduate, specialist, leadership and academic/research routes. Master’s/PhD affect research eligibility — not automatic seniority. Distinct from Engineering, IT & Technology, and Healthcare & Medicine.',
        status: 'draft',
        active: true,
        sort_order: 40,
      })
      .select('id, name, slug')
      .single()
    if (error || !created) throw new Error(error?.message ?? 'Failed to create field')
    fieldId = created.id
    fieldCreated = true
    console.log(`Created field: ${created.name} (${created.slug})`)
  }

  const { data: existingSpecialisms } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug')
    .eq('field_id', fieldId)

  const existingBySlug = new Set((existingSpecialisms ?? []).map((s) => s.slug))
  const existingByName = new Set(
    (existingSpecialisms ?? []).map((s) => s.name.trim().toLowerCase())
  )

  let createdCount = 0
  let skipped = 0

  for (let i = 0; i < SPECIALISMS.length; i++) {
    const item = SPECIALISMS[i]
    const slug = normalizeSlug(undefined, item.name)
    if (!slug) {
      skipped += 1
      continue
    }
    if (existingBySlug.has(slug) || existingByName.has(item.name.trim().toLowerCase())) {
      await supabase
        .from('career_library_specialisms')
        .update({
          stage_model_id: modelId,
          professional_body: item.professionalBody,
          regulated_profession: item.regulatedProfession ?? false,
          status: 'draft',
        })
        .eq('field_id', fieldId)
        .eq('slug', slug)
      skipped += 1
      continue
    }

    const { error } = await supabase.from('career_library_specialisms').insert({
      field_id: fieldId,
      name: item.name,
      slug,
      description: item.description,
      stage_model_id: modelId,
      regulated_profession: item.regulatedProfession ?? false,
      professional_body: item.professionalBody,
      status: 'draft',
      active: true,
      sort_order: (i + 1) * 10,
    })

    if (error) {
      if (error.code === '23505') {
        skipped += 1
        continue
      }
      throw new Error(`${item.name}: ${error.message}`)
    }
    createdCount += 1
    existingBySlug.add(slug)
  }

  console.log('\n=== Natural Sciences & Research foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: natural_sciences_research (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total specialisms defined: ${SPECIALISMS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
