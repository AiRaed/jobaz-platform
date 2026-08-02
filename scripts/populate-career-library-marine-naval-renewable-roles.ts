/**
 * Populate Career Knowledge Library roles for THREE specialisms in one run:
 *   1) Marine Engineering
 *   2) Naval Architecture
 *   3) Renewable Energy Engineering
 *
 * Each specialism: ~30 draft roles (Degree / Master's / PhD).
 * Titles unique across packs and skip exact overlaps with completed specialisms.
 *
 *   npx tsx scripts/populate-career-library-marine-naval-renewable-roles.ts
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
// 1) Marine Engineering — IMarEST
// ---------------------------------------------------------------------------
const MARINE: SpecialismPack = {
  slug: 'marine-engineering',
  label: 'Marine Engineering',
  professionalBody: 'Institute of Marine Engineering, Science and Technology (IMarEST)',
  relatedBodies: ['Engineering Council', 'Maritime and Coastguard Agency (MCA)'],
  sources: [
    'national_careers_service_marine_engineer',
    'national_careers_service_merchant_navy_engineering_officer',
    'imarest_professional_registration',
    'engineering_council_ceng_pathway',
  ],
  siblingSlugs: [
    'naval-architecture',
    'renewable-energy-engineering',
    'mechanical-engineering',
    'electrical-engineering',
    'petroleum-engineering',
    'aerospace-engineering',
    'mechatronics',
  ],
  degree: [
    role({
      name: 'Graduate Marine Engineer',
      description:
        'Entry UK role supporting ship machinery, propulsion or marine systems engineering in shipyards, operators or consultancies toward IMarEST professional development.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior industry experience required',
      academicRequirement: 'accredited_degree_preferred',
      eligibilityNote:
        'Immediate graduate-entry marine engineering pathway. IMarEST CEng/IEng is a later goal. Hull form/stability design sits under Naval Architecture.',
      fitClassification: 'immediate',
      priority: 10,
    }),
    role({
      name: 'Marine Propulsion Engineer (Graduate)',
      description:
        'Supports marine diesel, gas turbine, hybrid or electric propulsion system design, testing and maintenance planning under senior marine engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via graduate schemes; placement helpful',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate propulsion machinery pathway — not Aerospace gas turbine airframe roles.',
      fitClassification: 'immediate',
      priority: 20,
    }),
    role({
      name: 'Marine Electrical / Auxiliary Systems Engineer (Graduate)',
      description:
        'Supports shipboard electrical distribution, generators, HVAC and auxiliary machinery interfaces under senior marine systems engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via graduate schemes in marine electrical/auxiliaries',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Shipboard electrical/auxiliaries focus — not Electrical grid/substation power systems design.',
      fitClassification: 'immediate',
      priority: 30,
    }),
    role({
      name: 'Junior Shipboard / Cadet Marine Engineer',
      description:
        'Supports watchkeeping and machinery spaces as a junior/cadet engineer, often progressing toward MCA Certificate of Competency routes.',
      roleCategory: 'site_delivery',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Cadetship or junior sea-going pathway; medical/sea-going standards apply',
      academicRequirement: 'degree_relevant',
      isRegulatedOrRestricted: true,
      eligibilityNote:
        'Immediate sea-going support pathway. MCA CoC requirements are separate from academic stage and IMarEST registration.',
      fitClassification: 'immediate',
      priority: 40,
    }),
    role({
      name: 'Vessel Maintenance Engineer (Graduate)',
      description:
        'Supports planned maintenance, defect rectification and dry-dock work packages for vessel machinery and systems.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via operators, shipyards or technical management companies',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate vessel maintenance engineering — not Naval Architecture retrofit hull design.',
      fitClassification: 'immediate',
      priority: 50,
    }),
    role({
      name: 'Marine Systems Engineer (Graduate)',
      description:
        'Supports integration and troubleshooting of marine mechanical, fluid and control systems on commercial or offshore vessels.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior industry experience required on graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Marine systems machinery focus — distinct from Mechatronics factory automation titles.',
      fitClassification: 'immediate',
      priority: 60,
    }),
    role({
      name: 'Offshore Vessel Marine Engineer (Graduate)',
      description:
        'Supports engineering of offshore support, wind-farm service or construction vessels’ machinery and marine systems.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via offshore vessel operators or OEMs; offshore training often required',
      academicRequirement: 'degree_relevant',
      isRegulatedOrRestricted: true,
      eligibilityNote:
        'Offshore vessel engineering — not Renewable Energy turbine/project engineering; not Petroleum drilling roles.',
      fitClassification: 'immediate',
      priority: 70,
    }),
    role({
      name: 'Marine Reliability Engineer (Junior)',
      description:
        'Supports reliability, condition monitoring and failure analysis for ship machinery and marine power plant under senior reliability leads.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 1,
      experienceRequirementLabel: 'Typically 1–3 years marine machinery or maintenance experience',
      professionalRegistrationRequirement: 'desirable',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Realistic next after graduate marine machinery exposure.',
      fitClassification: 'realistic_next',
      priority: 80,
    }),
    role({
      name: 'Assistant Marine Survey / Inspection Engineer',
      description:
        'Supports engineering surveys and inspections of machinery spaces, systems condition and repair scopes under senior marine surveyors/engineers.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 1,
      experienceRequirementLabel: 'Typically 1–2 years marine engineering support experience',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Engineering survey/inspection support — classification hull survey assurance may sit closer to Naval Architecture technical assurance.',
      fitClassification: 'realistic_next',
      priority: 90,
    }),
    role({
      name: 'Marine Engineering Technician / EngTech pathway',
      description:
        'Provides workshop, fitting or systems technical support; may align with EngTech development via IMarEST.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior experience required; EngTech/IEng pathway available',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate technical pathway. Professional registration is a later goal, not an entry gate.',
      fitClassification: 'immediate',
      priority: 100,
    }),
  ],
  masters: [
    role({
      name: 'Marine Propulsion Systems Engineer',
      description:
        'Designs, specifies and commissions marine propulsion plants including hybrid/electric and alternative-fuel machinery packages.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years marine propulsion experience; MSc often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Master’s-relevant specialist role. Academic stage alone is not automatic seniority.',
      fitClassification: 'realistic_next',
      priority: 10,
    }),
    role({
      name: 'Marine Power Systems Engineer',
      description:
        'Engineers shipboard power generation, distribution and energy management for conventional and hybrid vessels.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years marine power systems experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Shipboard marine power — not Electrical transmission/substation design.',
      fitClassification: 'realistic_next',
      priority: 20,
    }),
    role({
      name: 'Marine Systems Integration Engineer',
      description:
        'Integrates propulsion, auxiliaries, controls and safety systems into coherent vessel machinery arrangements.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–7 years marine systems experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Machinery systems integration — hull arrangement/stability remains Naval Architecture.',
      fitClassification: 'realistic_next',
      priority: 30,
    }),
    role({
      name: 'Marine Decarbonisation / Alternative Fuels Engineer',
      description:
        'Develops machinery and systems solutions for methanol, ammonia, LNG, battery-hybrid and other low-carbon marine fuels.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–7 years marine machinery/energy systems experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'desirable',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Marine fuels/machinery decarbonisation — not Renewable Energy wind/solar project engineering.',
      fitClassification: 'realistic_next',
      priority: 40,
    }),
    role({
      name: 'Marine Operations Support Engineer',
      description:
        'Provides shore-side engineering support to fleets covering defects, dry-dock specs, spare strategies and performance issues.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years sea-going or shore marine engineering experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Operations support needs demonstrated marine machinery experience beyond postgraduate study.',
      fitClassification: 'realistic_next',
      priority: 50,
    }),
    role({
      name: 'Marine Reliability / Condition Monitoring Engineer',
      description:
        'Leads reliability engineering, vibration/oil analysis programmes and maintenance optimisation for vessel machinery.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years marine reliability/maintenance experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Experience-led reliability ownership. Master’s alone is not mid-level seniority.',
      fitClassification: 'realistic_next',
      priority: 60,
    }),
    role({
      name: 'Marine Engineering Surveyor (Machinery)',
      description:
        'Surveys and assesses ship machinery and systems for class, flag or owner assurance, recommending repairs and compliance actions.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 4,
      experienceRequirementLabel: 'Typically 4–8 years marine engineering experience; survey training required',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      isRegulatedOrRestricted: true,
      eligibilityNote:
        'Machinery survey focus — hull/structure class assurance leans Naval Architecture technical assurance.',
      fitClassification: 'future_progression',
      priority: 70,
    }),
    role({
      name: 'Marine Technical Manager',
      description:
        'Manages technical performance of vessel machinery portfolios, dry-dock programmes and engineering budgets for an operator or manager.',
      roleCategory: 'leadership',
      seniorityLevel: 'senior',
      minimumExperienceYears: 6,
      experienceRequirementLabel: 'Typically 6+ years marine engineering; people/project leadership expected',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Senior technical management requires substantial experience. Academic stage is not automatic seniority.',
      fitClassification: 'future_progression',
      priority: 80,
    }),
    role({
      name: 'Marine Engineering Consultant',
      description:
        'Advises owners, yards and OEMs on machinery selection, upgrades, failures and marine systems engineering solutions.',
      roleCategory: 'consultancy',
      seniorityLevel: 'senior',
      minimumExperienceYears: 6,
      experienceRequirementLabel: 'Typically 6+ years marine engineering delivery experience',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Consultancy progression needs delivery track record beyond postgraduate study.',
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Lead Marine Systems Engineer',
      description:
        'Leads marine systems engineering packages, standards and multidisciplinary interfaces for major vessel or fleet programmes.',
      roleCategory: 'leadership',
      seniorityLevel: 'senior',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years marine systems leadership experience',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Leadership progression is experience-led; Master’s/PhD is not automatic Lead status.',
      fitClassification: 'future_progression',
      priority: 100,
    }),
  ],
  phd: [
    role({
      name: 'Research Associate / Postdoctoral Researcher (Marine Engineering)',
      description:
        'Conducts postdoctoral research in marine propulsion, power systems or vessel machinery in UK universities or research centres.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD (or near completion) in marine engineering or closely related field',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Academic/research fit. A PhD is not automatic industry Senior/Lead marine seniority.',
      fitClassification: 'academic_or_research',
      priority: 10,
    }),
    role({
      name: 'University Lecturer / Assistant Professor (Marine Engineering)',
      description:
        'Delivers teaching and research in marine engineering programmes within UK higher education.',
      roleCategory: 'academic',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD typically required; teaching/research track record expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      isAcademicRole: true,
      eligibilityNote:
        'Academic pathway. Not an industry chartered-engineer seniority substitute.',
      fitClassification: 'academic_or_research',
      priority: 20,
    }),
    role({
      name: 'Marine Propulsion Research Specialist',
      description:
        'Advances research on marine engines, hybrid propulsion and powertrain performance for ships and offshore vessels.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with marine propulsion research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Research specialist fit within Marine Engineering.',
      fitClassification: 'academic_or_research',
      priority: 30,
    }),
    role({
      name: 'Marine Decarbonisation Research Specialist',
      description:
        'Researches alternative marine fuels, emissions reduction and energy systems for shipping decarbonisation.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with marine fuels/decarbonisation research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Marine fuels research — not Renewable Energy wind/solar research titles.',
      fitClassification: 'academic_or_research',
      priority: 40,
    }),
    role({
      name: 'Marine Power Systems Research Specialist',
      description:
        'Researches shipboard electrical power architectures, energy management and hybrid power plant control.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with marine power systems research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Shipboard power research — not Electrical smart-grid research titles.',
      fitClassification: 'academic_or_research',
      priority: 50,
    }),
    role({
      name: 'Innovation / Marine Machinery R&D Engineer',
      description:
        'Leads applied R&D for marine engines, auxiliaries or hybrid machinery packages in industry or research organisations.',
      roleCategory: 'research',
      seniorityLevel: 'senior',
      minimumExperienceYears: 5,
      experienceRequirementLabel: 'Typically 5+ years R&D or advanced marine delivery; PhD often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Industry R&D progression needs delivery experience beyond the PhD award itself.',
      fitClassification: 'future_progression',
      priority: 60,
    }),
    role({
      name: 'Fleet Engineering / Technical Superintendent',
      description:
        'Owns technical integrity of a vessel fleet’s machinery, class compliance interfaces and major repair/upgrade programmes.',
      roleCategory: 'leadership',
      seniorityLevel: 'senior',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years marine engineering; often sea-going + shore experience',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Experience-led fleet technical leadership. PhD alone does not create superintendent seniority.',
      fitClassification: 'future_progression',
      priority: 70,
    }),
    role({
      name: 'Principal / Specialist Marine Engineering Consultant',
      description:
        'Provides expert advisory on marine machinery, propulsion, failures and complex systems for owners, yards and insurers.',
      roleCategory: 'consultancy',
      seniorityLevel: 'principal',
      minimumExperienceYears: 10,
      experienceRequirementLabel: 'Typically 10+ years marine engineering delivery; deep domain expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote:
        'Principal consultancy needs track record beyond doctoral study. CEng via IMarEST commonly expected.',
      fitClassification: 'future_progression',
      priority: 80,
    }),
    role({
      name: 'Technical Authority / Expert Witness (Marine Engineering)',
      description:
        'Sets marine engineering technical standards and may provide expert evidence on machinery failures or maritime engineering disputes.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 12,
      experienceRequirementLabel: 'Typically 12+ years marine engineering leadership and specialist expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote:
        'Leadership/expert roles require extensive experience. Academic stage alone is insufficient.',
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Research & Innovation Manager (Marine Systems)',
      description:
        'Manages research portfolios and innovation programmes spanning marine propulsion, power and shipboard systems.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years research/innovation leadership in marine systems',
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
// 2) Naval Architecture — RINA
// ---------------------------------------------------------------------------
const NAVAL: SpecialismPack = {
  slug: 'naval-architecture',
  label: 'Naval Architecture',
  professionalBody: 'Royal Institution of Naval Architects (RINA)',
  relatedBodies: ['Engineering Council', 'IMarEST'],
  sources: [
    'prospects_naval_architect',
    'rina_what_is_naval_architecture',
    'rina_professional_registration',
    'rina_career_map',
    'planit_naval_architect',
    'engineering_council_ceng_pathway',
  ],
  siblingSlugs: [
    'marine-engineering',
    'renewable-energy-engineering',
    'structural-engineering',
    'mechanical-engineering',
    'aerospace-engineering',
    'petroleum-engineering',
  ],
  degree: [
    role({
      name: 'Graduate Naval Architect',
      description:
        'Entry UK role in ship design consultancies, yards or defence programmes supporting hull, arrangement and structural design toward RINA professional development.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior industry experience required',
      academicRequirement: 'accredited_degree_preferred',
      eligibilityNote:
        'Immediate graduate-entry naval architecture pathway. RINA CEng/IEng is a later goal. Machinery systems sit under Marine Engineering.',
      fitClassification: 'immediate',
      priority: 10,
    }),
    role({
      name: 'Hull Form Design Engineer (Graduate)',
      description:
        'Supports hull form development, lines plans and basic hydrodynamic performance studies under senior naval architects.',
      roleCategory: 'design',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via graduate schemes; strong CAD/hydrostatics modules helpful',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate hull-form design pathway within Naval Architecture.',
      fitClassification: 'immediate',
      priority: 20,
    }),
    role({
      name: 'Ship Structures Engineer (Naval Architecture) — Graduate',
      description:
        'Supports scantling, global strength and local structural design for ships and marine structures under senior naval architects.',
      roleCategory: 'design',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via graduate schemes in ship structural design',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Ship structural design — not building Structural Engineering IStructE building/bridge titles.',
      fitClassification: 'immediate',
      priority: 30,
    }),
    role({
      name: 'Ship Stability Engineer (Junior)',
      description:
        'Supports intact and damage stability assessments, loading conditions and statutory stability documentation.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 1,
      experienceRequirementLabel: 'Typically 1–3 years stability/naval architecture experience',
      professionalRegistrationRequirement: 'desirable',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Realistic next after graduate naval architecture exposure.',
      fitClassification: 'realistic_next',
      priority: 40,
    }),
    role({
      name: 'Marine CAD / Modelling Engineer (Graduate)',
      description:
        'Produces 3D ship models, drawings and design documentation for hull, structure and general arrangement packages.',
      roleCategory: 'design',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via graduate schemes; marine CAD portfolio helpful',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate marine CAD/modelling pathway within Naval Architecture.',
      fitClassification: 'immediate',
      priority: 50,
    }),
    role({
      name: 'Weight Engineer (Graduate)',
      description:
        'Supports weight estimation, weight control and centre-of-gravity tracking through ship design and build stages.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via graduate schemes in ship design offices',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate weight engineering pathway — not Marine Engineering machinery design.',
      fitClassification: 'immediate',
      priority: 60,
    }),
    role({
      name: 'Yacht / Small Craft Design Engineer (Graduate)',
      description:
        'Supports design of yachts and small craft covering hull form, structure and arrangement under senior designers.',
      roleCategory: 'design',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via specialist yards or design studios; portfolio helpful',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate small-craft design pathway within Naval Architecture.',
      fitClassification: 'immediate',
      priority: 70,
    }),
    role({
      name: 'Ship Performance Engineer (Junior)',
      description:
        'Supports resistance, propulsion powering and performance prediction studies using analytical and CFD methods under senior naval architects.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 1,
      experienceRequirementLabel: 'Typically 1–3 years hydrodynamics/performance experience',
      professionalRegistrationRequirement: 'desirable',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Ship performance/hydrodynamics — propulsion machinery hardware remains Marine Engineering.',
      fitClassification: 'realistic_next',
      priority: 80,
    }),
    role({
      name: 'Floating Systems Design Support Engineer (Graduate)',
      description:
        'Supports concept design of floating offshore structures, platforms or wind floaters under senior naval architects.',
      roleCategory: 'design',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via offshore design consultancies; placement helpful',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Floating-structure design — turbine/project engineering sits under Renewable Energy; vessel machinery under Marine Engineering.',
      fitClassification: 'immediate',
      priority: 90,
    }),
    role({
      name: 'Naval Architecture Technician / EngTech pathway',
      description:
        'Provides drafting, modelling and design-support production; may align with EngTech development via RINA.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior experience required; EngTech/IEng pathway available',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate technical pathway. Professional registration is a later goal, not an entry gate.',
      fitClassification: 'immediate',
      priority: 100,
    }),
  ],
  masters: [
    role({
      name: 'Naval Architect (Hull & General Arrangement)',
      description:
        'Leads hull form and general arrangement design packages for commercial, offshore or defence vessels.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years naval architecture design experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Core naval architecture practice. Master’s alone does not confer seniority or RINA chartership.',
      fitClassification: 'realistic_next',
      priority: 10,
    }),
    role({
      name: 'Ship Structural Design Engineer (Naval)',
      description:
        'Designs primary and secondary ship structures, fatigue-critical details and classification structural submissions.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–7 years ship structural design experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Ship structures — distinct from building Structural Engineering roles.',
      fitClassification: 'realistic_next',
      priority: 20,
    }),
    role({
      name: 'Hydrodynamics / Ship Performance Engineer',
      description:
        'Delivers resistance, seakeeping and manoeuvring analyses to optimise ship performance and powering.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years hydrodynamics experience; MSc often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Performance hydrodynamics specialism within Naval Architecture.',
      fitClassification: 'realistic_next',
      priority: 30,
    }),
    role({
      name: 'Stability & Damaged Stability Engineer',
      description:
        'Leads intact/damage stability assessments, probabilistic methods and statutory documentation for vessel designs.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years stability engineering experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Stability ownership needs demonstrated project experience beyond postgraduate study.',
      fitClassification: 'realistic_next',
      priority: 40,
    }),
    role({
      name: 'Weight Engineering Lead',
      description:
        'Owns weight control strategy, weight databases and CG management across design and construction for major vessels.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 4,
      experienceRequirementLabel: 'Typically 4–8 years weight engineering experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Experience-led weight leadership. Academic stage is not automatic Lead status.',
      fitClassification: 'future_progression',
      priority: 50,
    }),
    role({
      name: 'Offshore Floating Structure Design Engineer',
      description:
        'Designs floating platforms, FOWT hulls or marine structures covering hydrostatics, structure and global performance.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–7 years floating systems / offshore naval architecture experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Floating-structure design — renewable project/turbine engineering remains Renewable Energy Engineering.',
      fitClassification: 'realistic_next',
      priority: 60,
    }),
    role({
      name: 'Submarine / Defence Vessel Design Engineer',
      description:
        'Contributes to submarine or naval surface vessel design covering structures, arrangements and performance under defence programmes.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–7 years defence naval architecture experience; clearance often required',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      isRegulatedOrRestricted: true,
      eligibilityNote:
        'Defence vessel design pathway. Security clearance may be required; machinery systems still Marine Engineering.',
      fitClassification: 'realistic_next',
      priority: 70,
    }),
    role({
      name: 'Vessel Conversion / Retrofit Design Engineer',
      description:
        'Designs conversions and retrofits including structural modifications, stability impacts and arrangement changes for existing vessels.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years ship design/conversion experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Conversion design naval architecture — machinery retrofit plant remains Marine Engineering.',
      fitClassification: 'realistic_next',
      priority: 80,
    }),
    role({
      name: 'Classification / Technical Assurance Naval Architect',
      description:
        'Provides class rule interpretation, plan approval support and technical assurance for ship design compliance.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 4,
      experienceRequirementLabel: 'Typically 4–8 years naval architecture / class experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Technical assurance for hull/structure/stability — machinery survey roles sit under Marine Engineering.',
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Senior Naval Architect',
      description:
        'Leads complex ship design packages, reviews junior work and assures multidisciplinary naval architecture quality.',
      roleCategory: 'design',
      seniorityLevel: 'senior',
      minimumExperienceYears: 6,
      experienceRequirementLabel: 'Typically 6+ years naval architecture experience; CEng commonly expected',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Seniority requires significant design delivery experience. Master’s alone is not Senior status.',
      fitClassification: 'future_progression',
      priority: 100,
    }),
  ],
  phd: [
    role({
      name: 'Research Associate / Postdoctoral Researcher (Naval Architecture)',
      description:
        'Conducts postdoctoral research in ship design, hydrodynamics or marine structures in UK universities or research centres.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD (or near completion) in naval architecture or closely related field',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Academic/research fit. A PhD is not automatic industry Senior Naval Architect seniority.',
      fitClassification: 'academic_or_research',
      priority: 10,
    }),
    role({
      name: 'University Lecturer / Assistant Professor (Naval Architecture)',
      description:
        'Delivers teaching and research in naval architecture and ship design programmes within UK higher education.',
      roleCategory: 'academic',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD typically required; teaching/research track record expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      isAcademicRole: true,
      eligibilityNote:
        'Academic pathway. Not an industry chartered-engineer seniority substitute.',
      fitClassification: 'academic_or_research',
      priority: 20,
    }),
    role({
      name: 'Ship Hydrodynamics Research Specialist',
      description:
        'Advances resistance, seakeeping, manoeuvring and CFD methods for ship performance research.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with ship hydrodynamics research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Research specialist fit within Naval Architecture.',
      fitClassification: 'academic_or_research',
      priority: 30,
    }),
    role({
      name: 'Marine Structural Analysis Research Specialist',
      description:
        'Researches ship structural response, fatigue, ultimate strength and marine structural analysis methods.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with marine structural analysis research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Marine structural research — not building Structural Engineering research titles.',
      fitClassification: 'academic_or_research',
      priority: 40,
    }),
    role({
      name: 'Floating Systems Design Research Specialist',
      description:
        'Researches floating offshore platforms, FOWT hulls and coupled hydro-structural performance.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with floating systems / offshore naval architecture research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Floating systems research — renewable energy yield/project research sits under Renewable Energy Engineering.',
      fitClassification: 'academic_or_research',
      priority: 50,
    }),
    role({
      name: 'Innovation / Ship Design R&D Engineer',
      description:
        'Leads applied R&D for novel ship concepts, arrangements or performance technologies in industry or research organisations.',
      roleCategory: 'research',
      seniorityLevel: 'senior',
      minimumExperienceYears: 5,
      experienceRequirementLabel: 'Typically 5+ years R&D or advanced ship design delivery; PhD often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Industry R&D progression needs delivery experience beyond the PhD award itself.',
      fitClassification: 'future_progression',
      priority: 60,
    }),
    role({
      name: 'Lead Ship Design Engineer',
      description:
        'Leads end-to-end ship design programmes, coordinating naval architecture, structure and performance disciplines.',
      roleCategory: 'leadership',
      seniorityLevel: 'senior',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years ship design leadership experience',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Leadership progression is experience-led; PhD is not automatic Lead status.',
      fitClassification: 'future_progression',
      priority: 70,
    }),
    role({
      name: 'Principal / Specialist Naval Architecture Consultant',
      description:
        'Provides expert advisory on vessel design, conversion, performance and technical assurance for owners, yards and class.',
      roleCategory: 'consultancy',
      seniorityLevel: 'principal',
      minimumExperienceYears: 10,
      experienceRequirementLabel: 'Typically 10+ years naval architecture delivery; deep domain expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote:
        'Principal consultancy needs track record beyond doctoral study. CEng MRINA commonly expected.',
      fitClassification: 'future_progression',
      priority: 80,
    }),
    role({
      name: 'Technical Authority / Expert Witness (Naval Architecture)',
      description:
        'Sets naval architecture technical standards and may provide expert evidence on ship design, stability or structural marine disputes.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 12,
      experienceRequirementLabel: 'Typically 12+ years naval architecture leadership and specialist expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote:
        'Leadership/expert roles require extensive experience. Academic stage alone is insufficient.',
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Research & Innovation Manager (Ship Design)',
      description:
        'Manages research portfolios and innovation programmes spanning hull form, marine structures and floating systems design.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years research/innovation leadership in ship design',
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
// 3) Renewable Energy Engineering — Energy Institute / RenewableUK
// ---------------------------------------------------------------------------
const RENEWABLE: SpecialismPack = {
  slug: 'renewable-energy-engineering',
  label: 'Renewable Energy Engineering',
  professionalBody: 'Energy Institute (EI)',
  relatedBodies: [
    'RenewableUK',
    'Institution of Engineering and Technology (IET)',
    'Engineering Council',
  ],
  sources: [
    'national_careers_service_energy_engineer',
    'prospects_energy_engineer',
    'prospects_renewable_energy_careers',
    'energy_institute_professional_registration',
    'renewableuk_wind_skills_context',
    'engineering_council_ceng_pathway',
  ],
  siblingSlugs: [
    'electrical-engineering',
    'mechanical-engineering',
    'materials-engineering',
    'petroleum-engineering',
    'chemical-engineering',
    'environmental-engineering',
    'marine-engineering',
    'naval-architecture',
    'nuclear-engineering',
    'mechatronics',
  ],
  degree: [
    role({
      name: 'Graduate Renewable Energy Engineer',
      description:
        'Entry UK role supporting wind, solar or wider renewable project engineering toward Energy Institute / IET professional development.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior industry experience required',
      academicRequirement: 'accredited_degree_preferred',
      eligibilityNote:
        'Immediate graduate-entry renewables pathway. EI/IET chartership is a later goal. Core HV substation design remains Electrical Engineering.',
      fitClassification: 'immediate',
      priority: 10,
    }),
    role({
      name: 'Onshore Wind Engineer (Graduate)',
      description:
        'Supports onshore wind farm layout inputs, turbine interfaces, construction packages and technical queries under senior wind engineers.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via developer, OEM or consultancy graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate onshore wind pathway within Renewable Energy Engineering.',
      fitClassification: 'immediate',
      priority: 20,
    }),
    role({
      name: 'Offshore Wind Engineer (Graduate)',
      description:
        'Supports offshore wind project engineering, foundations interfaces, array packages and installation technical support under senior engineers.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via offshore wind developers/OEMs; offshore training often required later',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Offshore wind project engineering — vessel machinery under Marine Engineering; floating hull design under Naval Architecture.',
      fitClassification: 'immediate',
      priority: 30,
    }),
    role({
      name: 'Solar PV Engineer (Graduate)',
      description:
        'Supports solar PV system design, yield checks and construction/commissioning packages for ground-mount or rooftop projects.',
      roleCategory: 'design',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via solar developers/EPCs; placement helpful',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate solar engineering pathway — not Electrical distribution network planning titles.',
      fitClassification: 'immediate',
      priority: 40,
    }),
    role({
      name: 'Energy Storage / Battery Systems Engineer (Graduate)',
      description:
        'Supports battery energy storage system (BESS) project engineering, sizing interfaces and commissioning support at project/grid-connected level.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via storage developers/OEMs graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Project/grid-level storage engineering — pure battery chemistry/materials research remains Materials Engineering.',
      fitClassification: 'immediate',
      priority: 50,
    }),
    role({
      name: 'Renewable Project Engineer (Graduate)',
      description:
        'Supports renewable project delivery including packages, interfaces, schedules and technical documentation under a project lead.',
      roleCategory: 'project_management',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via graduate schemes with developers or EPCs',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate renewable project engineering pathway.',
      fitClassification: 'immediate',
      priority: 60,
    }),
    role({
      name: 'Energy Yield Analyst (Junior)',
      description:
        'Supports wind/solar resource assessment, energy yield modelling and uncertainty analysis under senior yield analysts.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'early_career',
      minimumExperienceYears: 1,
      experienceRequirementLabel: 'Typically 1–3 years yield/resource analysis experience',
      professionalRegistrationRequirement: 'desirable',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Realistic next after graduate renewables exposure.',
      fitClassification: 'realistic_next',
      priority: 70,
    }),
    role({
      name: 'Renewable O&M Engineer (Graduate)',
      description:
        'Supports operations and maintenance of renewable assets including fault response, performance checks and contractor interfaces.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via asset owners/operators; site training often required',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate renewable O&M pathway within Renewable Energy Engineering.',
      fitClassification: 'immediate',
      priority: 80,
    }),
    role({
      name: 'Hydrogen Systems Engineer (Renewables) — Graduate',
      description:
        'Supports renewable hydrogen production, storage and offtake interfaces for low-carbon energy projects under senior engineers.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'Entry via hydrogen/renewables graduate schemes',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Renewables-linked hydrogen systems — Chemical process plant hydrogen roles remain Chemical Engineering; not Petroleum upstream.',
      fitClassification: 'immediate',
      priority: 90,
    }),
    role({
      name: 'Renewable Energy Engineering Technician / EngTech pathway',
      description:
        'Provides field, commissioning or design-support technical work; may align with EngTech development via EI or IET.',
      roleCategory: 'graduate_entry',
      seniorityLevel: 'entry',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'No prior experience required; EngTech/IEng pathway available',
      academicRequirement: 'degree_relevant',
      eligibilityNote:
        'Immediate technical pathway. Professional registration is a later goal, not an entry gate.',
      fitClassification: 'immediate',
      priority: 100,
    }),
  ],
  masters: [
    role({
      name: 'Offshore Wind Project Engineer',
      description:
        'Delivers offshore wind work packages across foundations interfaces, array cables, installation and technical risk management.',
      roleCategory: 'project_management',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years offshore wind project experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Offshore wind project engineering — floating hull design under Naval Architecture; vessel machinery under Marine Engineering.',
      fitClassification: 'realistic_next',
      priority: 10,
    }),
    role({
      name: 'Onshore Wind Design / Project Engineer',
      description:
        'Designs and delivers onshore wind projects covering layout optimisation interfaces, civils packages and construction technical assurance.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years onshore wind experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Master’s-relevant wind delivery. Academic stage alone is not automatic seniority.',
      fitClassification: 'realistic_next',
      priority: 20,
    }),
    role({
      name: 'Solar Engineering Design Engineer',
      description:
        'Leads PV plant electrical/mechanical design packages, yield-informed design and construction design support for solar projects.',
      roleCategory: 'design',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years solar design experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Solar plant design — not Electrical transmission/substation core design titles.',
      fitClassification: 'realistic_next',
      priority: 30,
    }),
    role({
      name: 'Grid Connection Support Engineer (Renewables)',
      description:
        'Supports renewable project grid connection applications, interface studies coordination and DNO/TO technical liaison from a project perspective.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years renewables grid-connection project experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Renewable-project grid connection support — titled to avoid Electrical “Renewable Energy Electrical Integration Engineer” and core HV design ownership.',
      fitClassification: 'realistic_next',
      priority: 40,
    }),
    role({
      name: 'Renewable Systems Integration Engineer',
      description:
        'Integrates generation, storage and controls into coherent renewable energy systems for project and portfolio delivery.',
      roleCategory: 'technical_specialist',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–7 years renewables systems integration experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Renewable systems integration — not Mechatronics factory automation integration.',
      fitClassification: 'realistic_next',
      priority: 50,
    }),
    role({
      name: 'Energy Storage Project Engineer',
      description:
        'Delivers BESS projects covering sizing, EPC interfaces, safety systems and commissioning for grid-connected storage.',
      roleCategory: 'project_management',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years energy storage project experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Project-level storage delivery — battery cell chemistry/materials research remains Materials Engineering.',
      fitClassification: 'realistic_next',
      priority: 60,
    }),
    role({
      name: 'Hydrogen Systems Project Engineer (Renewables)',
      description:
        'Delivers renewable hydrogen project packages covering electrolyser interfaces, balance-of-plant and offtake integration.',
      roleCategory: 'project_management',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–7 years hydrogen/renewables project experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'desirable',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Renewables hydrogen projects — Chemical process hydrogen plant roles remain Chemical Engineering.',
      fitClassification: 'realistic_next',
      priority: 70,
    }),
    role({
      name: 'Renewable Asset Engineer',
      description:
        'Owns technical performance of operational renewable assets, including availability, failures and life-extension options.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years renewable O&M/asset experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Asset engineering ownership needs operational experience beyond postgraduate study.',
      fitClassification: 'realistic_next',
      priority: 80,
    }),
    role({
      name: 'Renewable Project Development Engineer',
      description:
        'Supports site finding, technical due diligence, consenting interfaces and early design for renewable project development pipelines.',
      roleCategory: 'project_management',
      seniorityLevel: 'mid_level',
      minimumExperienceYears: 3,
      experienceRequirementLabel: 'Typically 3–6 years renewables development experience',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'desirable',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Development engineering — not Urban Planning policy roles or Petroleum field development.',
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Senior Renewable Energy Engineer',
      description:
        'Leads complex renewable engineering packages, mentors juniors and assures technical quality across wind, solar or storage projects.',
      roleCategory: 'professional_practice',
      seniorityLevel: 'senior',
      minimumExperienceYears: 6,
      experienceRequirementLabel: 'Typically 6+ years renewable energy engineering experience; CEng commonly expected',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'masters_relevant',
      eligibilityNote:
        'Seniority requires significant industry experience. Master’s alone is not Senior status.',
      fitClassification: 'future_progression',
      priority: 100,
    }),
  ],
  phd: [
    role({
      name: 'Research Associate / Postdoctoral Researcher (Renewable Energy Engineering)',
      description:
        'Conducts postdoctoral research in wind, solar, storage or low-carbon energy systems in UK universities or research centres.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD (or near completion) in renewable energy engineering or closely related field',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Academic/research fit. A PhD is not automatic industry Senior renewable seniority.',
      fitClassification: 'academic_or_research',
      priority: 10,
    }),
    role({
      name: 'University Lecturer / Assistant Professor (Renewable Energy Engineering)',
      description:
        'Delivers teaching and research in renewable energy engineering programmes within UK higher education.',
      roleCategory: 'academic',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD typically required; teaching/research track record expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      isAcademicRole: true,
      eligibilityNote:
        'Academic pathway. Not an industry chartered-engineer seniority substitute.',
      fitClassification: 'academic_or_research',
      priority: 20,
    }),
    role({
      name: 'Wind Energy Research Specialist',
      description:
        'Advances research on wind resource, turbine/array performance, wakes and offshore/onshore wind technology.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with wind energy research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Wind energy research — floating platform hull research sits under Naval Architecture.',
      fitClassification: 'academic_or_research',
      priority: 30,
    }),
    role({
      name: 'Solar / PV Systems Research Specialist',
      description:
        'Researches PV system performance, degradation, hybrid solar configurations and plant optimisation methods.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with solar/PV systems research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'PV systems research — semiconductor device physics may sit under Electronic Engineering.',
      fitClassification: 'academic_or_research',
      priority: 40,
    }),
    role({
      name: 'Energy Storage Systems Research Specialist',
      description:
        'Researches grid-connected storage system performance, control and techno-economics for renewable integration.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with energy storage systems research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Systems-level storage research — pure battery chemistry/materials remains Materials Engineering.',
      fitClassification: 'academic_or_research',
      priority: 50,
    }),
    role({
      name: 'Hydrogen Energy Systems Research Specialist',
      description:
        'Researches renewable hydrogen pathways, system integration and techno-economic performance for low-carbon energy.',
      roleCategory: 'research',
      seniorityLevel: 'academic_research',
      minimumExperienceYears: 0,
      experienceRequirementLabel: 'PhD with hydrogen energy systems research',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Hydrogen energy systems research — Chemical process hydrogen R&D remains Chemical Engineering.',
      fitClassification: 'academic_or_research',
      priority: 60,
    }),
    role({
      name: 'Innovation / Low-Carbon Energy R&D Engineer',
      description:
        'Leads applied R&D for renewable generation, storage or hybrid low-carbon energy systems in industry.',
      roleCategory: 'research',
      seniorityLevel: 'senior',
      minimumExperienceYears: 5,
      experienceRequirementLabel: 'Typically 5+ years R&D or advanced renewables delivery; PhD often valued',
      professionalRegistrationRequirement: 'desirable',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      isResearchRole: true,
      eligibilityNote:
        'Industry R&D progression needs delivery experience beyond the PhD award itself. Nuclear remains outside this specialism.',
      fitClassification: 'future_progression',
      priority: 70,
    }),
    role({
      name: 'Principal / Specialist Renewable Energy Consultant',
      description:
        'Provides expert advisory on renewable project design, yield, storage and development for clients and investors.',
      roleCategory: 'consultancy',
      seniorityLevel: 'principal',
      minimumExperienceYears: 10,
      experienceRequirementLabel: 'Typically 10+ years renewables delivery; deep domain expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote:
        'Principal consultancy needs track record beyond doctoral study. CEng via EI/IET commonly expected.',
      fitClassification: 'future_progression',
      priority: 80,
    }),
    role({
      name: 'Technical Authority / Lead Renewable Energy Engineer',
      description:
        'Sets renewable engineering standards and assures complex wind, solar, storage or hydrogen programmes.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 12,
      experienceRequirementLabel: 'Typically 12+ years renewable energy leadership and specialist expertise',
      professionalRegistrationRequirement: 'commonly_expected',
      professionalMembershipRequirement: 'commonly_expected',
      academicRequirement: 'phd_relevant',
      eligibilityNote:
        'Leadership roles require extensive experience. Academic stage alone is insufficient.',
      fitClassification: 'future_progression',
      priority: 90,
    }),
    role({
      name: 'Research & Innovation Manager (Renewable Energy Systems)',
      description:
        'Manages research portfolios and innovation programmes spanning wind, solar, storage and low-carbon energy systems.',
      roleCategory: 'leadership',
      seniorityLevel: 'leadership',
      minimumExperienceYears: 8,
      experienceRequirementLabel: 'Typically 8+ years research/innovation leadership in renewables',
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

const PACKS = [MARINE, NAVAL, RENEWABLE]

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

  console.log('\n=== Marine + Naval Architecture + Renewable Energy roles populate ===')
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
    console.log("Master's:")
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
