/**
 * Populate Career Knowledge Library roles for Chemical Engineering only.
 *
 * Focus: process engineering/design/safety, chemical manufacturing, petrochemicals,
 * pharma, F&B processing, energy & hydrogen, carbon capture, water treatment,
 * bioprocess, materials processing, industrial chemistry, sustainable manufacturing,
 * process optimisation.
 *
 * Leave under other specialisms: Petroleum Engineering, Environmental Engineering,
 * Mechanical Plant Design, Electrical Power Systems.
 *
 * Sources: National Careers Service, Prospects, IChemE (CEng MIChemE / PPSE).
 *
 *   npx tsx scripts/populate-career-library-chemical-engineering-roles.ts
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
    name: 'Graduate Chemical / Process Engineer',
    description:
      'Entry UK role on a structured graduate scheme supporting process plant operations, design support and IChemE professional development.',
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
      'Immediate graduate-entry role. IChemE membership supports later CEng MIChemE progression but is not required to start.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'Process Engineer (Manufacturing)',
    description:
      'Supports day-to-day chemical or process plant operations, troubleshooting and continuous improvement on UK manufacturing sites.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years plant or process experience or strong placement',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Common UK destination after a chemical engineering degree. Unsupervised plant responsibility grows with operational experience.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'Process Design Engineer (Junior)',
    description:
      'Assists with process flowsheets, mass/energy balances and equipment sizing under supervision in design offices or EPC teams.',
    roleCategory: 'design',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years process design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Degree relevance is strong; signing off process design packages depends on project delivery experience.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Pharmaceutical Process Engineer (Graduate)',
    description:
      'Supports process development, tech transfer and manufacturing support for UK pharmaceutical or biopharma production.',
    roleCategory: 'graduate_entry',
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
      'Immediate graduate pathway into UK pharma manufacturing. GMP ownership and senior process authority come later with experience.',
    fitClassification: 'immediate',
    priority: 40,
  },
  {
    name: 'Food and Beverage Process Engineer',
    description:
      'Supports process improvement, hygiene-critical manufacturing and scale-up in UK food and drink production facilities.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years food/beverage process experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Common UK process sector for chemical engineers. Hygiene and food-safety competence develop through site experience.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Process Safety Engineer (Graduate / Junior)',
    description:
      'Supports hazard studies, risk assessments and process safety documentation under senior process safety engineers.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years process or HSE-related experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Early-career support role. Acting as process safety lead or Professional Process Safety Engineer requires substantial experience.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Water Treatment Process Engineer (Graduate)',
    description:
      'Supports process design and operations for municipal or industrial water and wastewater treatment plants in the UK.',
    roleCategory: 'graduate_entry',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes in water utilities or consultancies',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate graduate pathway focused on process treatment — not broader Environmental Engineering specialism roles.',
    fitClassification: 'immediate',
    priority: 70,
  },
  {
    name: 'Petrochemical Process Engineer (Graduate)',
    description:
      'Supports refining or petrochemical process units, monitoring performance and assisting with optimisation under supervision.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate schemes; site safety training required',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Focused on process plant conversion — not reservoir/drilling Petroleum Engineering roles.',
    fitClassification: 'immediate',
    priority: 80,
  },
  {
    name: 'Assistant Project Engineer (Process)',
    description:
      'Supports process-related work packages through design and delivery, coordinating suppliers, schedules and documentation under a project lead.',
    roleCategory: 'project_management',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–2 years project or process support experience',
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
    name: 'Chemical Engineering Technician / EngTech pathway',
    description:
      'Provides plant, laboratory or drawing technical support; may align with EngTech or IEng development routes via IChemE.',
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
    name: 'Process Design Engineer',
    description:
      'Delivers process design packages including P&IDs, simulations and equipment specifications for UK process plant projects.',
    roleCategory: 'design',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years process design experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'A Master’s strengthens academic fit for complex design; package ownership still depends on project experience.',
    fitClassification: 'realistic_next',
    priority: 10,
  },
  {
    name: 'Process Safety Engineer',
    description:
      'Leads HAZOP/LOPA support, process hazard analysis and safety case inputs for operating plants and new process designs.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years process safety experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Master’s relevance does not replace process safety competence. Professional Process Safety Engineer status requires substantial experience.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'Process Optimisation / Continuous Improvement Engineer',
    description:
      'Analyses plant performance, debottlenecks processes and implements yield, energy and quality improvements on operating assets.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years manufacturing process experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Academic stage indicates relevance; optimisation leadership needs demonstrated plant delivery results.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Bioprocess Engineer',
    description:
      'Designs or supports upstream/downstream bioprocessing for biopharma, industrial biotechnology or fermentation-based manufacture.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–4 years bioprocess or biotech manufacturing experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s in biochemical/bioprocess engineering is strongly relevant; GMP scale-up competence comes from project experience.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Hydrogen / Low-Carbon Process Engineer',
    description:
      'Supports process design and integration of hydrogen production, storage interfaces and low-carbon process systems for UK energy projects.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years process or energy-systems experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Focused on chemical/process conversion routes — not Electrical renewable grid integration or Petroleum reservoir roles.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Carbon Capture Process Engineer',
    description:
      'Designs or assesses capture, solvent/adsorbent and process integration options for industrial carbon capture projects.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years process design or CCS-related experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s study supports academic relevance; FEED/delivery competence comes from project experience.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Materials Processing Engineer',
    description:
      'Applies chemical engineering methods to polymer, specialty chemical or advanced materials processing and scale-up.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years materials or chemical process experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Process-focused materials conversion role — distinct from Mechanical materials design/tribology specialisms.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Sustainable Manufacturing / Green Process Engineer',
    description:
      'Improves process sustainability through energy efficiency, waste minimisation, circular feedstocks and cleaner production methods.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years process manufacturing experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Academic stage indicates relevance; plant change ownership needs demonstrated manufacturing delivery experience.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Senior Process Engineer',
    description:
      'Leads complex process engineering packages, mentoring juniors and resolving critical plant or design issues.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel: 'Typically 5–8 years progressive process engineering experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'May appear for Master’s graduates as future progression. A Master’s alone does not qualify someone for senior process leadership.',
    fitClassification: 'future_progression',
    priority: 90,
  },
  {
    name: 'Lead Process / Project Engineer (Chemical)',
    description:
      'Acts as technical lead for process scope on larger programmes, setting standards and coordinating multidisciplinary delivery.',
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
    name: 'Research Associate / Postdoctoral Researcher (Chemical Engineering)',
    description:
      'Conducts funded research in universities or research centres on advanced chemical/process engineering topics and publications.',
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
    name: 'University Lecturer / Assistant Professor (Chemical Engineering)',
    description:
      'Teaches chemical engineering modules and supervises student projects while developing an academic research portfolio.',
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
    name: 'Process Systems / Modelling Research Specialist',
    description:
      'Develops advanced process modelling, simulation and optimisation methods for research-led design and industrial innovation.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years modelling research or applied specialist experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Strong PhD relevance for advanced modelling. Senior plant authority still depends on applied delivery experience.',
    fitClassification: 'academic_or_research',
    priority: 30,
  },
  {
    name: 'Bioprocess / Biochemical Engineering Research Specialist',
    description:
      'Researches bioprocess design, fermentation, downstream processing or biomanufacturing methods in academia or industrial R&D.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years bioprocess research or specialist experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD supports academic relevance; GMP manufacturing authority grows through applied scale-up experience.',
    fitClassification: 'academic_or_research',
    priority: 40,
  },
  {
    name: 'Catalysis / Reaction Engineering Specialist',
    description:
      'Specialises in reaction engineering, catalysis and reactor design for chemicals, energy carriers or sustainable processes.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years catalysis / reaction engineering experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD is often valuable for reaction engineering specialism; industrial authority grows through scale-up and plant application.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Carbon Capture / Hydrogen Systems Research Specialist',
    description:
      'Researches capture solvents, hydrogen process routes or integrated low-carbon process systems for UK energy transition programmes.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years CCS/hydrogen research or specialist experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Realistic academic/research fit after PhD. Not equivalent to principal process consultancy authority.',
    fitClassification: 'academic_or_research',
    priority: 60,
  },
  {
    name: 'Innovation / Industrial R&D Engineer (Process / Chemicals)',
    description:
      'Leads new process, product or sustainable manufacturing research within industrial R&D or collaborative UK programmes.',
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
    name: 'Principal / Specialist Process Safety Consultant',
    description:
      'Provides expert process safety advice on major hazard facilities, safety cases and complex risk assessment for UK operators.',
    roleCategory: 'consultancy',
    seniorityLevel: 'principal',
    minimumExperienceYears: 12,
    experienceRequirementLabel: 'Typically 12+ years specialist process safety experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'PhD may support credibility, but principal process safety consulting requires substantial industry experience and usually chartered / PPSE-level competence. Not an immediate PhD role.',
    fitClassification: 'future_progression',
    priority: 80,
  },
  {
    name: 'Technical Authority / Expert Witness (Chemical / Process Engineering)',
    description:
      'Acts as a recognised technical authority on disputes, standards development and highly specialised process engineering problems.',
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
    name: 'Research & Innovation Manager (Chemical / Process Systems)',
    description:
      'Manages research programmes, industry–university partnerships and innovation funding for chemical and process technology.',
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
  'electronic-engineering',
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
        specialism_slug: 'chemical-engineering',
        country_focus: 'uk',
        professional_body_focus: 'IChemE',
        eligibility_model_version: 1,
        sources: [
          'national_careers_service_chemical_engineer',
          'prospects_chemical_engineer',
          'icheme_chartered_membership',
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
    .eq('slug', 'chemical-engineering')
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(
      `Chemical Engineering specialism not found: ${specErr?.message ?? 'missing row'}`
    )
  }

  // IChemE / Chartered Chemical Engineer pathway — update body only if missing
  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({
        professional_body: 'Institution of Chemical Engineers (IChemE)',
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

  console.log('\n=== Chemical Engineering roles populate summary ===')
  console.log(`Specialism: ${specialism.name} (${specialism.slug})`)
  console.log(`Stage model: academic_level`)
  console.log(`Status: draft`)
  console.log(`Roles created this run: ${totalCreated}`)
  console.log(`Duplicates skipped (same specialism): ${sameSpecSkipped}`)
  console.log(
    `Duplicates skipped (exact title overlap with Civil/Mechanical/Electrical/Electronic): ${crossSkipped.length}`
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
