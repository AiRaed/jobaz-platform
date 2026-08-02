/**
 * Populate Career Knowledge Library roles for Mechatronics Engineering only.
 *
 * Focus: mechatronic systems, industrial automation, PLC/SCADA, robotics
 * integration, control/motion, machine vision, smart factory mechatronics,
 * electro-mechanical design, autonomous systems hardware integration,
 * automation project delivery and consultancy.
 *
 * Leave under other specialisms: Mechanical (pure design), Electrical (power
 * systems), Electronic (PCB/FPGA/semiconductor), Industrial (lean/OpEx
 * optimisation), Robotics Engineering (platform/robotics-specialist titles),
 * AI / Software (pure AI software roles).
 *
 * Sources: National Careers Service (robotics/automation), Prospects (C&I),
 * Engineering Council, IET, IMechE, InstMC, Skills England electro-mechanical,
 * WorldSkills UK mechatronics pathways.
 *
 *   npx tsx scripts/populate-career-library-mechatronics-engineering-roles.ts
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
    name: 'Graduate Mechatronics Engineer',
    description:
      'Entry UK role on a structured graduate scheme integrating mechanical, electrical/electronic and control elements of automated products or production cells toward IET/IMechE professional development.',
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
      'Immediate graduate-entry mechatronics role. IET/IMechE membership and later IEng/CEng are development goals, not start gates.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'Automation Engineer (Graduate)',
    description:
      'Supports design, programming and commissioning of automated machinery and production cells in UK manufacturing and process environments.',
    roleCategory: 'professional_practice',
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
      'Immediate automation pathway within Mechatronics — not Industrial Engineering lean/OpEx optimisation titles.',
    fitClassification: 'immediate',
    priority: 20,
  },
  {
    name: 'PLC Engineer (Graduate / Junior)',
    description:
      'Supports PLC software development, I/O commissioning and fault-finding on industrial control panels and automated lines.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes; placement or hobby PLC projects helpful',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate PLC pathway. Distinct from Electrical power systems and Electronic PCB/FPGA design roles.',
    fitClassification: 'immediate',
    priority: 30,
  },
  {
    name: 'Control Systems Engineer (Mechatronics) — Graduate',
    description:
      'Supports closed-loop control, sensors/actuators integration and basic tuning for machines, robots or automated test rigs.',
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
      'Mechatronics/machine control focus — not Electrical grid/protection control systems titles.',
    fitClassification: 'immediate',
    priority: 40,
  },
  {
    name: 'Electro-Mechanical Design Engineer (Graduate)',
    description:
      'Supports integrated electro-mechanical product or machine design, combining mechanisms, actuators, sensors and control interfaces under senior engineers.',
    roleCategory: 'design',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes; CAD and basic controls exposure helpful',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Integrated electro-mechanical design — not pure Mechanical Design Engineering without controls/electronics integration.',
    fitClassification: 'immediate',
    priority: 50,
  },
  {
    name: 'Robotics Integration Engineer (Graduate)',
    description:
      'Supports installation, programming and cell integration of industrial robots with conveyors, tooling, safety systems and PLC/HMI interfaces.',
    roleCategory: 'site_delivery',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes; robotics competition/placement helpful',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Industrial robotics integration within Mechatronics — platform/robotics-specialist R&D titles reserved for Robotics Engineering.',
    fitClassification: 'immediate',
    priority: 60,
  },
  {
    name: 'SCADA Engineer (Junior)',
    description:
      'Supports SCADA/HMI configuration, alarm management and plant visualisation interfaces linked to PLC/DCS automation layers.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years PLC/automation support experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Realistic next step after graduate PLC/automation exposure. Not a pure AI/software engineering role.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Motion Control Engineer (Junior)',
    description:
      'Supports servo/stepper drives, multi-axis motion profiles and synchronisation for packaging, machining or robotic cells.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years drives/motion or automation experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Mechatronics motion systems focus — not Electrical machines/power conversion research titles.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Assistant Automation Project Engineer',
    description:
      'Supports automation work packages through design, procurement, installation and commissioning under a project lead.',
    roleCategory: 'project_management',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–2 years automation or controls support experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Assistant-level automation project delivery. Full package ownership is not implied by academic stage alone.',
    fitClassification: 'realistic_next',
    priority: 90,
  },
  {
    name: 'Mechatronics Engineering Technician / EngTech pathway',
    description:
      'Provides build, wiring, commissioning or maintenance support on mechatronic systems; may align with EngTech development via IET or IMechE.',
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
    name: 'Industrial Automation Engineer',
    description:
      'Designs and delivers industrial automation architectures spanning PLC/DCS, safety systems, drives and machine interfaces for UK manufacturing sites.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years industrial automation experience; MSc often valued',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s-relevant specialist role. The MSc alone does not confer mid-level ownership of plant automation.',
    fitClassification: 'realistic_next',
    priority: 10,
  },
  {
    name: 'Mechatronic Systems Engineer',
    description:
      'Owns multidisciplinary system design for mechatronic products or machines, balancing mechanisms, electronics, control software and validation.',
    roleCategory: 'design',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years mechatronics product or machine systems experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Integrated systems ownership needs project delivery experience beyond postgraduate study.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'Machine Vision Engineer',
    description:
      'Specifies and integrates industrial vision systems for inspection, guidance and quality control on automated production lines.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years vision/automation integration experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Industrial machine-vision integration — not pure AI/software computer-vision research roles.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Manufacturing Automation Engineer',
    description:
      'Delivers automation of manufacturing processes including cell layout interfaces, tooling automation, safety and throughput reliability.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years manufacturing automation experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Automation technology delivery focus — manufacturing optimisation/lean OpEx remains under Industrial Engineering.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Intelligent Manufacturing / Smart Factory Mechatronics Engineer',
    description:
      'Integrates connected machines, sensors, edge controllers and automation layers that enable smart-factory mechatronic cells.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–7 years automation/mechatronics and digital factory experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Mechatronics/OT integration for smart factories — not Industrial Engineering factory optimisation specialist titles, and not pure AI software roles.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Embedded Mechatronics Engineer',
    description:
      'Develops firmware and real-time control embedded in mechatronic products, linking sensors, actuators and supervisory automation.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years embedded controls in mechatronic products',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Embedded control for mechatronic systems — PCB/FPGA/semiconductor hardware design stays under Electronic Engineering.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Autonomous Systems Engineer (Mechatronics)',
    description:
      'Integrates sensing, actuation and onboard control for autonomous mobile robots, AGVs or inspection platforms in industrial settings.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–7 years robotics/autonomy hardware-software integration',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Mechatronics autonomy integration — perception/AI software stacks belong under AI / Software Engineering; platform robotics R&D may sit in Robotics Engineering.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Automation Project Engineer',
    description:
      'Leads automation project work packages through design, FAT/SAT, installation and handover for industrial clients or in-house manufacturing.',
    roleCategory: 'project_management',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years automation project delivery experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Experience-led project progression commonly strengthened by postgraduate controls/mechatronics study — not automatic seniority from a Master’s.',
    fitClassification: 'future_progression',
    priority: 80,
  },
  {
    name: 'Senior Control Systems Engineer (Mechatronics / Automation)',
    description:
      'Leads advanced control strategies, commissioning standards and technical assurance for complex automated machines or plant cells.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'senior',
    minimumExperienceYears: 6,
    experienceRequirementLabel: 'Typically 6+ years controls/automation delivery experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Senior control ownership needs demonstrated competence. Academic stage alone is not seniority. Distinct from Electrical industrial control titles.',
    fitClassification: 'future_progression',
    priority: 90,
  },
  {
    name: 'Automation Consultant',
    description:
      'Advises manufacturers and OEMs on automation architecture, vendor selection, safety interfaces and upgrade roadmaps for mechatronic systems.',
    roleCategory: 'consultancy',
    seniorityLevel: 'senior',
    minimumExperienceYears: 6,
    experienceRequirementLabel: 'Typically 6+ years industrial automation delivery experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Consultancy progression requires delivery track record beyond postgraduate study. CEng via IET/IMechE/InstMC commonly expected.',
    fitClassification: 'future_progression',
    priority: 100,
  },
]

const PHD_ROLES: RoleSeed[] = [
  {
    name: 'Research Associate / Postdoctoral Researcher (Mechatronics)',
    description:
      'Conducts postdoctoral research in mechatronic systems, control, robotics integration or intelligent automation in UK universities or research centres.',
    roleCategory: 'research',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'PhD (or near completion) in mechatronics, control or closely related field',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Academic/research fit. A PhD is not automatic industry seniority for plant automation ownership.',
    fitClassification: 'academic_or_research',
    priority: 10,
  },
  {
    name: 'University Lecturer / Assistant Professor (Mechatronics Engineering)',
    description:
      'Delivers teaching and research in mechatronics, automation or control systems programmes within UK higher education.',
    roleCategory: 'academic',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'PhD typically required; teaching/research track record expected',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: true,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Academic career pathway. Not an industry chartered-engineer seniority substitute.',
    fitClassification: 'academic_or_research',
    priority: 20,
  },
  {
    name: 'Robotics R&D Engineer (Mechatronics Systems)',
    description:
      'Researches and prototypes mechatronic robot subsystems — mechanisms, actuators, sensors and real-time control — for industrial or applied robotics programmes.',
    roleCategory: 'research',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'PhD or strong research track record in mechatronics/robotics systems',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Mechatronics systems R&D — pure AI software/ML perception stacks sit under AI / Software; dedicated robotics-platform specialism may sit under Robotics Engineering.',
    fitClassification: 'academic_or_research',
    priority: 30,
  },
  {
    name: 'Advanced Control / Cyber-Physical Systems Research Specialist',
    description:
      'Advances model-based control, digital twins or cyber-physical methods for mechatronic machines and automated cells.',
    roleCategory: 'research',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'PhD with advanced control or cyber-physical systems research',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Research specialist fit. Industry principal control authority roles additionally need plant delivery experience.',
    fitClassification: 'academic_or_research',
    priority: 40,
  },
  {
    name: 'Human–Robot Collaboration / Soft Robotics Research Specialist',
    description:
      'Researches collaborative robot cells, safety interaction or soft/adaptive mechatronic actuation for industrial and applied settings.',
    roleCategory: 'research',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'PhD with HRC, soft robotics or interactive mechatronics research',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Mechatronics/HRC research focus — not Industrial Engineering human-factors work-systems titles alone.',
    fitClassification: 'academic_or_research',
    priority: 50,
  },
  {
    name: 'Machine Vision / Sensing Systems Research Specialist (Mechatronics)',
    description:
      'Researches sensing, inspection and guidance methods tightly coupled to mechatronic actuation and industrial automation cells.',
    roleCategory: 'research',
    seniorityLevel: 'academic_research',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'PhD with industrial vision/sensing for mechatronic systems',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Vision coupled to mechatronic systems — standalone AI computer-vision software roles remain under AI / Software Engineering.',
    fitClassification: 'academic_or_research',
    priority: 60,
  },
  {
    name: 'Innovation / Industrial R&D Engineer (Mechatronics & Automation)',
    description:
      'Leads applied R&D for new mechatronic products, automation cells or digital manufacturing hardware-software platforms in industry.',
    roleCategory: 'research',
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel: 'Typically 5+ years R&D or advanced engineering delivery; PhD often valued',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Industry R&D progression needs delivery experience beyond the PhD award itself.',
    fitClassification: 'future_progression',
    priority: 70,
  },
  {
    name: 'Principal / Specialist Mechatronics Consultant',
    description:
      'Provides expert advisory on mechatronic architecture, automation strategy, safety interfaces and complex system integration for OEMs and manufacturers.',
    roleCategory: 'consultancy',
    seniorityLevel: 'principal',
    minimumExperienceYears: 8,
    experienceRequirementLabel: 'Typically 8+ years mechatronics/automation delivery; deep domain expertise',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Principal consultancy progression needs track record beyond doctoral study. CEng via IET/IMechE/InstMC commonly expected.',
    fitClassification: 'future_progression',
    priority: 80,
  },
  {
    name: 'Technical Authority / Lead Mechatronics Engineer',
    description:
      'Sets technical standards and assures complex mechatronic or automation programmes across design, safety and commissioning.',
    roleCategory: 'leadership',
    seniorityLevel: 'leadership',
    minimumExperienceYears: 10,
    experienceRequirementLabel: 'Typically 10+ years mechatronics/automation leadership experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Leadership progression based on delivery experience. Doctoral study alone does not create technical-authority seniority.',
    fitClassification: 'future_progression',
    priority: 90,
  },
  {
    name: 'Research & Innovation Manager (Mechatronics / Automation)',
    description:
      'Manages research portfolios and innovation programmes spanning mechatronic systems, industrial automation and applied robotics integration.',
    roleCategory: 'leadership',
    seniorityLevel: 'leadership',
    minimumExperienceYears: 8,
    experienceRequirementLabel: 'Typically 8+ years research/innovation leadership in mechatronics or automation',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
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
  'electrical-engineering',
  'electronic-engineering',
  'industrial-engineering',
  'robotics-engineering',
  'robotics',
  'artificial-intelligence',
  'ai-software-engineering',
  'software-engineering',
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
        specialism_slug: 'mechatronics',
        country_focus: 'uk',
        professional_body_focus: 'Institution of Engineering and Technology (IET)',
        related_bodies: [
          'Institution of Mechanical Engineers (IMechE)',
          'Institute of Measurement and Control (InstMC)',
          'Engineering Council',
        ],
        eligibility_model_version: 1,
        sources: [
          'national_careers_service_robotics_engineer',
          'prospects_control_and_instrumentation_engineer',
          'skills_england_electro_mechanical_engineer',
          'worldskills_uk_mechatronics',
          'iet_professional_registration',
          'imeche_professional_registration',
          'engineering_council_ceng_pathway',
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
    .select('id, name, slug, professional_body, regulated_profession')
    .eq('slug', 'mechatronics')
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(
      `Mechatronics specialism not found: ${specErr?.message ?? 'missing row'}`
    )
  }

  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({
        professional_body: 'Institution of Engineering and Technology (IET)',
        regulated_profession: true,
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

  console.log('\n=== Mechatronics Engineering roles populate summary ===')
  console.log(`Specialism: ${specialism.name} (${specialism.slug})`)
  console.log(`Stage model: academic_level`)
  console.log(`Status: draft`)
  console.log(`Roles created this run: ${totalCreated}`)
  console.log(`Duplicates skipped (same specialism): ${sameSpecSkipped}`)
  console.log(
    `Duplicates skipped (exact title overlap with Mechanical/Electrical/Electronic/Industrial/Robotics/AI-Software): ${crossSkipped.length}`
  )
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
