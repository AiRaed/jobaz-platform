/**
 * Populate Career Knowledge Library roles for Electronic Engineering only.
 *
 * Focus: embedded, PCB, microelectronics, semiconductors, FPGA/ASIC, digital/
 * analogue electronics, RF, telecoms electronics, signal processing, IoT
 * hardware, consumer electronics, electronic test & validation.
 *
 * Leave under Electrical Engineering: power systems, HV, substations, building
 * services electrical, renewable integration, industrial power distribution.
 *
 * Sources: National Careers Service, Prospects, IET, Skills England OCC0151.
 *
 *   npx tsx scripts/populate-career-library-electronic-engineering-roles.ts
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
    name: 'Graduate Electronics Engineer',
    description:
      'Entry UK role on a structured graduate scheme supporting circuit design, prototyping and test toward IET professional development.',
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
      'Immediate graduate-entry role. IET membership supports later IEng/CEng progression but is not required to start.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'Embedded Systems Engineer (Graduate)',
    description:
      'Supports microcontroller-based hardware/firmware development for products in aerospace, automotive, IoT and consumer electronics.',
    roleCategory: 'design',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes or strong embedded project portfolio',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate or near-term UK pathway (including Level 6 embedded apprenticeships). Senior product ownership still needs delivery experience.',
    fitClassification: 'immediate',
    priority: 20,
  },
  {
    name: 'PCB Design Engineer',
    description:
      'Creates schematic capture and PCB layouts for multilayer boards, working with manufacturing constraints and EMC good practice.',
    roleCategory: 'design',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years PCB/layout experience or strong placement',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Degree relevance is strong; production-ready multilayer PCB ownership usually needs applied layout and DFM experience.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Digital Electronics Design Engineer',
    description:
      'Designs digital circuits and logic for boards and modules using HDL or discrete digital components under senior supervision.',
    roleCategory: 'design',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years digital electronics experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Academic stage indicates relevance; signing off complex digital designs depends on verification and product experience.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Analogue Electronics Design Engineer',
    description:
      'Designs analogue front-ends, amplifiers, power management for boards, and sensor interfaces for electronic products.',
    roleCategory: 'design',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years analogue design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Degree makes the role academically relevant; competent analogue practice needs lab measurement and design-for-manufacture exposure.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Electronics Test and Validation Engineer',
    description:
      'Plans and runs electronic hardware tests, analyses results and supports product validation against UK and customer specifications.',
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
      'Often realistic soon after graduation where lab/test experience exists. Senior validation authority still requires deeper product experience.',
    fitClassification: 'immediate',
    priority: 60,
  },
  {
    name: 'IoT Hardware Engineer (Graduate)',
    description:
      'Supports sensor, connectivity and low-power electronics design for Internet of Things devices and edge hardware platforms.',
    roleCategory: 'design',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry possible with IoT/hardware project experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Growing UK pathway in tech/SMEs. Lead hardware ownership for certified products usually needs compliance and delivery experience.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Hardware Design Engineer (Electronics)',
    description:
      'Develops electronic hardware assemblies from concept through schematic, board bring-up and design iterations for manufacturable products.',
    roleCategory: 'design',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years electronics hardware design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Common UK electronics title. Academic relevance does not equal unsupervised product release responsibility.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Assistant Project Engineer (Electronics)',
    description:
      'Supports electronics work packages through design and delivery, coordinating suppliers, schedules and documentation under a project lead.',
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
      'Assistant-level project delivery. Full package ownership is not implied by academic stage alone.',
    fitClassification: 'realistic_next',
    priority: 90,
  },
  {
    name: 'Electronics Engineering Technician / EngTech pathway',
    description:
      'Provides assembly, test, rework or drawing technical support; may align with EngTech or IEng development routes via the IET.',
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
    name: 'FPGA Design Engineer',
    description:
      'Designs and verifies programmable logic using VHDL/Verilog for high-performance digital systems in aerospace, telecoms and industrial electronics.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years FPGA / HDL design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'A Master’s strengthens academic fit for FPGA roles; competent practice still depends on timing closure, verification and product delivery experience.',
    fitClassification: 'realistic_next',
    priority: 10,
  },
  {
    name: 'ASIC Design Engineer',
    description:
      'Contributes to application-specific IC design, RTL development and design-for-test flows within semiconductor or fabless design teams.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years ASIC / digital IC design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s relevance does not replace silicon design-cycle experience. Not an immediate graduate role.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'RF / Microwave Electronics Engineer',
    description:
      'Designs and characterises RF circuits, antennas interfaces and microwave modules for communications, defence and instrumentation products.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years RF / microwave design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s study is strongly relevant; lab measurement and productisation experience remain essential.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Signal Processing Engineer (Electronics / DSP)',
    description:
      'Implements and optimises digital signal processing algorithms on hardware platforms for communications, sensing or audio/electronics products.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years DSP / signal processing experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s strengthens academic fit. Real-time product delivery experience still determines mid-level suitability.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Semiconductor Device / Process Engineer',
    description:
      'Supports semiconductor device characterisation, process integration or yield improvement within UK fabs, foundry partners or research facilities.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years semiconductor device/process experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Common in UK semiconductor clusters. Master’s helps academically; cleanroom/process experience is usually required.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Telecommunications Electronics Engineer',
    description:
      'Designs and develops electronic hardware for telecoms, wireless or networking equipment, including RF and baseband interfaces.',
    roleCategory: 'design',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years telecoms electronics experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Focused on electronics for telecoms products — not power-network engineering (Electrical Engineering).',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Embedded Systems Engineer (Advanced)',
    description:
      'Leads complex embedded hardware/firmware development, RTOS integration and low-level bring-up for safety- or performance-critical products.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years embedded systems experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s relevance does not replace multi-project embedded delivery experience.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Electronics Verification Engineer',
    description:
      'Plans and executes hardware verification, including simulation, lab bring-up, EMC pre-compliance support and defect root-cause analysis.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years electronics verification experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Academic stage indicates relevance; release sign-off responsibility needs demonstrated verification ownership.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Senior Electronics Design Engineer',
    description:
      'Leads complex electronics design packages, mentoring juniors and coordinating multidisciplinary hardware design reviews.',
    roleCategory: 'design',
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel: 'Typically 5–8 years progressive electronics design experience',
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
    name: 'Lead Electronics / Hardware Engineer',
    description:
      'Acts as technical lead for electronics hardware scope on larger programmes, setting standards and resolving critical design issues.',
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
    name: 'Research Associate / Postdoctoral Researcher (Electronic Engineering)',
    description:
      'Conducts funded research in universities or research centres on advanced electronic engineering topics and publications.',
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
      'Immediate or near-term academic/research fit after PhD. Not a senior industry practice role.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'University Lecturer / Assistant Professor (Electronic Engineering)',
    description:
      'Teaches electronic engineering modules and supervises student projects while developing an academic research portfolio.',
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
    name: 'Microelectronics / Semiconductor Research Specialist',
    description:
      'Researches semiconductor devices, microelectronic processes or novel electronic materials for academia or industrial R&D.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years semiconductor / microelectronics research experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Strong PhD relevance. Senior industry process ownership still depends on fab/line delivery experience.',
    fitClassification: 'academic_or_research',
    priority: 30,
  },
  {
    name: 'RF / Microwave Research Specialist',
    description:
      'Develops advanced RF, microwave or mmWave electronic techniques for communications, sensing or defence research programmes.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years RF research or specialist experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD supports academic relevance; client-facing specialist authority grows with applied product experience.',
    fitClassification: 'academic_or_research',
    priority: 40,
  },
  {
    name: 'Signal Processing Research Specialist',
    description:
      'Researches advanced signal processing methods for electronics, communications or sensing systems in universities or industrial labs.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years signal-processing research experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Realistic academic/research fit after PhD. Not equivalent to principal consultancy authority.',
    fitClassification: 'academic_or_research',
    priority: 50,
  },
  {
    name: 'Advanced Digital Hardware / FPGA Specialist',
    description:
      'Leads research-led FPGA or digital architecture work for high-performance electronics in industry R&D or specialist consultancies.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years advanced digital hardware experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD can strengthen specialist credibility; substantial HDL/product delivery experience remains essential.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Innovation / Industrial R&D Engineer (Electronics)',
    description:
      'Leads new electronics, semiconductor or connected-device research within industrial R&D or collaborative UK programmes.',
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
    name: 'Principal / Specialist Electronics Consultant',
    description:
      'Provides expert electronics advice on complex hardware integrity, failure investigation and high-risk product or semiconductor problems.',
    roleCategory: 'consultancy',
    seniorityLevel: 'principal',
    minimumExperienceYears: 12,
    experienceRequirementLabel: 'Typically 12+ years specialist electronics consulting experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'PhD may support specialist credibility, but principal consulting requires substantial industry experience and usually chartered status. Not an immediate PhD role.',
    fitClassification: 'future_progression',
    priority: 80,
  },
  {
    name: 'Technical Authority / Expert Witness (Electronic Engineering)',
    description:
      'Acts as a recognised technical authority on disputes, standards development and highly specialised electronic engineering problems.',
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
    name: 'Research & Innovation Manager (Electronics / Semiconductors)',
    description:
      'Manages research programmes, industry–university partnerships and innovation funding for electronics and semiconductor technology.',
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
  'civil-engineering',
  'mechanical-engineering',
  'electrical-engineering',
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
        specialism_slug: 'electronic-engineering',
        country_focus: 'uk',
        professional_body_focus: 'IET',
        eligibility_model_version: 1,
        sources: [
          'national_careers_service_electronics_engineer',
          'prospects_electronics_engineer',
          'iet_ceng_ieng_pathway',
          'skills_england_embedded_electronic_systems_occ0151',
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
    .eq('slug', 'electronic-engineering')
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(
      `Electronic Engineering specialism not found: ${specErr?.message ?? 'missing row'}`
    )
  }

  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({
        professional_body: 'Institution of Engineering and Technology (IET)',
      })
      .eq('id', specialism.id)
  }

  // Cross-check sibling specialisms for exact title overlaps (report only; do not insert those)
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

  console.log('\n=== Electronic Engineering roles populate summary ===')
  console.log(`Specialism: ${specialism.name} (${specialism.slug})`)
  console.log(`Stage model: academic_level`)
  console.log(`Status: draft`)
  console.log(`Roles created this run: ${totalCreated}`)
  console.log(`Duplicates skipped (same specialism): ${sameSpecSkipped}`)
  console.log(
    `Duplicates skipped (exact title overlap with Civil/Mechanical/Electrical): ${crossSkipped.length}`
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
