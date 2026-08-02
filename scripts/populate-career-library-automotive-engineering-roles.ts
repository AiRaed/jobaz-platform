/**
 * Populate Career Knowledge Library roles for Automotive Engineering only.
 *
 * Focus: vehicle/chassis/powertrain, ICE/EV/hybrid, battery systems, vehicle
 * dynamics, suspension/brakes, automotive electronics integration, test &
 * validation, safety/ISO 26262, automotive manufacturing, motorsport,
 * autonomous systems, automotive R&D, quality & reliability.
 *
 * Exclude: general mechanical, aerospace, PCB design, electrical power,
 * civil, industrial engineering, robotics.
 *
 * Sources: National Careers Service, Prospects, IMechE, IMI, SMMT.
 *
 *   npx tsx scripts/populate-career-library-automotive-engineering-roles.ts
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
    name: 'Graduate Automotive Engineer',
    description:
      'Entry UK role on a structured OEM or supplier graduate scheme supporting vehicle design, development or manufacturing toward IMechE professional development.',
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
      'Immediate graduate-entry role. IMechE/IET membership supports later IEng/CEng progression but is not required to start. IMI is relevant for industry/skills pathways.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'Vehicle Design Engineer (Junior)',
    description:
      'Supports CAD design of vehicle systems or components, packaging studies and design releases under senior vehicle engineers.',
    roleCategory: 'design',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years vehicle design experience or strong placement',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Vehicle-focused design pathway — not general Mechanical Design Engineering.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'Chassis Engineer (Graduate)',
    description:
      'Supports chassis attribute development including suspension interfaces, steering and structural chassis components.',
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
      'Immediate chassis pathway. Attribute ownership still needs supervised vehicle programme experience.',
    fitClassification: 'immediate',
    priority: 30,
  },
  {
    name: 'Powertrain Engineer (Graduate)',
    description:
      'Supports ICE, hybrid or conventional powertrain development, calibration support and component testing for road vehicles.',
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
      'Automotive powertrain focus — not Aerospace gas-turbine propulsion titles.',
    fitClassification: 'immediate',
    priority: 40,
  },
  {
    name: 'EV / Hybrid Systems Engineer (Graduate)',
    description:
      'Supports electric and hybrid vehicle systems including e-drive interfaces, energy management and high-voltage system integration on vehicles.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via electrification graduate schemes',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Vehicle electrification focus — not Electrical Power Engineering grid roles or Electronic PCB design.',
    fitClassification: 'immediate',
    priority: 50,
  },
  {
    name: 'Automotive Test and Validation Engineer',
    description:
      'Plans and runs vehicle or component tests, analyses results and supports attribute validation against OEM and regulatory requirements.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry possible with laboratory/placement experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Often realistic soon after graduation. Senior validation sign-off still requires programme experience.',
    fitClassification: 'immediate',
    priority: 60,
  },
  {
    name: 'Vehicle Dynamics Engineer (Junior)',
    description:
      'Supports ride, handling and vehicle dynamics simulation or testing for passenger or commercial vehicles.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years vehicle dynamics experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Degree relevance is strong; attribute ownership depends on vehicle programme delivery experience.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Automotive Manufacturing Engineer (Graduate)',
    description:
      'Supports launch readiness, process planning and production of vehicle assemblies to quality and cost targets in UK plants.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via OEM/supplier graduate manufacturing schemes',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Automotive manufacturing focus — not Industrial Engineering lean/OpEx generalist titles.',
    fitClassification: 'immediate',
    priority: 80,
  },
  {
    name: 'Assistant Automotive Project Engineer',
    description:
      'Supports vehicle programme work packages, coordinating suppliers, schedules and documentation under a project lead.',
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
      'Assistant-level automotive project delivery. Full package ownership is not implied by academic stage alone.',
    fitClassification: 'realistic_next',
    priority: 90,
  },
  {
    name: 'Automotive Engineering Technician / EngTech pathway',
    description:
      'Provides CAD, prototype, test or production technical support; may align with EngTech or IEng development via IMechE/IET.',
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
    name: 'Powertrain Systems Engineer',
    description:
      'Develops ICE, hybrid or e-powertrain systems performance, calibration interfaces and integration for vehicle programmes.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years automotive powertrain experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'A Master’s strengthens academic fit; system ownership still depends on vehicle programme experience.',
    fitClassification: 'realistic_next',
    priority: 10,
  },
  {
    name: 'Battery Systems Engineer (Automotive)',
    description:
      'Designs or develops traction battery packs, BMS interfaces and thermal management for EV and hybrid vehicles.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years battery systems experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Automotive battery systems focus — not Electrical Power grid storage engineering.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'Automotive Electronics Integration Engineer',
    description:
      'Integrates vehicle electrical/electronic architectures, ECUs and network interfaces for series vehicle programmes.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years automotive E/E integration experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Vehicle E/E integration — not Electronic PCB/microelectronics design specialism roles.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Suspension and Brake Systems Engineer',
    description:
      'Develops suspension and braking systems for ride, handling and safety performance across vehicle variants.',
    roleCategory: 'design',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years chassis systems experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s relevance does not replace attribute and supplier-delivery experience on vehicle programmes.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Vehicle Safety / Crashworthiness Engineer',
    description:
      'Supports crashworthiness, passive safety systems and regulatory safety assessments for UK and export markets.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years vehicle safety experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Safety-critical vehicle work. Signatory/release authority needs substantial programme experience.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Functional Safety Engineer (ISO 26262)',
    description:
      'Applies ISO 26262 processes to automotive systems, including hazard analysis, safety goals and safety case evidence.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years functional safety experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Specialist regulated pathway. Master’s alone does not confer safety manager / assessor authority.',
    fitClassification: 'future_progression',
    priority: 60,
  },
  {
    name: 'Motorsport Engineer',
    description:
      'Supports race-car design, performance development or trackside engineering within UK motorsport teams and suppliers.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years motorsport or high-performance vehicle experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Competitive sector; Formula Student/placement experience helps but Master’s does not replace track delivery experience.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Autonomous Vehicle Systems Engineer',
    description:
      'Develops ADAS or automated driving system functions, perception/control interfaces and validation for road vehicles.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years ADAS / autonomy experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Automotive autonomy focus — not general Robotics Engineering specialism.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Senior Vehicle / Automotive Systems Engineer',
    description:
      'Leads complex vehicle attribute or systems packages, mentoring juniors and coordinating multidisciplinary programme reviews.',
    roleCategory: 'design',
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel: 'Typically 5–8 years progressive automotive engineering experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'May appear for Master’s graduates as future progression. A Master’s alone does not qualify someone for senior vehicle leadership.',
    fitClassification: 'future_progression',
    priority: 90,
  },
  {
    name: 'Lead Automotive Systems Engineer',
    description:
      'Acts as technical lead for vehicle systems scope on larger programmes, setting standards and resolving critical integration issues.',
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
      'Lead-level title requires substantial delivery leadership. Not an immediate Master’s role.',
    fitClassification: 'future_progression',
    priority: 100,
  },
]

const PHD_ROLES: RoleSeed[] = [
  {
    name: 'Research Associate / Postdoctoral Researcher (Automotive Engineering)',
    description:
      'Conducts funded research in universities or research centres on advanced automotive engineering topics and publications.',
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
      'Immediate or near-term academic/research fit after PhD. Not a senior OEM design authority role.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'University Lecturer / Assistant Professor (Automotive Engineering)',
    description:
      'Teaches automotive engineering modules and supervises student projects while developing an academic research portfolio.',
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
    name: 'EV / Battery Systems Research Specialist',
    description:
      'Researches battery cells/packs, charging interfaces or electrified powertrain methods for automotive applications.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years EV/battery research or specialist experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Strong PhD relevance. Series-production release authority still depends on industrial programme experience.',
    fitClassification: 'academic_or_research',
    priority: 30,
  },
  {
    name: 'Vehicle Dynamics Research Specialist',
    description:
      'Develops advanced vehicle dynamics modelling, control or tyre/road interaction methods for research and product innovation.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years vehicle dynamics research experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD supports academic relevance; attribute ownership on production vehicles needs programme experience.',
    fitClassification: 'academic_or_research',
    priority: 40,
  },
  {
    name: 'Powertrain / Combustion Research Specialist',
    description:
      'Researches advanced combustion, hybridisation or low-carbon powertrain technologies for automotive applications.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years powertrain research experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Automotive powertrain research — not Aerospace propulsion specialism titles.',
    fitClassification: 'academic_or_research',
    priority: 50,
  },
  {
    name: 'Autonomous Driving Research Specialist',
    description:
      'Researches perception, planning or control methods for automated driving systems in academia or industrial R&D.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years autonomy research experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Realistic academic/research fit after PhD. Not equivalent to principal safety consultancy authority.',
    fitClassification: 'academic_or_research',
    priority: 60,
  },
  {
    name: 'Innovation / Automotive R&D Engineer',
    description:
      'Leads new vehicle technology, electrification or sustainable mobility research within OEM, supplier or Catapult-style centres.',
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
    name: 'Principal / Specialist Automotive Consultant',
    description:
      'Provides expert automotive advice on complex vehicle systems, safety compliance and high-consequence technical problems.',
    roleCategory: 'consultancy',
    seniorityLevel: 'principal',
    minimumExperienceYears: 12,
    experienceRequirementLabel: 'Typically 12+ years specialist automotive consulting experience',
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
    name: 'Technical Authority / Expert Witness (Automotive Engineering)',
    description:
      'Acts as a recognised technical authority on disputes, safety investigations and highly specialised automotive engineering problems.',
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
    name: 'Research & Innovation Manager (Automotive / Future Mobility)',
    description:
      'Manages research programmes, industry–university partnerships and innovation funding for automotive and future-mobility technology.',
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
  'aerospace-engineering',
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
        specialism_slug: 'automotive-engineering',
        country_focus: 'uk',
        professional_body_focus: 'IMechE',
        related_bodies: ['IET', 'IMI'],
        eligibility_model_version: 1,
        sources: [
          'national_careers_service_automotive_engineer',
          'prospects_automotive_engineer',
          'imeche_ceng_ieng_pathway',
          'imi_automotive_industry',
          'smmt_automotive_careers_guide',
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
    .eq('slug', 'automotive-engineering')
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(
      `Automotive Engineering specialism not found: ${specErr?.message ?? 'missing row'}`
    )
  }

  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({
        professional_body:
          'Institution of Mechanical Engineers (IMechE); IET also common; Institute of the Motor Industry (IMI) for industry/skills pathways',
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

  console.log('\n=== Automotive Engineering roles populate summary ===')
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
