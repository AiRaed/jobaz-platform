/**
 * Populate Career Knowledge Library roles for Aerospace Engineering only.
 *
 * Focus: aircraft design, aerodynamics, flight/avionics systems integration,
 * structures/composites, propulsion/gas turbines, space/satellites, UAV,
 * flight test, certification, airworthiness, aerospace manufacturing,
 * defence aerospace, maintenance support, reliability, aerospace R&D.
 *
 * Exclude: general mechanical design, automotive, electronic hardware design,
 * electrical power, civil, industrial engineering, robotics.
 *
 * Sources: National Careers Service, Prospects, RAeS, Careers in Aerospace / ADS.
 *
 *   npx tsx scripts/populate-career-library-aerospace-engineering-roles.ts
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

const DEGREE_ROLES: RoleSeed[] = [
  {
    name: 'Graduate Aerospace Engineer',
    description:
      'Entry UK role on a structured aerospace graduate scheme supporting design, analysis or manufacturing toward RAeS professional development.',
    roleCategory: 'graduate_entry',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'No prior industry experience required',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'accredited_degree_preferred',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate graduate-entry role. RAeS membership supports later IEng/CEng progression but is not required to start. Defence roles may need security clearance.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'Aircraft Structures Engineer (Graduate)',
    description:
      'Supports structural analysis, sizing and design of airframe components under senior stress/structures engineers.',
    roleCategory: 'design',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes; placement helpful',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate aerospace structures pathway — not general Mechanical Design Engineering.',
    fitClassification: 'immediate',
    priority: 20,
  },
  {
    name: 'Aerodynamics Engineer (Junior)',
    description:
      'Supports CFD, wind-tunnel correlation and aerodynamic performance studies for aircraft or UAV configurations.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years aerodynamics experience or strong placement',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Degree relevance is strong; signing off flight-critical aero methods needs supervised project experience.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Propulsion Engineer (Graduate)',
    description:
      'Supports gas turbine or aircraft propulsion system analysis, testing and component development in UK aerospace employers.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'No prior industry experience required on graduate schemes',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate propulsion pathway. Distinct from Automotive powertrain engineering.',
    fitClassification: 'immediate',
    priority: 40,
  },
  {
    name: 'Avionics Integration Engineer (Junior)',
    description:
      'Supports integration and verification of avionics and flight-system interfaces on aircraft platforms.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years avionics/systems integration experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Avionics integration focus — not Electronic Hardware Design / PCB specialism roles.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Aerospace Manufacturing Engineer (Graduate)',
    description:
      'Supports manufacturing readiness, tooling interfaces and production of aerospace parts and assemblies to quality standards.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes in aerospace manufacturing',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Aerospace manufacturing focus — not Industrial Engineering lean/OpEx generalist titles.',
    fitClassification: 'immediate',
    priority: 60,
  },
  {
    name: 'Flight Test Support Engineer (Graduate)',
    description:
      'Supports flight-test planning, instrumentation coordination and data analysis under senior flight-test engineers.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry possible; security clearance may be required',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Support-level flight test pathway. Lead flight-test authority requires substantial experience and competence.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Aircraft Maintenance Engineering Support (Graduate)',
    description:
      'Supports continuing airworthiness engineering, technical queries and maintenance programme inputs for aircraft fleets.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years MRO or CAMO support experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Engineering support to maintenance/airworthiness — regulated aviation environment; not a Part-66 licensed engineer pathway by itself.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Assistant Aerospace Project Engineer',
    description:
      'Supports aerospace work packages through design and delivery, coordinating suppliers, schedules and documentation under a project lead.',
    roleCategory: 'project_management',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–2 years project or design support experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Assistant-level aerospace project delivery. Full package ownership is not implied by academic stage alone.',
    fitClassification: 'realistic_next',
    priority: 90,
  },
  {
    name: 'Aerospace Engineering Technician / EngTech pathway',
    description:
      'Provides drawing, assembly, test or manufacturing technical support; may align with EngTech or IEng development via RAeS.',
    roleCategory: 'graduate_entry',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'No prior experience required; EngTech/IEng pathway available',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate technical pathway. Professional registration is a later goal, not an entry gate.',
    fitClassification: 'immediate',
    priority: 100,
  },
]

const MASTERS_ROLES: RoleSeed[] = [
  {
    name: 'Aircraft Design Engineer',
    description:
      'Contributes to aircraft configuration, loads interfaces and multidisciplinary design integration for civil or defence platforms.',
    roleCategory: 'design',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years aircraft design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'A Master’s strengthens academic fit; design authority still depends on platform delivery experience.',
    fitClassification: 'realistic_next',
    priority: 10,
  },
  {
    name: 'Gas Turbine / Propulsion Systems Engineer',
    description:
      'Designs or develops gas turbine components and propulsion system performance for aerospace applications.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years gas turbine / propulsion experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Aerospace propulsion focus — not automotive powertrain specialism titles.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'Composite Structures Engineer (Aerospace)',
    description:
      'Designs and analyses composite airframe structures, including allowables, damage tolerance and manufacturing constraints.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years aerospace composites experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s relevance does not replace certification-aware composites project experience.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Flight Systems / Controls Engineer',
    description:
      'Develops and verifies flight control or aircraft systems behaviour, including modelling, integration and safety assessment inputs.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years flight systems experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Safety-critical systems work. Not mechatronics product robotics or general electronic hardware design.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Space Systems / Satellite Engineer',
    description:
      'Contributes to satellite or space-system design, AIT (assembly, integration and test) and mission system interfaces.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years space systems experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s in space/astronautics is strongly relevant; programme ownership still needs delivery experience.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'UAV / Drone Systems Engineer',
    description:
      'Designs or integrates unmanned aerial systems, including airframe, flight systems and operational performance for UK applications.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years UAV / UAS engineering experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Aerospace UAS focus — not general Robotics Engineering specialism.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Aircraft Certification / Airworthiness Engineer',
    description:
      'Supports type certification, continued airworthiness and compliance evidence for civil or military aerospace products.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 4,
    experienceRequirementLabel: 'Typically 4–6 years certification / airworthiness experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Regulated aviation pathway. Master’s alone does not confer certification signatory authority.',
    fitClassification: 'future_progression',
    priority: 70,
  },
  {
    name: 'Aerospace Reliability / Systems Integration Engineer',
    description:
      'Performs reliability, maintainability and systems-integration analysis across aerospace platforms and equipment.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years reliability or systems integration experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Academic stage indicates relevance; system ownership needs demonstrated programme delivery.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Senior Aerospace Design Engineer',
    description:
      'Leads complex aerospace design packages, mentoring juniors and coordinating multidisciplinary design reviews.',
    roleCategory: 'design',
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel: 'Typically 5–8 years progressive aerospace design experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'May appear for Master’s graduates as future progression. A Master’s alone does not qualify someone for senior design leadership.',
    fitClassification: 'future_progression',
    priority: 90,
  },
  {
    name: 'Lead Aerospace Systems Engineer',
    description:
      'Acts as technical lead for aerospace systems scope on larger programmes, setting standards and resolving critical integration issues.',
    roleCategory: 'leadership',
    seniorityLevel: 'senior',
    minimumExperienceYears: 6,
    experienceRequirementLabel: 'Typically 6–10 years experience including technical leadership',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Lead-level title requires substantial delivery leadership. Not an immediate Master’s role. Defence programmes often need clearance.',
    fitClassification: 'future_progression',
    priority: 100,
  },
]

const PHD_ROLES: RoleSeed[] = [
  {
    name: 'Research Associate / Postdoctoral Researcher (Aerospace Engineering)',
    description:
      'Conducts funded research in universities or research centres on advanced aerospace engineering topics and publications.',
    roleCategory: 'research',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'PhD (or near completion) is the primary gate; postdoc contracts vary',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: true,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate or near-term academic/research fit after PhD. Not a senior industry design authority role.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'University Lecturer / Assistant Professor (Aerospace Engineering)',
    description:
      'Teaches aerospace engineering modules and supervises student projects while developing an academic research portfolio.',
    roleCategory: 'academic',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 2,
    experienceRequirementLabel:
      'Typically postdoctoral research record plus teaching evidence; PhD alone is rarely sufficient',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: true,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD makes the role academically relevant, but appointments usually need publications, teaching experience and often postdoctoral experience.',
    fitClassification: 'academic_or_research',
    priority: 20,
  },
  {
    name: 'Aerodynamics / CFD Research Specialist',
    description:
      'Develops advanced aerodynamic modelling, CFD methods or experimental aero techniques for aerospace research programmes.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years aerodynamics research or specialist experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Strong PhD relevance. Flight-critical design authority still depends on applied programme experience.',
    fitClassification: 'academic_or_research',
    priority: 30,
  },
  {
    name: 'Propulsion / Gas Turbine Research Specialist',
    description:
      'Researches advanced propulsion cycles, turbomachinery or sustainable aviation fuel interfaces for aerospace applications.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years propulsion research or specialist experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD supports academic relevance; product certification ownership grows through industrial delivery.',
    fitClassification: 'academic_or_research',
    priority: 40,
  },
  {
    name: 'Aerospace Structures / Composites Research Specialist',
    description:
      'Researches advanced structural methods, composites damage tolerance or lightweight airframe technologies.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years structures/composites research experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Realistic academic/research fit after PhD. Not equivalent to principal certification consultancy.',
    fitClassification: 'academic_or_research',
    priority: 50,
  },
  {
    name: 'Space Systems Research Specialist',
    description:
      'Conducts research on spacecraft systems, satellite payloads or space mission technologies in academia or industrial R&D.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years space research or specialist experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD is often valuable for space specialism; programme leadership still needs mission delivery experience.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Innovation / Aerospace R&D Engineer',
    description:
      'Leads new aerospace technology, sustainable aviation or defence R&D within industry labs or collaborative UK programmes.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years research or industry R&D experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Realistic for PhD holders with research delivery skills; not a principal consulting or expert witness role.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Principal / Specialist Aerospace Consultant',
    description:
      'Provides expert aerospace advice on complex design integrity, certification risk and high-consequence technical problems.',
    roleCategory: 'consultancy',
    seniorityLevel: 'principal',
    minimumExperienceYears: 12,
    experienceRequirementLabel: 'Typically 12+ years specialist aerospace consulting experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'PhD may support credibility, but principal consulting requires substantial industry experience and usually chartered status. Not an immediate PhD role.',
    fitClassification: 'future_progression',
    priority: 80,
  },
  {
    name: 'Technical Authority / Expert Witness (Aerospace Engineering)',
    description:
      'Acts as a recognised technical authority on disputes, airworthiness investigations and highly specialised aerospace problems.',
    roleCategory: 'leadership',
    seniorityLevel: 'principal',
    minimumExperienceYears: 15,
    experienceRequirementLabel:
      'Typically 15+ years recognised specialist practice; expert witness work is reputation-based',
    professionalRegistrationRequirement: 'required',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Must not be presented as an immediate PhD role. Requires substantial specialist career history; PhD alone is insufficient.',
    fitClassification: 'future_progression',
    priority: 90,
  },
  {
    name: 'Research & Innovation Manager (Aerospace / Space Systems)',
    description:
      'Manages research programmes, industry–university partnerships and innovation funding for aerospace and space technology.',
    roleCategory: 'leadership',
    seniorityLevel: 'leadership',
    minimumExperienceYears: 6,
    experienceRequirementLabel: 'Typically 6–10 years research leadership or programme management experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Management of research programmes needs leadership experience beyond the PhD award itself.',
    fitClassification: 'future_progression',
    priority: 100,
  },
]

const SIBLING_SPECIALISM_SLUGS = [
  'mechanical-engineering',
  'automotive-engineering',
  'electrical-engineering',
  'electronic-engineering',
  'mechatronics',
  'civil-engineering',
  'industrial-engineering',
  'chemical-engineering',
  'robotics',
  'robotics-engineering',
] as const

async function insertRolesForStage(
  supabase: SupabaseClient,
  specialismId: string,
  stage: { id: string; stage_key: string; label: string },
  roles: RoleSeed[],
  existingSlugs: Set<string>
): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = []
  const skipped: string[] = []

  for (const role of roles) {
    const baseSlug = normalizeSlug(undefined, role.name)
    if (!baseSlug) {
      skipped.push(role.name)
      continue
    }
    const slug = `${stage.stage_key}-${baseSlug}`

    if (existingSlugs.has(slug)) {
      skipped.push(role.name)
      continue
    }

    const { error } = await supabase.from('career_library_roles').insert({
      specialism_id: specialismId,
      stage_id: stage.id,
      name: role.name,
      slug,
      description: role.description,
      status: 'draft',
      active: true,
      sort_order: role.priority,
      priority: role.priority,
      role_category: role.roleCategory,
      seniority_level: role.seniorityLevel,
      minimum_experience_years: role.minimumExperienceYears,
      experience_requirement_label: role.experienceRequirementLabel,
      professional_registration_requirement: role.professionalRegistrationRequirement,
      professional_membership_requirement: role.professionalMembershipRequirement,
      academic_requirement: role.academicRequirement,
      is_research_role: role.isResearchRole,
      is_academic_role: role.isAcademicRole,
      is_regulated_or_restricted: role.isRegulatedOrRestricted,
      eligibility_note: role.eligibilityNote,
      fit_classification: role.fitClassification,
      metadata: {
        stage_id: stage.id,
        stage_key: stage.stage_key as StageKey,
        stage_label: stage.label,
        academic_level: stage.stage_key,
        specialism_slug: 'aerospace-engineering',
        country_focus: 'uk',
        professional_body_focus: 'RAeS',
        related_bodies: ['IMechE', 'Engineering Council'],
        eligibility_model_version: 1,
        sources: [
          'national_careers_service_aerospace_engineer',
          'prospects_aerospace_engineer',
          'raes_professional_registration_ceng',
          'careers_in_aerospace_ads',
        ],
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
    .select('id, name, slug, professional_body')
    .eq('slug', 'aerospace-engineering')
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(
      `Aerospace Engineering specialism not found: ${specErr?.message ?? 'missing row'}`
    )
  }

  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({
        professional_body: 'Royal Aeronautical Society (RAeS)',
      })
      .eq('id', specialism.id)
  }

  const { data: siblings } = await supabase
    .from('career_library_specialisms')
    .select('id, slug')
    .in('slug', [...SIBLING_SPECIALISM_SLUGS])

  const siblingNames = new Set<string>()
  for (const sib of siblings ?? []) {
    const { data: roles } = await supabase
      .from('career_library_roles')
      .select('name')
      .eq('specialism_id', sib.id)
    for (const r of roles ?? []) siblingNames.add(r.name.trim().toLowerCase())
  }

  const allSeeds = [...DEGREE_ROLES, ...MASTERS_ROLES, ...PHD_ROLES]
  const filteredByStage = {
    degree: DEGREE_ROLES.filter((r) => !siblingNames.has(r.name.trim().toLowerCase())),
    masters: MASTERS_ROLES.filter((r) => !siblingNames.has(r.name.trim().toLowerCase())),
    phd: PHD_ROLES.filter((r) => !siblingNames.has(r.name.trim().toLowerCase())),
  }
  const crossSkipped = allSeeds
    .filter((r) => siblingNames.has(r.name.trim().toLowerCase()))
    .map((r) => r.name)

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
    filteredByStage.degree,
    existingSlugs
  )
  const masters = await insertRolesForStage(
    supabase,
    specialism.id,
    stageByKey.get('masters')!,
    filteredByStage.masters,
    existingSlugs
  )
  const phd = await insertRolesForStage(
    supabase,
    specialism.id,
    stageByKey.get('phd')!,
    filteredByStage.phd,
    existingSlugs
  )

  const { count } = await supabase
    .from('career_library_roles')
    .select('id', { count: 'exact', head: true })
    .eq('specialism_id', specialism.id)
    .eq('status', 'draft')

  const totalCreated = degree.created.length + masters.created.length + phd.created.length
  const sameSpecSkipped =
    degree.skipped.length + masters.skipped.length + phd.skipped.length

  console.log('\n=== Aerospace Engineering roles populate summary ===')
  console.log(`Specialism: ${specialism.name} (${specialism.slug})`)
  console.log(`Stage model: academic_level`)
  console.log(`Status: draft`)
  console.log(`Roles created this run: ${totalCreated}`)
  console.log(`Duplicates skipped (same specialism): ${sameSpecSkipped}`)
  console.log(`Duplicates skipped (exact title overlap with sibling specialisms): ${crossSkipped.length}`)
  if (crossSkipped.length) {
    for (const n of crossSkipped) console.log(`  - ${n}`)
  }
  console.log(`Draft roles now in specialism: ${count ?? 'n/a'}`)

  console.log('\nDegree / Bachelor roles:')
  for (const n of degree.created) console.log(`  + ${n}`)
  if (!degree.created.length) console.log('  (none new)')

  console.log("\nMaster's roles:")
  for (const n of masters.created) console.log(`  + ${n}`)
  if (!masters.created.length) console.log('  (none new)')

  console.log('\nPhD roles:')
  for (const n of phd.created) console.log(`  + ${n}`)
  if (!phd.created.length) console.log('  (none new)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
