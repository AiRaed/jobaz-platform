/**
 * Populate Career Knowledge Library roles for Environmental Engineering only.
 *
 * Focus: environmental consultancy/EIA, contaminated land, waste, pollution/
 * air quality/noise, water & wastewater (environmental), flood/drainage support,
 * compliance/permitting, remediation, circular economy, carbon, climate
 * adaptation, monitoring, sustainability engineering.
 *
 * Boundaries: detailed hydraulics → Water Engineering; process plant → Chemical;
 * pure ecology/science → Environmental Science; grid/power → Electrical/Renewables.
 *
 * Sources: Prospects, National Careers Service (consultant), CIWEM, IEMA, ICE/CEng.
 *
 *   npx tsx scripts/populate-career-library-environmental-engineering-roles.ts
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
    name: 'Graduate Environmental Engineer',
    description:
      'Entry UK role in consultancy, utilities or public sector supporting environmental assessments, monitoring and mitigation design toward CIWEM/ICE professional development.',
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
      'Immediate graduate-entry role. CIWEM/ICE/IEMA membership supports later CEng/C.WEM/CEnv progression but is not required to start.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'Junior Environmental Consultant (Engineering)',
    description:
      'Supports site assessments, baseline data collection and technical reporting for development and industrial projects under senior consultants.',
    roleCategory: 'consultancy',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate consultancy schemes',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Engineering-focused consultancy pathway — not pure ecology/conservation Environmental Science roles.',
    fitClassification: 'immediate',
    priority: 20,
  },
  {
    name: 'Contaminated Land Engineer (Graduate)',
    description:
      'Supports Phase 1/2 contaminated-land desk studies, site investigation coordination and preliminary risk assessments.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate geo-environmental schemes',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate contaminated-land pathway. Signing off remediation strategies needs supervised project experience.',
    fitClassification: 'immediate',
    priority: 30,
  },
  {
    name: 'Waste Management Engineer (Junior)',
    description:
      'Supports waste hierarchy assessments, treatment optioneering and compliance for municipal or industrial waste streams.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years waste or environmental operations experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Waste engineering/compliance focus — not Chemical process-plant design for petrochemicals.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Environmental Compliance Engineer (Graduate)',
    description:
      'Supports environmental management systems, audits and regulatory compliance tracking for industrial or infrastructure operators.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate EMS/compliance schemes',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate compliance support pathway. Competent person / permit holder authority comes later with experience.',
    fitClassification: 'immediate',
    priority: 50,
  },
  {
    name: 'Air Quality Engineer (Junior)',
    description:
      'Supports air-quality assessments, emissions inventories and mitigation advice for planning and industrial projects.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–3 years air quality / environmental assessment experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Engineering assessment focus — not pure atmospheric science research careers without an engineering component.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Remediation Engineer (Graduate)',
    description:
      'Supports design and delivery of land remediation schemes, including contractor liaison and verification sampling.',
    roleCategory: 'site_delivery',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry possible; site safety training required',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate remediation support pathway. Lead designer / verifier status needs project experience.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Environmental Monitoring Engineer (Graduate)',
    description:
      'Supports environmental monitoring programmes for water, air, noise or soil quality, including data QA and reporting.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'entry',
    minimumExperienceYears: 0,
    experienceRequirementLabel: 'Entry via graduate monitoring / field schemes',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'degree_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Immediate monitoring pathway with clear engineering reporting duties.',
    fitClassification: 'immediate',
    priority: 80,
  },
  {
    name: 'Assistant Environmental Project Engineer',
    description:
      'Supports environmental work packages on infrastructure or industrial projects, coordinating surveys, schedules and documentation.',
    roleCategory: 'project_management',
    seniorityLevel: 'early_career',
    minimumExperienceYears: 1,
    experienceRequirementLabel: 'Typically 1–2 years project or consultancy support experience',
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
    name: 'Environmental Engineering Technician / EngTech pathway',
    description:
      'Provides field sampling, data collection or drawing support; may align with EngTech or IEng development via CIWEM/ICE.',
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
    name: 'Geo-environmental / Contaminated Land Engineer',
    description:
      'Delivers contaminated-land risk assessment, investigation design and remediation optioneering for UK development sites.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years geo-environmental experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'A Master’s strengthens academic fit; DQRA/remediation sign-off still depends on project experience.',
    fitClassification: 'realistic_next',
    priority: 10,
  },
  {
    name: 'Environmental Impact Assessment Engineer',
    description:
      'Leads or coordinates EIA technical chapters for infrastructure and industrial projects, including mitigation design inputs.',
    roleCategory: 'consultancy',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years EIA / environmental assessment experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Engineering EIA pathway — ecology-only chapter authorship belongs under Environmental Science / CIEEM routes.',
    fitClassification: 'realistic_next',
    priority: 20,
  },
  {
    name: 'Pollution Control Engineer',
    description:
      'Designs or assesses pollution-control measures for air, water or land pathways at industrial and infrastructure sites.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years pollution control experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Environmental control focus — not Chemical Engineering core process-plant design.',
    fitClassification: 'realistic_next',
    priority: 30,
  },
  {
    name: 'Water and Wastewater Environmental Engineer',
    description:
      'Addresses water quality, treatment process performance and environmental compliance for water and wastewater systems.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years water/wastewater environmental experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Environmental quality/treatment focus. Detailed hydraulic network/infrastructure design sits under Water Engineering / Civil where appropriate.',
    fitClassification: 'realistic_next',
    priority: 40,
  },
  {
    name: 'Flood and Drainage Support Engineer (Environmental)',
    description:
      'Supports SuDS, surface-water management and flood-risk mitigation advice from an environmental engineering perspective.',
    roleCategory: 'design',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years drainage / flood-risk environmental experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Support/mitigation role. Advanced hydraulic modelling and water-infrastructure design remain under Water Engineering / Civil flood roles.',
    fitClassification: 'realistic_next',
    priority: 50,
  },
  {
    name: 'Environmental Permitting Engineer',
    description:
      'Prepares and manages environmental permit applications, variations and compliance evidence for regulated installations.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years permitting / regulatory experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'Regulated pathway. Master’s alone does not confer operator competence or permit-holder authority.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Carbon Management / Sustainability Engineer',
    description:
      'Quantifies carbon footprints, develops reduction pathways and supports sustainable infrastructure decisions for organisations and projects.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years carbon / sustainability engineering experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Engineering sustainability focus — not Renewable Energy / Electrical grid system design.',
    fitClassification: 'realistic_next',
    priority: 70,
  },
  {
    name: 'Circular Economy / Resource Efficiency Engineer',
    description:
      'Designs resource-efficiency and circular-economy interventions for materials, waste and industrial by-product streams.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–5 years resource efficiency experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Master’s relevance does not replace delivery experience on industrial or municipal programmes.',
    fitClassification: 'realistic_next',
    priority: 80,
  },
  {
    name: 'Senior Environmental Engineer',
    description:
      'Leads complex environmental engineering packages, mentoring juniors and coordinating multidisciplinary technical reviews.',
    roleCategory: 'professional_practice',
    seniorityLevel: 'senior',
    minimumExperienceYears: 5,
    experienceRequirementLabel: 'Typically 5–8 years progressive environmental engineering experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'masters_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'May appear for Master’s graduates as future progression. A Master’s alone does not qualify someone for senior technical leadership.',
    fitClassification: 'future_progression',
    priority: 90,
  },
  {
    name: 'Lead Environmental / Climate Adaptation Engineer',
    description:
      'Acts as technical lead for environmental risk, climate adaptation and sustainable infrastructure programmes.',
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
    name: 'Research Associate / Postdoctoral Researcher (Environmental Engineering)',
    description:
      'Conducts funded research in universities or research centres on advanced environmental engineering topics and publications.',
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
      'Immediate or near-term academic/research fit after PhD. Not a senior consultancy authority role.',
    fitClassification: 'immediate',
    priority: 10,
  },
  {
    name: 'University Lecturer / Assistant Professor (Environmental Engineering)',
    description:
      'Teaches environmental engineering modules and supervises student projects while developing an academic research portfolio.',
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
    name: 'Contaminated Land / Remediation Research Specialist',
    description:
      'Researches advanced remediation technologies, contaminant fate modelling or verification methods for land restoration.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years remediation research or specialist experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Strong PhD relevance. Regulatory sign-off authority still depends on applied project experience.',
    fitClassification: 'academic_or_research',
    priority: 30,
  },
  {
    name: 'Air Quality / Pollution Modelling Research Specialist',
    description:
      'Develops advanced air-quality or pollution dispersion models supporting policy, planning and industrial assessment.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years pollution modelling research experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'PhD supports academic relevance; consultancy leadership needs client-delivery experience.',
    fitClassification: 'academic_or_research',
    priority: 40,
  },
  {
    name: 'Climate Adaptation Engineering Research Specialist',
    description:
      'Researches climate-risk adaptation measures for infrastructure and environmental systems in academia or applied R&D.',
    roleCategory: 'research',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 2,
    experienceRequirementLabel: 'Typically 2–5 years climate adaptation research experience',
    professionalRegistrationRequirement: 'none',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Engineering adaptation focus — not pure climate-science careers without an engineering component.',
    fitClassification: 'academic_or_research',
    priority: 50,
  },
  {
    name: 'Waste / Circular Economy Research Specialist',
    description:
      'Researches advanced waste treatment, resource recovery or circular-economy systems for industrial or municipal applications.',
    roleCategory: 'technical_specialist',
    seniorityLevel: 'mid_level',
    minimumExperienceYears: 3,
    experienceRequirementLabel: 'Typically 3–6 years waste/circular-economy research experience',
    professionalRegistrationRequirement: 'desirable',
    professionalMembershipRequirement: 'desirable',
    academicRequirement: 'phd_relevant',
    isResearchRole: true,
    isAcademicRole: false,
    isRegulatedOrRestricted: false,
    eligibilityNote:
      'Realistic research fit after PhD. Not Chemical process-plant principal engineering.',
    fitClassification: 'realistic_next',
    priority: 60,
  },
  {
    name: 'Innovation / Environmental R&D Engineer',
    description:
      'Leads new environmental technology, monitoring or remediation research within consultancies, utilities or collaborative UK programmes.',
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
    name: 'Principal / Specialist Environmental Consultant',
    description:
      'Provides expert environmental engineering advice on complex contamination, permitting and high-risk compliance problems.',
    roleCategory: 'consultancy',
    seniorityLevel: 'principal',
    minimumExperienceYears: 12,
    experienceRequirementLabel: 'Typically 12+ years specialist environmental consulting experience',
    professionalRegistrationRequirement: 'commonly_expected',
    professionalMembershipRequirement: 'commonly_expected',
    academicRequirement: 'phd_relevant',
    isResearchRole: false,
    isAcademicRole: false,
    isRegulatedOrRestricted: true,
    eligibilityNote:
      'PhD may support credibility, but principal consulting requires substantial industry experience and usually chartered status (CEng/C.WEM/CEnv). Not an immediate PhD role.',
    fitClassification: 'future_progression',
    priority: 80,
  },
  {
    name: 'Technical Authority / Expert Witness (Environmental Engineering)',
    description:
      'Acts as a recognised technical authority on disputes, regulatory cases and highly specialised environmental engineering problems.',
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
    name: 'Research & Innovation Manager (Environmental Systems)',
    description:
      'Manages research programmes, industry–university partnerships and innovation funding for environmental engineering and sustainability technology.',
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
  'chemical-engineering',
  'water-engineering',
  'renewable-energy-engineering',
  'renewable-energy',
  'environmental-science',
  'mechanical-engineering',
  'electrical-engineering',
  'industrial-engineering',
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
        specialism_slug: 'environmental-engineering',
        country_focus: 'uk',
        professional_body_focus: 'CIWEM',
        related_bodies: ['IEMA', 'ICE', 'SocEnv'],
        eligibility_model_version: 1,
        sources: [
          'prospects_environmental_engineer',
          'national_careers_service_environmental_consultant',
          'ciwem_membership_ceng_cwen',
          'iema_cenv_pathway',
          'engineering_council_ceng',
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
    .eq('slug', 'environmental-engineering')
    .maybeSingle()

  if (specErr || !specialism) {
    throw new Error(
      `Environmental Engineering specialism not found: ${specErr?.message ?? 'missing row'}`
    )
  }

  if (!specialism.professional_body) {
    await supabase
      .from('career_library_specialisms')
      .update({
        professional_body:
          'Chartered Institution of Water and Environmental Management (CIWEM); IEMA and ICE also common for CEnv/CEng pathways',
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

  console.log('\n=== Environmental Engineering roles populate summary ===')
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
