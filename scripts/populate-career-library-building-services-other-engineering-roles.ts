/**
 * Populate Career Knowledge Library roles for TWO specialisms in one run:
 *   1) Building Services Engineering
 *   2) Other Engineering (fallback / multidisciplinary)
 *
 * Each specialism: ~30 draft roles (Degree / Master’s / PhD).
 * Titles unique across packs and skip exact overlaps with completed specialisms.
 *
 *   npx tsx scripts/populate-career-library-building-services-other-engineering-roles.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { normalizeSlug } from '../lib/admin/career-library/guards'
import type {
  CareerLibraryAcademicRequirement,
  CareerLibraryFitClassification,
  CareerLibraryRegistrationRequirement,
  CareerLibraryRoleCategory,
  CareerLibrarySeniorityLevel,
} from '../lib/admin/career-library/types'

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

type StageKey = 'degree' | 'masters' | 'phd'

type RoleSeed = {
  name: string
  description: string
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

type SpecialismPack = {
  slug: string
  label: string
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  siblingSlugs: string[]
  degree: RoleSeed[]
  masters: RoleSeed[]
  phd: RoleSeed[]
}

function role(
  partial: Omit<
    RoleSeed,
    | 'professionalRegistrationRequirement'
    | 'professionalMembershipRequirement'
    | 'isResearchRole'
    | 'isAcademicRole'
    | 'isRegulatedOrRestricted'
  > &
    Partial<
      Pick<
        RoleSeed,
        | 'professionalRegistrationRequirement'
        | 'professionalMembershipRequirement'
        | 'isResearchRole'
        | 'isAcademicRole'
        | 'isRegulatedOrRestricted'
      >
    >
): RoleSeed {
  return {
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    ...partial,
  }
}

// ---------------------------------------------------------------------------
// 1) Building Services Engineering — CIBSE
// ---------------------------------------------------------------------------
const BUILDING_SERVICES: SpecialismPack = {
  slug: 'building-services-engineering',
  label: 'Building Services Engineering',
  professionalBody: 'Chartered Institution of Building Services Engineers (CIBSE)',
  relatedBodies: ['Engineering Council', 'IET', 'IMechE'],
  sources: [
    'national_careers_service_building_services_engineer',
    'prospects_building_services_engineer',
    'cibse_careers_pathway',
    'engineering_council_ceng_pathway',
  ],
  siblingSlugs: [
    'mechanical-engineering',
    'electrical-engineering',
    'fire-engineering',
    'architecture',
    'structural-engineering',
    'civil-engineering',
    'environmental-engineering',
    'mechatronics',
    'renewable-energy-engineering',
  ],
  degree: [
    role({
      name: 'Graduate Building Services Engineer',
      description:
        'Entry UK role supporting HVAC, electrical, public health and MEP design for buildings toward CIBSE professional development.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior industry experience required',
      academicRequirement: 'accredited_degree_preferred',
      eligibilityNote:
        'Immediate graduate-entry building services pathway. Not Mechanical machine design or Electrical power distribution roles.',
      fitClassification: 'immediate',
      priority: 10,
    }),
    role({
      name: 'HVAC Engineer (Building Services) — Graduate',
      description:
        'Supports heating, ventilation and air-conditioning design, load calculations and system layouts for UK building projects under senior HVAC engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via building services or MEP contractor graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'HVAC within Building Services — not Mechanical "HVAC / Building Services Mechanical Engineer" or general industrial HVAC roles.',
      fitClassification: 'immediate',
      priority: 20,
    }),
    role({
      name: 'Mechanical Building Services Engineer (Graduate)',
      description:
        'Supports mechanical building services including pipework, plant selection and distribution systems for UK commercial and residential projects.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via building services consultancies or MEP contractor graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Mechanical building services focus — not general Mechanical Engineering machine or manufacturing roles.',
      fitClassification: 'immediate',
      priority: 30,
    }),
    role({
      name: 'Electrical Building Services Engineer (Graduate)',
      description:
        'Supports electrical building services including power distribution, lighting and small power design for UK building projects under senior engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via building services consultancies or MEP contractor graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Electrical building services focus — not general Electrical Engineering grid or substation roles.',
      fitClassification: 'immediate',
      priority: 40,
    }),
    role({
      name: 'Public Health Engineer (Building Services) — Graduate',
      description:
        'Supports drainage, water supply, sanitary and above-ground plumbing design for UK building projects under senior public health engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via building services consultancies or MEP contractor graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Public health engineering within Building Services — not Civil water infrastructure or Mechanical process piping roles.',
      fitClassification: 'immediate',
      priority: 50,
    }),
    role({
      name: 'Building Services Design Engineer (Graduate)',
      description:
        'Supports integrated MEP design coordination, calculations and drawing packages for UK building projects under senior design engineers.',
      roleCategory: 'design',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via building services consultancies or design-and-build graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Building services design focus — not Architecture spatial design or Structural engineering roles.',
      fitClassification: 'immediate',
      priority: 60,
    }),
    role({
      name: 'Commissioning Engineer (Building Services) — Graduate',
      description:
        'Supports pre-commissioning checks, testing and handover documentation for HVAC, electrical and public health systems on UK building projects.',
      roleCategory: 'site_delivery',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via MEP contractors or commissioning specialist graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Building services commissioning pathway. Site competence and sign-off authority are later goals — academic level ≠ commissioning authority.',
      fitClassification: 'immediate',
      priority: 70,
    }),
    role({
      name: 'Building Automation / Controls Engineer (Graduate)',
      description:
        'Supports BMS, controls logic and building automation system design and configuration for UK smart building projects under senior controls engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via building services or controls specialist graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Building automation within Building Services — not Electronic embedded systems or Mechatronics robotics roles.',
      fitClassification: 'immediate',
      priority: 80,
    }),
    role({
      name: 'MEP Engineer (Graduate)',
      description:
        'Supports multidisciplinary mechanical, electrical and plumbing coordination for UK building projects under senior MEP engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via MEP consultancies or contractor graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'MEP coordination within Building Services — not Civil infrastructure or Industrial plant engineering roles.',
      fitClassification: 'immediate',
      priority: 90,
    }),
    role({
      name: 'Building Services Engineering Technician / EngTech pathway',
      description:
        'Provides technical support in MEP installation, testing or site operations; may align with EngTech development via CIBSE.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior experience required; EngTech/IEng pathway available',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate technical pathway. Professional registration and design sign-off are later goals, not entry gates.',
      fitClassification: 'immediate',
      priority: 100,
    }),
  ],
  masters: [
    role({
      name: 'Building Services Design Engineer',
      description:
        'Leads integrated MEP design packages, coordination and technical quality for UK commercial, residential and institutional building projects.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years building services design experience; MSc often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Master’s-relevant building services design role. Not Architecture or Structural design roles.',
      fitClassification: 'realistic_next',
      priority: 10,
    }),
    role({
      name: 'Low Carbon Building Design Engineer',
      description:
        'Designs low-carbon HVAC, heat networks and energy-efficient building services systems for UK net-zero and sustainability programmes.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years low-carbon building design experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Low-carbon building services focus — general Renewable Energy generation roles sit in sibling specialism.',
      fitClassification: 'realistic_next',
      priority: 20,
    }),
    role({
      name: 'Energy Modelling Engineer (Buildings)',
      description:
        'Develops building energy models, dynamic simulation and compliance calculations for UK Part L, BREEAM and net-zero assessments.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years building energy modelling experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Building energy modelling within Building Services — not Environmental policy or general data science roles.',
      fitClassification: 'realistic_next',
      priority: 30,
    }),
    role({
      name: 'Building Performance Engineer',
      description:
        'Analyses building performance, post-occupancy evaluation and operational energy use for UK building portfolios and retrofit programmes.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years building performance engineering experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Building performance focus within Building Services — not general Environmental sustainability consultancy roles.',
      fitClassification: 'realistic_next',
      priority: 40,
    }),
    role({
      name: 'Smart Buildings Engineer',
      description:
        'Integrates BMS, IoT sensors, data analytics and smart building platforms for UK commercial and institutional building programmes.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years smart buildings or building automation experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Smart buildings within Building Services — not Electronic software or Mechatronics robotics roles.',
      fitClassification: 'realistic_next',
      priority: 50,
    }),
    role({
      name: 'Facilities Engineer (Building Services)',
      description:
        'Manages building services operations, maintenance strategy and technical compliance for UK commercial and institutional estates.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years facilities or building services operations experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Facilities engineering within Building Services — not general Industrial maintenance or property management roles.',
      fitClassification: 'realistic_next',
      priority: 60,
    }),
    role({
      name: 'Sustainable Building Systems Engineer',
      description:
        'Designs and optimises sustainable HVAC, heat recovery and renewable integration systems for UK low-carbon building projects.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years sustainable building systems experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Sustainable building systems within Building Services — Renewable Energy generation design sits in sibling specialism.',
      fitClassification: 'realistic_next',
      priority: 70,
    }),
    role({
      name: 'Digital Building Services Engineer',
      description:
        'Leads digital design workflows, BIM coordination and data-driven MEP delivery for UK building projects and frameworks.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years digital building services or BIM experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Digital building services focus — not Architecture BIM management or Civil infrastructure digital roles.',
      fitClassification: 'realistic_next',
      priority: 80,
    }),
    role({
      name: 'Fire Systems Integration Engineer (Building Services)',
      description:
        'Integrates fire detection, alarm and suppression interfaces within MEP packages for UK building projects — MEP coordination only, not fire strategy.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years MEP fire systems integration experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'MEP fire systems integration only — fire strategy, fire safety design and detection/alarm specialist roles sit under Fire Engineering.',
      fitClassification: 'realistic_next',
      priority: 90,
    }),
    role({
      name: 'Senior Building Services Engineer',
      description:
        'Leads complex building services packages, mentors juniors and assures technical quality across HVAC, electrical and public health domains.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'senior',
      minimumExperienceYears: 6,
      experienceRequirementLabel: 'Typically 6+ years building services engineering experience; CEng commonly expected',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Seniority requires significant building services experience. Master’s alone is not Senior status.',
      fitClassification: 'future_progression',
      priority: 100,
    }),
  ],
  phd: [
    role({
      name: 'Research Associate / Postdoctoral Researcher (Building Services Engineering)',
      description:
        'Conducts postdoctoral research in building energy, HVAC, indoor environmental quality or smart buildings in UK universities or research centres.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD (or near completion) in building services engineering or closely related field',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Academic/research fit. A PhD is not automatic industry Senior Building Services Engineer seniority.',
      fitClassification: 'academic_or_research',
      priority: 10,
    }),
    role({
      name: 'University Lecturer / Assistant Professor (Building Services Engineering)',
      description:
        'Delivers teaching and research in building services engineering programmes within UK higher education.',
      roleCategory: 'academic',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD typically required; teaching/research track record expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      isAcademicRole: true,
      eligibilityNote:
        'Academic pathway. Not an industry chartered-engineer or design sign-off substitute.',
      fitClassification: 'academic_or_research',
      priority: 20,
    }),
    role({
      name: 'Building Performance / Energy Modelling Research Specialist',
      description:
        'Advances research on building energy simulation, performance gap and operational optimisation for UK academic and industry programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with building performance or energy modelling research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Building performance research within Building Services — general Environmental research sits in sibling specialism.',
      fitClassification: 'academic_or_research',
      priority: 30,
    }),
    role({
      name: 'Low Carbon Building Systems Research Specialist',
      description:
        'Researches low-carbon HVAC, heat networks and net-zero building technologies for UK academic and industry research programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with low-carbon building systems research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Low-carbon building systems research — Renewable Energy generation research sits in sibling specialism.',
      fitClassification: 'academic_or_research',
      priority: 40,
    }),
    role({
      name: 'Smart Buildings / Building Automation Research Specialist',
      description:
        'Researches smart building platforms, BMS analytics and building automation technologies for UK academic and industry programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with smart buildings or building automation research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Smart buildings research within Building Services — not Electronic or Mechatronics research.',
      fitClassification: 'academic_or_research',
      priority: 50,
    }),
    role({
      name: 'Indoor Environmental Quality Research Specialist',
      description:
        'Researches indoor air quality, thermal comfort and occupant wellbeing for UK building services academic and industry programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with indoor environmental quality research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Indoor environmental quality research within Building Services.',
      fitClassification: 'academic_or_research',
      priority: 60,
    }),
    role({
      name: 'Innovation / Building Services R&D Engineer',
      description:
        'Leads applied R&D for novel HVAC, smart building or low-carbon building services technologies in UK industry or research organisations.',
      roleCategory: 'research',
      seniorityLevel: 'senior',
      minimumExperienceYears: 5,
      experienceRequirementLabel: 'Typically 5+ years R&D or advanced building services delivery; PhD often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Industry R&D progression needs delivery experience beyond the PhD award itself.',
      fitClassification: 'future_progression',
      priority: 70,
    }),
    role({
      name: 'Principal / Specialist Building Services Consultant',
      description:
        'Provides expert advisory on MEP design, building performance, compliance and disputes for UK clients in construction, facilities and legal sectors.',
      roleCategory: 'consultancy',
      seniorityLevel: 'principal',
      minimumExperienceYears: 10,
      experienceRequirementLabel: 'Typically 10+ years building services delivery; deep domain expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote:
        'Principal consultancy needs track record beyond doctoral study. CEng via CIBSE commonly expected.',
      fitClassification: 'future_progression',
      priority: 80,
    }),
    role({
      name: 'Technical Authority / Expert Witness (Building Services Engineering)',
      description:
        'Sets building services engineering technical standards and may provide expert evidence on MEP failures, compliance disputes or legal proceedings in UK courts.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 12,
      experienceRequirementLabel: 'Typically 12+ years building services engineering leadership and specialist expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isRegulatedOrRestricted: true,
      eligibilityNote:
        'Technical authority/expert witness roles need substantial experience. Academic level ≠ design sign-off authority or expert witness appointment.',
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Research & Innovation Manager (Building Services Systems)',
      description:
        'Manages research portfolios and innovation programmes spanning HVAC, energy modelling, smart buildings and indoor environmental quality systems.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years research/innovation leadership in building services systems',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Management of research programmes needs leadership experience beyond the PhD award itself.',
      fitClassification: 'future_progression',
      priority: 100,
    }),
  ],
}

// ---------------------------------------------------------------------------
// 2) Other Engineering — Engineering Council (fallback / multidisciplinary)
// ---------------------------------------------------------------------------
const OTHER_FALLBACK_NOTE =
  'Fallback specialism; if role fits another engineering specialism, that specialism takes precedence.'

const OTHER: SpecialismPack = {
  slug: 'other-engineering',
  label: 'Other Engineering',
  professionalBody: 'Engineering Council',
  relatedBodies: ['IET', 'IMechE', 'ICE'],
  sources: [
    'engineering_council_professional_registration',
    'multidisciplinary_engineering_uk_context',
  ],
  siblingSlugs: [
    'mechanical-engineering',
    'electrical-engineering',
    'electronic-engineering',
    'civil-engineering',
    'chemical-engineering',
    'industrial-engineering',
    'aerospace-engineering',
    'automotive-engineering',
    'environmental-engineering',
    'biomedical-engineering',
    'materials-engineering',
    'mechatronics',
    'petroleum-engineering',
    'nuclear-engineering',
    'marine-engineering',
    'naval-architecture',
    'renewable-energy-engineering',
    'building-services-engineering',
    'fire-engineering',
    'mining-engineering',
    'railway-engineering',
    'structural-engineering',
    'geotechnical-engineering',
    'water-engineering',
    'architecture',
  ],
  degree: [
    role({
      name: 'Graduate Multidisciplinary Engineer',
      description:
        'Entry UK role supporting cross-disciplinary engineering projects where no single specialism dominates, toward Engineering Council professional development.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior industry experience required',
      academicRequirement: 'accredited_degree_preferred',
      eligibilityNote: `Immediate graduate-entry multidisciplinary pathway. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 10,
    }),
    role({
      name: 'Systems Engineer (General / Cross-Disciplinary) — Graduate',
      description:
        'Supports systems integration, requirements analysis and cross-domain coordination for UK engineering programmes spanning multiple disciplines.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via multidisciplinary engineering or consultancy graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `General cross-disciplinary systems support. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 20,
    }),
    role({
      name: 'Engineering Innovation Graduate',
      description:
        'Supports innovation labs, proof-of-concept development and emerging technology pilots for UK engineering organisations with no dominant specialism.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via innovation, R&D or multidisciplinary graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `Innovation graduate pathway for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 30,
    }),
    role({
      name: 'Interdisciplinary Design Engineer (Graduate)',
      description:
        'Supports design work spanning multiple engineering domains for UK projects where integrated cross-disciplinary design is the primary focus.',
      roleCategory: 'design',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via multidisciplinary design or consultancy graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `Interdisciplinary design support only. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 40,
    }),
    role({
      name: 'Emerging Technology Engineer (Graduate)',
      description:
        'Supports evaluation, prototyping and early adoption of emerging technologies for UK engineering organisations without a dominant sector specialism.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via innovation, technology or multidisciplinary graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `Emerging technology support for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 50,
    }),
    role({
      name: 'General Engineering Project Support Engineer (Graduate)',
      description:
        'Provides technical and project support across multiple engineering domains for UK programmes where no single specialism applies.',
      roleCategory: 'project_management',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via general engineering or consultancy graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `General project support pathway. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 60,
    }),
    role({
      name: 'Engineering Consultancy Analyst (Graduate)',
      description:
        'Supports multidisciplinary engineering consultancy analysis, benchmarking and advisory work for UK clients across sectors.',
      roleCategory: 'consultancy',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via general engineering consultancy graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `General consultancy analyst pathway. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 70,
    }),
    role({
      name: 'Technology Integration Engineer (Cross-Disciplinary) — Graduate',
      description:
        'Supports integration of technologies across engineering domains for UK programmes where cross-disciplinary integration is the primary remit.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via technology integration or multidisciplinary graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `Cross-disciplinary technology integration only. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 80,
    }),
    role({
      name: 'Engineering Operations Generalist (Graduate)',
      description:
        'Supports operational engineering activities spanning multiple domains for UK organisations without a dominant sector specialism.',
      roleCategory: 'site_delivery',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via general engineering operations graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `Operations generalist pathway. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 90,
    }),
    role({
      name: 'Multidisciplinary Engineering Technician / EngTech pathway',
      description:
        'Provides technical support across multiple engineering domains; may align with EngTech development via Engineering Council licensed institutions.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior experience required; EngTech/IEng pathway available',
      academicRequirement: 'degree_relevant',
      eligibilityNote: `Immediate technical pathway for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'immediate',
      priority: 100,
    }),
  ],
  masters: [
    role({
      name: 'Systems Engineer (Cross-Disciplinary)',
      description:
        'Integrates requirements, interfaces and verification across multiple engineering domains for UK complex programmes without a dominant specialism.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years cross-disciplinary systems engineering experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Cross-disciplinary systems engineering. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 10,
    }),
    role({
      name: 'Engineering Innovation Engineer',
      description:
        'Leads innovation projects, technology scouting and proof-of-concept delivery for UK engineering organisations spanning multiple domains.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years engineering innovation experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Innovation engineering for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 20,
    }),
    role({
      name: 'Interdisciplinary Systems Design Engineer',
      description:
        'Designs integrated systems spanning multiple engineering domains for UK programmes where cross-disciplinary design is the primary remit.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years interdisciplinary systems design experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Interdisciplinary systems design only. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 30,
    }),
    role({
      name: 'Emerging Technology Systems Engineer',
      description:
        'Develops and integrates emerging technology systems for UK engineering programmes where no single sector specialism dominates.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years emerging technology systems experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Emerging technology systems for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 40,
    }),
    role({
      name: 'Engineering Consultancy Engineer (General Practice)',
      description:
        'Delivers multidisciplinary engineering consultancy across sectors for UK clients where no single specialism applies.',
      roleCategory: 'consultancy',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years general engineering consultancy experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `General practice consultancy only. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 50,
    }),
    role({
      name: 'Complex Systems Integration Engineer (Cross-Disciplinary)',
      description:
        'Integrates complex subsystems across engineering domains for UK major programmes where cross-disciplinary integration is the primary focus.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years complex systems integration experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Cross-disciplinary complex systems integration. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 60,
    }),
    role({
      name: 'Engineering Transformation / Change Engineer',
      description:
        'Leads engineering transformation, digital change and process improvement programmes spanning multiple domains for UK organisations.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years engineering transformation or change experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Engineering transformation for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 70,
    }),
    role({
      name: 'General Practice Professional Engineer (Cross-Sector)',
      description:
        'Practices professional engineering across sectors and domains for UK clients where no single specialism is the primary fit.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years cross-sector professional engineering experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Cross-sector general practice only. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'realistic_next',
      priority: 80,
    }),
    role({
      name: 'Senior Multidisciplinary Engineer',
      description:
        'Leads complex multidisciplinary engineering packages, mentors juniors and assures technical quality across cross-disciplinary domains.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'senior',
      minimumExperienceYears: 6,
      experienceRequirementLabel: 'Typically 6+ years multidisciplinary engineering experience; CEng commonly expected',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Seniority requires significant cross-disciplinary experience. Master’s alone is not Senior status. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Lead Systems Engineer (Cross-Disciplinary)',
      description:
        'Leads systems engineering teams and assurance across multiple engineering domains for UK complex programmes without a dominant specialism.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'senior',
      minimumExperienceYears: 6,
      experienceRequirementLabel: 'Typically 6+ years cross-disciplinary systems engineering experience; CEng commonly expected',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote: `Lead systems roles need substantial delivery experience. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'future_progression',
      priority: 100,
    }),
  ],
  phd: [
    role({
      name: 'Research Associate / Postdoctoral Researcher (Multidisciplinary Engineering)',
      description:
        'Conducts postdoctoral research spanning multiple engineering domains in UK universities or research centres where no single specialism dominates.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD (or near completion) in multidisciplinary or general engineering',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote: `Academic/research fit for cross-disciplinary research. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'academic_or_research',
      priority: 10,
    }),
    role({
      name: 'University Lecturer / Assistant Professor (General / Systems Engineering)',
      description:
        'Delivers teaching and research in general or systems engineering programmes within UK higher education spanning multiple domains.',
      roleCategory: 'academic',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD typically required; teaching/research track record expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      isAcademicRole: true,
      eligibilityNote: `Academic pathway for general/systems engineering. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'academic_or_research',
      priority: 20,
    }),
    role({
      name: 'Complex Systems Engineering Research Specialist',
      description:
        'Advances research on complex systems integration, modelling and verification across engineering domains for UK academic programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with complex systems engineering research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote: `Complex systems research for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'academic_or_research',
      priority: 30,
    }),
    role({
      name: 'Emerging Technology Engineering Research Specialist',
      description:
        'Researches emerging technologies and their engineering applications across domains for UK academic and industry programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with emerging technology engineering research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote: `Emerging technology research for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'academic_or_research',
      priority: 40,
    }),
    role({
      name: 'Interdisciplinary Engineering Design Research Specialist',
      description:
        'Researches interdisciplinary design methods, integration frameworks and cross-domain engineering for UK academic programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with interdisciplinary engineering design research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote: `Interdisciplinary design research only. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'academic_or_research',
      priority: 50,
    }),
    role({
      name: 'Engineering Innovation Research Specialist',
      description:
        'Researches engineering innovation processes, technology adoption and cross-domain R&D for UK academic and industry programmes.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with engineering innovation research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote: `Innovation research for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'academic_or_research',
      priority: 60,
    }),
    role({
      name: 'Innovation / Cross-Disciplinary R&D Engineer',
      description:
        'Leads applied R&D spanning multiple engineering domains for UK industry or research organisations without a dominant sector specialism.',
      roleCategory: 'research',
      seniorityLevel: 'senior',
      minimumExperienceYears: 5,
      experienceRequirementLabel: 'Typically 5+ years cross-disciplinary R&D or advanced delivery; PhD often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote: `Industry R&D progression needs delivery experience beyond the PhD award itself. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'future_progression',
      priority: 70,
    }),
    role({
      name: 'Principal / Specialist Multidisciplinary Engineering Consultant',
      description:
        'Provides expert advisory on cross-disciplinary engineering, innovation and complex systems for UK clients across sectors.',
      roleCategory: 'consultancy',
      seniorityLevel: 'principal',
      minimumExperienceYears: 10,
      experienceRequirementLabel: 'Typically 10+ years multidisciplinary engineering delivery; deep domain expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote: `Principal consultancy for roles not fitting a standard specialism. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'future_progression',
      priority: 80,
    }),
    role({
      name: 'Technical Authority (Cross-Disciplinary Engineering)',
      description:
        'Sets cross-disciplinary engineering technical standards and governance for UK organisations spanning multiple engineering domains.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 12,
      experienceRequirementLabel: 'Typically 12+ years cross-disciplinary engineering leadership and specialist expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote: `Technical authority needs substantial cross-disciplinary experience. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Research & Innovation Manager (Multidisciplinary Engineering Systems)',
      description:
        'Manages research portfolios and innovation programmes spanning multiple engineering domains for UK organisations.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years research/innovation leadership in multidisciplinary engineering systems',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote: `Management of cross-disciplinary research programmes needs leadership experience beyond the PhD award itself. ${OTHER_FALLBACK_NOTE}`,
      fitClassification: 'future_progression',
      priority: 100,
    }),
  ],
}

const PACKS = [BUILDING_SERVICES, OTHER]

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
        stage_key: stage.stage_key as StageKey,
        stage_label: stage.label,
        academic_level: stage.stage_key,
        specialism_slug: pack.slug,
        country_focus: 'uk',
        professional_body_focus: pack.professionalBody,
        related_bodies: pack.relatedBodies,
        eligibility_model_version: 1,
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

async function populatePack(
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
        regulated_profession: true,
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
  const existingSlugs = new Set((existingRoles ?? []).map((r) => r.slug))
  for (const r of existingRoles ?? []) reservedNames.add(r.name.trim().toLowerCase())

  const degree = await insertRolesForStage(
    supabase,
    pack,
    specialism.id,
    stageByKey.get('degree')!,
    pack.degree,
    existingSlugs,
    reservedNames
  )
  const masters = await insertRolesForStage(
    supabase,
    pack,
    specialism.id,
    stageByKey.get('masters')!,
    pack.masters,
    existingSlugs,
    reservedNames
  )
  const phd = await insertRolesForStage(
    supabase,
    pack,
    specialism.id,
    stageByKey.get('phd')!,
    pack.phd,
    existingSlugs,
    reservedNames
  )

  const { count } = await supabase
    .from('career_library_roles')
    .select('id', { count: 'exact', head: true })
    .eq('specialism_id', specialism.id)
    .eq('status', 'draft')

  return { specialism, degree, masters, phd, draftCount: count ?? 0 }
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

  const allSeedNames = PACKS.flatMap((p) => [...p.degree, ...p.masters, ...p.phd].map((r) => r.name))
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

  const { data: model, error: modelErr } = await supabase
    .from('career_library_stage_models')
    .select('id')
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
    if (!stageByKey.has(key)) throw new Error(`Missing academic stage: ${key}`)
  }

  // Reserve titles from all other specialisms (skip overwriting / cross-duplicates)
  const packSlugs = new Set(PACKS.map((p) => p.slug))
  const { data: allSpecs } = await supabase
    .from('career_library_specialisms')
    .select('id, slug')

  const reservedNames = new Set<string>()
  for (const sib of allSpecs ?? []) {
    if (packSlugs.has(sib.slug)) continue
    const { data: roles } = await supabase
      .from('career_library_roles')
      .select('name')
      .eq('specialism_id', sib.id)
    for (const r of roles ?? []) reservedNames.add(r.name.trim().toLowerCase())
  }

  let totalCreated = 0
  let totalSameSkipped = 0
  let totalCrossSkipped = 0

  console.log('\n=== Building Services + Other Engineering roles populate ===')
  console.log('Stage model: academic_level | Status: draft | active: true\n')

  for (const pack of PACKS) {
    const result = await populatePack(supabase, pack, stageByKey, reservedNames)
    const created =
      result.degree.created.length + result.masters.created.length + result.phd.created.length
    const sameSkipped =
      result.degree.skipped.length + result.masters.skipped.length + result.phd.skipped.length
    const crossSkipped =
      result.degree.crossSkipped.length +
      result.masters.crossSkipped.length +
      result.phd.crossSkipped.length

    totalCreated += created
    totalSameSkipped += sameSkipped
    totalCrossSkipped += crossSkipped

    console.log(`--- ${result.specialism.name} (${result.specialism.slug}) ---`)
    console.log(`Created this run: ${created} | Draft total: ${result.draftCount}`)
    console.log(`Skipped same-specialism: ${sameSkipped} | Skipped title conflicts: ${crossSkipped}`)
    if (crossSkipped) {
      for (const n of [
        ...result.degree.crossSkipped,
        ...result.masters.crossSkipped,
        ...result.phd.crossSkipped,
      ]) {
        console.log(`  - skipped: ${n}`)
      }
    }
    console.log('Degree:')
    for (const n of result.degree.created) console.log(`  + ${n}`)
    console.log("Master’s:")
    for (const n of result.masters.created) console.log(`  + ${n}`)
    console.log('PhD:')
    for (const n of result.phd.created) console.log(`  + ${n}`)
    console.log('')
  }

  console.log('=== Combined totals ===')
  console.log(`Total roles created: ${totalCreated}`)
  console.log(`Duplicates skipped (same specialism): ${totalSameSkipped}`)
  console.log(`Duplicates skipped (cross-specialism / prior specialism title conflict): ${totalCrossSkipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
