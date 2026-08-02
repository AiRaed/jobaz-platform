/**
 * Sector-level UK career strategies — applied when no exact specialisation blueprint exists.
 */

import type { CourseEntry, CvImprovement, EssentialAction, JobEntry, QualificationLevel } from '../types'
import type { ProfessionProfile } from '../professionProfiles'
import type { GenerationContext, SectorType, UkRequirement } from './types'

const CV = '/cv-builder-v2'
const ENIC = 'https://www.enic.org.uk/'
const INTERVIEW = '/interview-coach'

function jobsFromKeywords(
  label: string,
  keyword: string,
  level: QualificationLevel
): JobEntry[] {
  const prefix = level === 'bachelors' ? 'Graduate' : level === 'masters' ? '' : 'Senior'
  const seniority: JobEntry['seniority'] =
    level === 'bachelors' ? 'graduate' : level === 'masters' ? 'mid' : 'senior'
  const title = prefix ? `${prefix} ${label}` : label
  return [
    { title, searchKeyword: `${keyword} UK`, seniority },
    { title: `${label} (Entry)`, searchKeyword: `junior ${keyword}`, seniority: 'junior' },
  ]
}

function requirementToAction(r: UkRequirement): EssentialAction {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    href: r.href,
    priority: r.tier === 'mandatory' ? 'critical' : 'recommended',
  }
}

function filterRequirements(ctx: GenerationContext, reqs: UkRequirement[]): UkRequirement[] {
  const { answers } = ctx
  return reqs.filter((r) => {
    if (r.overseasOnly && answers.qualification_origin !== 'outside_uk') return false
    if (r.ukOnly && answers.qualification_origin !== 'uk') return false
    if (r.whenEnglishLow && !['beginner', 'basic'].includes(answers.english_level)) return false
    if (r.whenOpenToCourses && answers.open_to_courses !== 'yes') return false
    return true
  })
}

function sectorDefaultRequirements(sector: SectorType, ctx: GenerationContext): UkRequirement[] {
  const { answers, knowledge } = ctx
  const reqs: UkRequirement[] = []

  if (answers.qualification_origin === 'outside_uk' && knowledge.qualificationRecognition.requiredForOutsideUk) {
    reqs.push({
      id: 'enic',
      title: 'UK Qualification Recognition (ENIC)',
      description: knowledge.qualificationRecognition.summary,
      href: ENIC,
      kind: 'compliance',
      tier: 'mandatory',
    })
  }

  switch (sector) {
    case 'regulated_health':
      reqs.push({
        id: 'reg_body',
        title: 'UK Health Regulator Registration',
        description: `Regulated health professions require registration with the relevant UK body (NMC, GMC, GPhC, or HCPC) before practice.`,
        tier: 'mandatory',
        kind: 'registration',
      })
      break
    case 'teaching':
      reqs.push({
        id: 'qts',
        title: 'Qualified Teacher Status (QTS)',
        description: 'Required to teach in most English state schools. Overseas teachers may use iQTS.',
        href: 'https://www.gov.uk/guidance/qualified-teacher-status-qts',
        tier: 'mandatory',
        kind: 'registration',
      })
      reqs.push({
        id: 'dbs',
        title: 'Enhanced DBS Check',
        description: 'Mandatory for all UK roles working with children and vulnerable people.',
        href: 'https://www.gov.uk/dbs-check-applicant-criminal-record',
        tier: 'mandatory',
        kind: 'compliance',
      })
      break
    case 'technology':
      reqs.push({
        id: 'portfolio',
        title: 'Technical Portfolio (GitHub)',
        description: 'UK tech employers prioritise demonstrable projects and code quality over degree title alone.',
        href: 'https://github.com/',
        tier: 'mandatory',
        kind: 'portfolio',
      })
      break
    case 'trades':
      reqs.push({
        id: 'cscs',
        title: 'CSCS Card',
        description: 'Required for access to most UK construction sites.',
        tier: 'mandatory',
        kind: 'licence',
      })
      break
    case 'creative':
      reqs.push({
        id: 'portfolio',
        title: 'Professional Portfolio',
        description: 'UK creative and media employers hire on demonstrated work — portfolio quality is essential.',
        tier: 'mandatory',
        kind: 'portfolio',
      })
      break
    case 'finance':
      reqs.push({
        id: 'professional_body',
        title: 'Professional Accounting / Finance Body',
        description: 'ACCA, CIMA, ICAEW, AAT, or CISI — UK finance employers expect recognised qualifications.',
        tier: 'recommended',
        kind: 'membership',
      })
      break
    case 'law':
      reqs.push({
        id: 'legal_reg',
        title: 'Legal Regulator Route (SRA / BSB)',
        description: 'Solicitors need SQE; barristers need BTC and pupillage. Paralegal routes via CILEX.',
        href: 'https://www.sra.org.uk/',
        tier: 'mandatory',
        kind: 'registration',
      })
      break
    case 'social_care':
      reqs.push({
        id: 'dbs',
        title: 'Enhanced DBS Check',
        description: 'Mandatory for all social care and support roles in the UK.',
        tier: 'mandatory',
        kind: 'compliance',
      })
      break
    case 'logistics':
      reqs.push({
        id: 'forklift_or_licence',
        title: 'Forklift Licence or HGV Licence',
        description: 'Operational licences significantly increase employability in UK logistics.',
        tier: 'recommended',
        kind: 'licence',
      })
      break
    case 'public_sector':
      reqs.push({
        id: 'civil_service',
        title: 'Civil Service Application Process',
        description: 'Government roles use structured sifts, online tests, and behaviour-based interviews.',
        href: 'https://www.civil-service-careers.gov.uk/',
        tier: 'recommended',
        kind: 'compliance',
      })
      break
    default:
      break
  }

  return reqs
}

export function buildSectorCvImprovements(ctx: GenerationContext): CvImprovement[] {
  const { label, sector, answers } = ctx
  const items: CvImprovement[] = [
    {
      id: 'uk_cv',
      title: `UK ${label} CV`,
      description: `Format your CV for UK recruiters — highlight qualifications, measurable achievements, and UK-relevant skills.`,
      href: CV,
      priority: 1,
    },
  ]

  if (sector === 'technology' || sector === 'creative') {
    items.push({
      id: 'portfolio_link',
      title: 'Portfolio Link on CV',
      description: 'Add a prominent link to GitHub, Behance, or your showreel — UK employers check this first.',
      href: CV,
      priority: 2,
    })
  }

  if (sector === 'regulated_health' || sector === 'teaching') {
    items.push({
      id: 'registration_cv',
      title: 'Registration Number on CV',
      description: 'Display your regulator PIN/registration status (NMC, GMC, HCPC, QTS) prominently.',
      href: CV,
      priority: 2,
    })
  }

  if (answers.qualification_origin === 'outside_uk') {
    items.push({
      id: 'enic_cv',
      title: 'ENIC Statement on CV',
      description: 'Include your UK ENIC evaluation so employers understand your overseas qualification level.',
      href: ENIC,
      priority: 3,
    })
  }

  items.push({
    id: 'interview',
    title: `${label} Interview Preparation`,
    description: `Prepare UK-style competency (STAR) examples relevant to ${label.toLowerCase()} roles.`,
    href: INTERVIEW,
    priority: 4,
  })

  return items
}

export function buildSectorCourses(ctx: GenerationContext, level: QualificationLevel): CourseEntry[] {
  const { sector, answers, knowledge, label } = ctx
  if (answers.open_to_courses !== 'yes') return []

  const courses: CourseEntry[] = []

  if (['beginner', 'basic', 'intermediate'].includes(answers.english_level) && sector !== 'teaching') {
    courses.push({
      id: 'esol',
      title: 'English for Work (ESOL)',
      whyReasons: ['Improves UK interview performance.', `Required before most ${label.toLowerCase()} client-facing roles.`],
      duration: '6–12 weeks',
      costLabel: 'Free',
      pathId: knowledge.careerHubPathId,
    })
  }

  switch (sector) {
    case 'technology':
      if (level !== 'phd') {
        courses.push({
          id: 'cloud_cert',
          title: 'AWS Cloud Practitioner / Azure Fundamentals',
          whyReasons: ['Recognised by UK tech employers.', 'Differentiates junior applicants.'],
          duration: '4–8 weeks',
          costLabel: 'Paid',
        })
      }
      break
    case 'trades':
      courses.push({
        id: 'cscs_course',
        title: 'CSCS Card Training',
        whyReasons: ['Unlocks construction site roles.', 'Often required before starting work.'],
        duration: '1 day',
        costLabel: 'Paid',
        pathId: 'construction-trades',
        slug: 'cscs-card',
      })
      break
    case 'finance':
      courses.push({
        id: 'aat',
        title: 'AAT Accounting',
        whyReasons: ['Practical UK accounting qualification.', 'Employers recognise AAT for entry finance roles.'],
        duration: '12–18 months',
        costLabel: 'Paid',
      })
      break
    case 'science':
      courses.push({
        id: 'lab_safety',
        title: 'Laboratory Safety & GMP',
        whyReasons: ['Expected in NHS, pharma, and diagnostic labs.', 'Demonstrates UK workplace compliance.'],
        duration: '1–2 weeks',
        costLabel: 'Paid',
      })
      break
    default:
      break
  }

  return courses.slice(0, 3)
}

export function buildSectorDefaults(ctx: GenerationContext): Partial<ProfessionProfile> {
  const { label, keyword, sector, answers, knowledge } = ctx
  const level = answers.qualification_level
  const reqs = filterRequirements(ctx, sectorDefaultRequirements(sector, ctx))

  const essentialActions = reqs.map(requirementToAction)
  essentialActions.push({
    id: 'apply_jobs',
    title: `Apply for ${label} Roles`,
    description: `Search UK vacancies matched to your ${label.toLowerCase()} background.`,
    href: `/job-finder?query=${encodeURIComponent(keyword)}`,
    priority: 'critical',
  })

  const jobsByLevel: Record<QualificationLevel, JobEntry[]> = {
    bachelors: jobsFromKeywords(label, keyword, 'bachelors'),
    masters: jobsFromKeywords(label, keyword, 'masters'),
    phd: jobsFromKeywords(label, keyword, 'phd'),
  }

  return {
    goalByLevel: {
      bachelors: label,
      masters: `Senior ${label}`,
      phd: `Lead ${label}`,
    },
    timelineByLevel: {
      bachelors: knowledge.careerProgression.length >= 4 ? knowledge.careerProgression : ['Entry role', 'Junior', 'Mid-level', 'Senior', 'Lead'],
      masters: ['Professional', 'Senior', 'Lead', 'Manager', 'Director'],
      phd: ['Research / Specialist', 'Senior specialist', 'Principal', 'Lead', 'Director'],
    },
    essentialActions,
    cvImprovements: buildSectorCvImprovements(ctx),
    coursesByLevel: {
      bachelors: buildSectorCourses(ctx, 'bachelors'),
      masters: buildSectorCourses(ctx, 'masters'),
      phd: buildSectorCourses(ctx, 'phd'),
    },
    jobsByLevel,
    missionsByLevel: {
      bachelors: [
        { id: 'cv', label: `Build ${label} CV`, href: CV, target: 1 },
        { id: 'apply', label: 'Apply to 5 Jobs', href: `/job-finder?query=${encodeURIComponent(keyword)}`, target: 5 },
        { id: 'interview', label: 'Interview practice', href: INTERVIEW, target: 1 },
      ],
      masters: [
        { id: 'cv', label: `Update ${label} CV`, href: CV, target: 1 },
        { id: 'apply', label: 'Apply to 5 Roles', href: `/job-finder?query=${encodeURIComponent(keyword)}`, target: 5 },
      ],
      phd: [
        { id: 'cv', label: `Build ${label} CV`, href: CV, target: 1 },
        { id: 'apply', label: 'Apply to 5 Senior Roles', href: `/job-finder?query=${encodeURIComponent(keyword)}`, target: 5 },
      ],
    },
    forbiddenJobPatterns:
      level === 'phd'
        ? { phd: /operative|warehouse|labourer|cleaner|retail assistant/i }
        : {},
  }
}
