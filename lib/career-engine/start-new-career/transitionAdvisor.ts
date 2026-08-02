/**
 * Start a New Career transition logic — thinks like a UK career adviser.
 * Work Now = hireable TODAY with the user's CURRENT profile, not the dream job.
 */

import type { CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import { labelCareerSector } from '@/lib/career-engine/shared/careerSectors'
import type { InterestAreaId } from '@/lib/career-engine/shared/interestScoring'
import { formatInterestAreasPhrase, parseInterestAreas } from '@/lib/career-engine/shared/interestScoring'
import type { EssentialAction } from '@/lib/career-engine/shared/planTypes'
import type { CareerPathDirection } from '@/lib/career-journey/types'
import type {
  BuildNextMilestone,
  CareerChangeTargetSlug,
  TargetProgressionBlueprint,
} from '@/lib/career-brain/careerChangeTransitionAdvisor'
import { getTargetBlueprint } from '@/lib/career-brain/careerChangeTransitionAdvisor'
import type { StartNewCareerSituation } from './types'

export type EnglishBand = 'beginner' | 'basic' | 'intermediate' | 'good' | 'fluent'

export type EducationBand =
  | 'no_formal'
  | 'gcse_a_levels'
  | 'vocational'
  | 'diploma_college'
  | 'bachelors'
  | 'masters'
  | 'phd'

export type ProfileAssessment = {
  situation: StartNewCareerSituation
  hasWorkExperience: boolean
  experienceYears: string
  educationLevel: EducationBand
  englishLevel: EnglishBand
  hasUkWorkExperience: boolean
  urgency: 'immediate' | 'balanced' | 'study_first'
  studyWilling: boolean
  interestAreas: InterestAreaId[]
  targetSector: CareerSectorId | null
  targetFieldLabel: string
  currentFieldLabel: string
  hireabilityScore: number
  mustUseBridgeEmployment: boolean
  barriers: string[]
}

export const ENGLISH_RANK: Record<EnglishBand, number> = {
  beginner: 0,
  basic: 1,
  intermediate: 2,
  good: 3,
  fluent: 4,
}

const EDUCATION_RANK: Record<EducationBand, number> = {
  no_formal: 0,
  gcse_a_levels: 1,
  vocational: 2,
  diploma_college: 2,
  bachelors: 3,
  masters: 4,
  phd: 5,
}

type EntryRole = {
  title: string
  salary: string
  tags: string[]
  minEnglish: EnglishBand
  minEducation: EducationBand
  minExperienceYears: number
  needsUkExperience: boolean
  whyHireable: string
}

const UNIVERSAL_ENTRY_ROLES: EntryRole[] = [
  {
    title: 'Retail Assistant',
    salary: '£11–£12/hr',
    tags: ['people', 'business_management', 'retail'],
    minEnglish: 'basic',
    minEducation: 'no_formal',
    minExperienceYears: 0,
    needsUkExperience: false,
    whyHireable:
      'High-volume UK hiring, minimal qualifications, and customer-facing experience that transfers to office and service careers.',
  },
  {
    title: 'Warehouse Operative',
    salary: '£12–£14/hr',
    tags: ['hands_on', 'problem_solving', 'logistics'],
    minEnglish: 'basic',
    minEducation: 'no_formal',
    minExperienceYears: 0,
    needsUkExperience: false,
    whyHireable: 'Strong demand across the UK, shift work available quickly, and proof of reliability employers value.',
  },
  {
    title: 'Kitchen Assistant',
    salary: '£11–£12/hr',
    tags: ['hands_on', 'hospitality'],
    minEnglish: 'basic',
    minEducation: 'no_formal',
    minExperienceYears: 0,
    needsUkExperience: false,
    whyHireable:
      'Fast hiring in hospitality — often no prior experience required beyond food hygiene training after hire.',
  },
  {
    title: 'Customer Service Assistant',
    salary: '£21k–£24k',
    tags: ['people', 'customer_service', 'business_management'],
    minEnglish: 'intermediate',
    minEducation: 'no_formal',
    minExperienceYears: 0,
    needsUkExperience: false,
    whyHireable:
      'Entry contact-centre and service roles are common stepping stones into administration and people-focused careers.',
  },
  {
    title: 'Cleaner',
    salary: '£11–£12/hr',
    tags: ['hands_on'],
    minEnglish: 'beginner',
    minEducation: 'no_formal',
    minExperienceYears: 0,
    needsUkExperience: false,
    whyHireable:
      'Very low entry barriers — useful when you need income immediately while building English and UK references.',
  },
  {
    title: 'Hospitality Team Member',
    salary: '£11–£12/hr',
    tags: ['people', 'hospitality'],
    minEnglish: 'basic',
    minEducation: 'no_formal',
    minExperienceYears: 0,
    needsUkExperience: false,
    whyHireable:
      'Hotels, cafés, and restaurants regularly hire for front-of-house and support roles without prior experience.',
  },
  {
    title: 'Care Assistant',
    salary: '£21k–£25k',
    tags: ['helping_others', 'people', 'healthcare'],
    minEnglish: 'intermediate',
    minEducation: 'no_formal',
    minExperienceYears: 0,
    needsUkExperience: false,
    whyHireable:
      'Care employers often train after hire — a strong bridge into healthcare if you are willing to complete a DBS check.',
  },
]

const TARGET_ENTRY_ROLE_REQUIREMENTS: Record<
  string,
  { minEnglish: EnglishBand; minEducation: EducationBand; minExperienceYears: number; needsUkExperience: boolean }
> = {
  'Office Administrator': {
    minEnglish: 'good',
    minEducation: 'gcse_a_levels',
    minExperienceYears: 1,
    needsUkExperience: false,
  },
  'Admin Assistant': {
    minEnglish: 'intermediate',
    minEducation: 'gcse_a_levels',
    minExperienceYears: 0,
    needsUkExperience: false,
  },
  'IT Support Assistant': {
    minEnglish: 'intermediate',
    minEducation: 'gcse_a_levels',
    minExperienceYears: 0,
    needsUkExperience: false,
  },
  'Accounts Assistant': {
    minEnglish: 'good',
    minEducation: 'gcse_a_levels',
    minExperienceYears: 0,
    needsUkExperience: false,
  },
  'Marketing Assistant': {
    minEnglish: 'good',
    minEducation: 'gcse_a_levels',
    minExperienceYears: 0,
    needsUkExperience: false,
  },
}

const REGULATED_LONG_TERM: Partial<
  Record<CareerSectorId, { realisticRole: string; honestNote: string; timeline: string }>
> = {
  healthcare: {
    realisticRole: 'Senior Care Worker / Nursing Associate',
    honestNote:
      'Becoming a Registered Nurse or Doctor requires years of regulated study, clinical placements, and NMC/GMC registration — not an immediate step from your current profile.',
    timeline: '3–6+ years with approved qualifications',
  },
  legal_compliance: {
    realisticRole: 'Paralegal / Legal Administrator',
    honestNote:
      'Solicitor routes require a law degree, SQE or training contract, and typically 4–6+ years — plan for legal support roles first.',
    timeline: '4–6+ years for solicitor qualification',
  },
  education_teaching: {
    realisticRole: 'Teaching Assistant / Learning Support',
    honestNote:
      'Qualified teacher roles require QTS and a degree — usually 3–4 years of study plus school experience.',
    timeline: '3–4+ years for QTS teacher routes',
  },
  accountant: {
    realisticRole: 'Accounts Assistant / Finance Administrator',
    honestNote:
      'Chartered accountant status (ACA/ACCA) typically takes 3–5 years of exams and supervised experience after AAT foundations.',
    timeline: '3–5+ years for chartered level',
  },
}

const SECTOR_TO_TARGET_SLUG: Partial<Record<CareerSectorId, CareerChangeTargetSlug>> = {
  office_admin: 'business_administration',
  hr_recruitment: 'business_administration',
  public_sector: 'business_administration',
  retail_sales: 'business_administration',
  customer_service: 'business_administration',
  it_technology: 'technology',
  marketing_digital: 'marketing',
  healthcare: 'healthcare',
  education_teaching: 'education',
  legal_compliance: 'law',
  accountant: 'finance',
  manufacturing_engineering: 'engineering',
  construction_trades: 'skilled_trades',
  creative_design: 'creative_media',
}

function experienceYearsNumeric(years?: string): number {
  if (!years || years === '0_1') return 0
  if (years === '1_3') return 1
  if (years === '3_5') return 3
  if (years === '5_10') return 6
  return 10
}

export function assessProfile(
  answers: Record<string, string>,
  targetFieldLabel: string,
  currentFieldLabel: string
): ProfileAssessment {
  const situation = answers.starting_situation as StartNewCareerSituation
  const hasWorkExperience =
    situation === 'experienced_known_target' || situation === 'experienced_unknown_target'
  const englishLevel = (answers.english_level ?? 'intermediate') as EnglishBand
  const educationLevel = (answers.education_level ?? 'no_formal') as EducationBand
  const hasUkWorkExperience = answers.uk_work_experience === 'yes'

  let hireabilityScore = 0
  if (hasWorkExperience) hireabilityScore += 2
  else hireabilityScore -= 2

  hireabilityScore += ENGLISH_RANK[englishLevel] - 1
  hireabilityScore += EDUCATION_RANK[educationLevel] - 1

  if (hasUkWorkExperience) hireabilityScore += 1
  else hireabilityScore -= 1

  const expYears = experienceYearsNumeric(answers.experience_years)
  if (expYears >= 3) hireabilityScore += 1
  if (expYears >= 6) hireabilityScore += 1

  const barriers: string[] = []
  if (ENGLISH_RANK[englishLevel] < 2) {
    barriers.push('English below the level most UK employers expect for professional roles')
  }
  if (educationLevel === 'no_formal') {
    barriers.push('No formal qualifications on your CV')
  }
  if (!hasWorkExperience) {
    barriers.push('No paid work experience to reference')
  }
  if (!hasUkWorkExperience) {
    barriers.push('No UK work experience yet')
  }

  const mustUseBridgeEmployment =
    hireabilityScore <= -2 ||
    ENGLISH_RANK[englishLevel] < 2 ||
    (!hasWorkExperience && EDUCATION_RANK[educationLevel] < 1)

  return {
    situation,
    hasWorkExperience,
    experienceYears: answers.experience_years ?? '0_1',
    educationLevel,
    englishLevel,
    hasUkWorkExperience,
    urgency: (answers.urgency ?? 'balanced') as ProfileAssessment['urgency'],
    studyWilling: answers.study_willing !== 'no',
    interestAreas: parseInterestAreas(answers.interest_area),
    targetSector: null,
    targetFieldLabel,
    currentFieldLabel,
    hireabilityScore,
    mustUseBridgeEmployment,
    barriers,
  }
}

export function canBeHiredTodayForRole(roleTitle: string, assessment: ProfileAssessment): boolean {
  const reqs = TARGET_ENTRY_ROLE_REQUIREMENTS[roleTitle]
  if (!reqs) {
    return !assessment.mustUseBridgeEmployment
  }

  if (ENGLISH_RANK[assessment.englishLevel] < ENGLISH_RANK[reqs.minEnglish]) return false
  if (EDUCATION_RANK[assessment.educationLevel] < EDUCATION_RANK[reqs.minEducation]) return false
  if (
    experienceYearsNumeric(assessment.experienceYears) < reqs.minExperienceYears &&
    !assessment.hasWorkExperience
  ) {
    return false
  }
  if (reqs.needsUkExperience && !assessment.hasUkWorkExperience) return false
  return true
}

function scoreEntryRole(role: EntryRole, assessment: ProfileAssessment): number {
  let score = 0
  if (ENGLISH_RANK[assessment.englishLevel] < ENGLISH_RANK[role.minEnglish]) return -10

  score += 3
  if (EDUCATION_RANK[assessment.educationLevel] >= EDUCATION_RANK[role.minEducation]) score += 2
  if (experienceYearsNumeric(assessment.experienceYears) >= role.minExperienceYears) score += 1
  if (!role.needsUkExperience || assessment.hasUkWorkExperience) score += 1
  for (const interest of assessment.interestAreas) {
    if (role.tags.includes(interest)) score += 3
  }
  if (assessment.urgency === 'immediate') score += 1

  return score
}

export function resolveRealisticWorkNow(
  assessment: ProfileAssessment,
  blueprintWorkNow: TargetProgressionBlueprint['workNow'],
  location: string
): CareerPathDirection[] {
  const jobHref = (title: string) => {
    const loc = location && location !== 'UK-wide' ? `&location=${encodeURIComponent(location)}` : ''
    return `/job-finder?query=${encodeURIComponent(title)}${loc}`
  }

  if (!assessment.mustUseBridgeEmployment) {
    const filtered = blueprintWorkNow.filter((role) => canBeHiredTodayForRole(role.title, assessment))
    if (filtered.length >= 2) {
      return filtered.slice(0, 3).map((role, i) => ({
        id: `work-now-${i}`,
        title: role.title,
        why: [
          'You could realistically be hired for this role today — your English, experience, and qualifications meet typical UK entry expectations.',
          `Expected salary guide: ${role.expectedSalary}.`,
        ],
        chips: [role.expectedSalary, `${role.entryDifficulty} entry`],
        href: jobHref(role.title),
      }))
    }
  }

  const ranked = [...UNIVERSAL_ENTRY_ROLES]
    .map((role) => ({ role, score: scoreEntryRole(role, assessment) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  const selected = ranked.slice(0, 4).map((r) => r.role)
  const fallback =
    selected.length >= 3
      ? selected
      : UNIVERSAL_ENTRY_ROLES.filter(
          (r) => ENGLISH_RANK[assessment.englishLevel] >= ENGLISH_RANK[r.minEnglish]
        ).slice(0, 4)

  return fallback.slice(0, 4).map((role, i) => ({
    id: `bridge-work-${i}`,
    title: role.title,
    why: [
      `Could you be hired for ${assessment.targetFieldLabel} today? With your current profile, probably not yet — ${role.title} is a realistic income role UK employers hire quickly.`,
      role.whyHireable,
    ],
    chips: [role.salary, 'Fast hiring'],
    href: jobHref(role.title),
  }))
}

function milestoneToDirection(m: BuildNextMilestone, index: number): CareerPathDirection {
  return {
    id: `milestone-${index}`,
    title: m.title,
    why: [
      m.description,
      `This step moves you closer to your target because it builds ${m.category} employers expect.`,
    ],
    chips: [m.category === 'certification' ? 'Certificate' : m.category === 'skill' ? 'Skill' : 'Training'],
  }
}

export function resolvePersonalizedBuildNext(
  assessment: ProfileAssessment,
  blueprint: TargetProgressionBlueprint,
  essentialActions: EssentialAction[],
  recommendedCourseTitles: string[]
): CareerPathDirection[] {
  const out: CareerPathDirection[] = []

  if (ENGLISH_RANK[assessment.englishLevel] < 2) {
    out.push({
      id: 'build-esol',
      title: 'English for Work (ESOL)',
      why: [
        `UK employers need clearer workplace English before ${assessment.targetFieldLabel} applications will succeed — this is your first barrier to remove.`,
      ],
      chips: ['Training'],
    })
  }

  const milestones = assessment.studyWilling
    ? blueprint.milestonesStudyYes
    : blueprint.milestonesStudyNo

  for (const m of milestones.slice(0, 4)) {
    out.push(milestoneToDirection(m, out.length))
  }

  for (const action of essentialActions.filter((a) => a.priority === 'critical').slice(0, 3)) {
    if (/english/i.test(action.title) && out.some((o) => /esol|english/i.test(o.title))) continue
    out.push({
      id: `action-${action.id}`,
      title: action.title,
      why: [action.description],
      chips: ['UK requirement'],
    })
  }

  if (!assessment.hasUkWorkExperience) {
    out.push({
      id: 'build-uk-exp',
      title: 'Gain UK work experience',
      why: [
        'UK employers trust local references — even 3–6 months in a bridge role strengthens every future application.',
      ],
      chips: ['Experience'],
    })
  }

  const targetEntry = blueprint.workNow[0]?.title ?? blueprint.intermediateRole
  if (assessment.mustUseBridgeEmployment && targetEntry) {
    out.push({
      id: 'build-target-entry',
      title: targetEntry,
      why: [
        `After bridge employment and training, ${targetEntry} becomes realistic — not as a Work Now role, but as your next career step into ${assessment.targetFieldLabel}.`,
      ],
      chips: ['Next career step'],
    })
  }

  out.push({
    id: 'build-intermediate',
    title: blueprint.intermediateRole,
    why: [
      `This is the natural step after your first ${assessment.targetFieldLabel} role — it consolidates UK experience before senior progression.`,
    ],
    chips: ['Career step'],
  })

  for (const course of recommendedCourseTitles.slice(0, 2)) {
    if (out.some((o) => o.title === course)) continue
    out.push({
      id: `course-${course}`,
      title: course,
      why: [`Recommended training aligned to UK ${assessment.targetFieldLabel} employer expectations.`],
      chips: ['Course'],
    })
  }

  return out.slice(0, 8)
}

export function resolvePersonalizedLongTerm(
  assessment: ProfileAssessment,
  targetSector: CareerSectorId | null,
  blueprint: TargetProgressionBlueprint
): { items: CareerPathDirection[]; honestNote?: string; timeline?: string } {
  const regulated = targetSector ? REGULATED_LONG_TERM[targetSector] : undefined

  if (regulated && assessment.hireabilityScore <= 0) {
    return {
      items: [
        {
          id: 'long-realistic',
          title: regulated.realisticRole,
          why: [regulated.honestNote],
          chips: [regulated.timeline],
        },
        ...blueprint.longTerm.slice(1, 3).map((title, i) => ({
          id: `long-${i + 1}`,
          title,
          why: [`Long-term progression after qualifications and UK experience in ${assessment.targetFieldLabel}.`],
        })),
      ],
      honestNote: regulated.honestNote,
      timeline: regulated.timeline,
    }
  }

  return {
    items: blueprint.longTerm.slice(0, 3).map((title, i) => ({
      id: `long-${i}`,
      title,
      why: [
        `A realistic ${assessment.targetFieldLabel} progression after bridge work, training, and UK experience.`,
      ],
    })),
    honestNote: regulated?.honestNote,
    timeline: regulated?.timeline,
  }
}

export function buildPathRationale(
  assessment: ProfileAssessment,
  workNowTitles: string[],
  targetSlug: CareerChangeTargetSlug | null
): string {
  const parts: string[] = []

  if (assessment.mustUseBridgeEmployment) {
    const eduPhrase =
      assessment.educationLevel === 'no_formal'
        ? 'no formal qualifications'
        : `${assessment.educationLevel.replace(/_/g, ' ')} education`
    parts.push(
      `We did not place ${assessment.targetFieldLabel} roles in Work Now because, with your current profile (${assessment.englishLevel} English, ${eduPhrase}, ${assessment.hasWorkExperience ? 'some' : 'no'} work experience), UK employers would unlikely hire you for that role today.`
    )
    parts.push(
      `Instead, we selected ${workNowTitles.slice(0, 3).join(', ')} — roles with fast UK hiring, lower entry barriers, and income while you build experience.`
    )
  } else {
    parts.push(
      `Your profile supports a faster move toward ${assessment.targetFieldLabel}, but we still prioritised roles you could realistically obtain now.`
    )
  }

  if (assessment.interestAreas.length > 0) {
    parts.push(
      `Bridge and training choices reflect ${formatInterestAreasPhrase(assessment.interestAreas)} — combined with your English, education, and experience, not interests alone.`
    )
    if (
      assessment.interestAreas.includes('people') ||
      assessment.interestAreas.includes('helping_others')
    ) {
      parts.push('Customer-facing and care bridge roles align with your people-focused interests.')
    }
    if (
      assessment.interestAreas.includes('technology') ||
      assessment.interestAreas.includes('problem_solving')
    ) {
      parts.push('Income roles now fund certifications in Build Next while you build technical evidence.')
    }
    if (assessment.interestAreas.includes('hands_on')) {
      parts.push('Practical warehouse, hospitality, and trades-adjacent roles match your hands-on preferences.')
    }
  }

  if (assessment.urgency === 'immediate') {
    parts.push('Because you need income quickly, bridge roles take priority over waiting for qualifications.')
  } else if (assessment.urgency === 'study_first') {
    parts.push('You prefer to study first — qualifications in Build Next can precede a full-time bridge role.')
  }

  if (assessment.barriers.length > 0) {
    parts.push(`Barriers to address: ${assessment.barriers.join('; ')}.`)
  }

  if (targetSlug) {
    const blueprint = getTargetBlueprint(targetSlug)
    parts.push(
      `Build Next focuses on ${blueprint.pathLabel} training so each step moves you from today's profile toward ${assessment.targetFieldLabel}.`
    )
  }

  return parts.join(' ')
}

export function resolveTargetSlugForSector(sectorId: CareerSectorId | null): CareerChangeTargetSlug | null {
  if (!sectorId) return null
  return SECTOR_TO_TARGET_SLUG[sectorId] ?? 'business_administration'
}

export function attachTargetSector(
  assessment: ProfileAssessment,
  sectorId: CareerSectorId | null
): ProfileAssessment {
  return {
    ...assessment,
    targetSector: sectorId,
    targetFieldLabel: sectorId ? labelCareerSector(sectorId) : assessment.targetFieldLabel,
  }
}
