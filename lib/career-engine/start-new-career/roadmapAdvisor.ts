/**
 * UK Career Adviser presentation layer — progressive ladders, prioritised actions,
 * personalised timelines, and reality-check summaries.
 */

import { formatInterestAreasPhrase } from '@/lib/career-engine/shared/interestScoring'
import type { EssentialAction } from '@/lib/career-engine/shared/planTypes'
import type { CareerPathDirection } from '@/lib/career-journey/types'
import type {
  BuildNextMilestone,
  CareerChangeTargetSlug,
  TargetProgressionBlueprint,
} from '@/lib/career-brain/careerChangeTransitionAdvisor'
import type { ProfileAssessment } from './transitionAdvisor'
import { ENGLISH_RANK } from './transitionAdvisor'

export type StartNewCareerTimelinePhase = {
  period: string
  label: string
  description: string
  actions: string[]
}

export type RealityCheckSummary = {
  currentProfile: string[]
  targetCareer: string
  biggestChallenges: string[]
  estimatedTimeline: string
  successLikelihood: 'High' | 'Medium' | 'Moderate' | 'Challenging'
  personalisedNote: string
}

/** Full progressive UK career ladders — no jumps to senior management. */
const SECTOR_PROGRESSION_LADDERS: Partial<Record<CareerSectorId, string[]>> = {
  customer_service: [
    'Customer Service Assistant',
    'Customer Service Advisor',
    'Senior Customer Service Advisor',
    'Team Leader',
    'Customer Service Supervisor',
    'Customer Service Manager',
    'Operations Manager',
  ],
  retail_sales: [
    'Retail Assistant',
    'Senior Sales Assistant',
    'Customer Service Advisor',
    'Team Leader',
    'Assistant Manager',
    'Store Manager',
    'Area Manager',
  ],
  office_admin: [
    'Administrator',
    'Office Administrator',
    'Senior Administrator',
    'Operations Coordinator',
    'Office Manager',
    'Operations Manager',
    'Business Manager',
  ],
  hr_recruitment: [
    'HR Administrator',
    'HR Assistant',
    'HR Advisor',
    'HR Business Partner',
    'HR Manager',
    'Head of HR',
    'HR Director',
  ],
  public_sector: [
    'Administrative Officer',
    'Executive Officer',
    'Senior Executive Officer',
    'Team Leader',
    'Grade 7 Officer',
    'Grade 6 Manager',
    'Senior Manager',
  ],
  it_technology: [
    'IT Support Technician',
    'IT Support Specialist',
    'Systems Administrator',
    'Senior Systems Administrator',
    'Infrastructure Engineer',
    'Cloud Engineer',
    'IT Manager',
  ],
  marketing_digital: [
    'Marketing Assistant',
    'Marketing Executive',
    'Senior Marketing Executive',
    'Marketing Coordinator',
    'Marketing Manager',
    'Senior Marketing Manager',
    'Head of Marketing',
  ],
  healthcare: [
    'Care Assistant',
    'Senior Care Worker',
    'Healthcare Assistant',
    'Senior Healthcare Assistant',
    'Care Coordinator',
    'Team Leader (care)',
    'Care Home Manager',
  ],
  education_teaching: [
    'Teaching Assistant',
    'Senior Teaching Assistant',
    'Cover Supervisor',
    'Higher Level Teaching Assistant',
    'Learning Support Coordinator',
    'Assistant Headteacher',
    'Deputy Headteacher',
  ],
  accountant: [
    'Accounts Assistant',
    'Finance Administrator',
    'Assistant Accountant',
    'Accountant',
    'Senior Accountant',
    'Finance Manager',
    'Financial Controller',
  ],
  legal_compliance: [
    'Legal Receptionist',
    'Legal Administrator',
    'Legal Secretary',
    'Paralegal',
    'Senior Paralegal',
    'Legal Operations Manager',
    'Compliance Manager',
  ],
  construction_trades: [
    'Construction Labourer',
    'Skilled Tradesperson',
    'Approved Tradesperson',
    'Site Supervisor',
    'Site Manager',
    'Contracts Manager',
    'Project Manager',
  ],
  warehouse_supply_chain: [
    'Warehouse Operative',
    'Senior Warehouse Operative',
    'Team Leader',
    'Warehouse Supervisor',
    'Inventory Controller',
    'Warehouse Manager',
    'Logistics Manager',
  ],
  transport_logistics: [
    'Delivery Driver',
    'Van Driver',
    'HGV Driver',
    'Transport Coordinator',
    'Fleet Supervisor',
    'Transport Manager',
    'Logistics Manager',
  ],
  security: [
    'Security Officer',
    'Senior Security Officer',
    'Door Supervisor',
    'Security Supervisor',
    'Control Room Operator',
    'Security Manager',
    'Regional Security Manager',
  ],
  cleaning_facilities: [
    'Cleaner',
    'Senior Cleaner',
    'Cleaning Team Leader',
    'Cleaning Supervisor',
    'Facilities Coordinator',
    'Facilities Manager',
    'Head of Facilities',
  ],
  hospitality: [
    'Hospitality Team Member',
    'Waiter / Front of House',
    'Senior Team Member',
    'Supervisor',
    'Duty Manager',
    'Restaurant Manager',
    'Operations Manager',
  ],
  manufacturing_engineering: [
    'Production Operative',
    'Skilled Technician',
    'Senior Technician',
    'Team Leader',
    'Production Supervisor',
    'Engineering Manager',
    'Plant Manager',
  ],
  creative_design: [
    'Design Assistant',
    'Junior Designer',
    'Designer',
    'Senior Designer',
    'Lead Designer',
    'Creative Lead',
    'Head of Design',
  ],
  science_laboratory: [
    'Laboratory Assistant',
    'Laboratory Technician',
    'Senior Laboratory Technician',
    'Research Technician',
    'Laboratory Supervisor',
    'Laboratory Manager',
    'Research Manager',
  ],
}

const MILESTONE_WHY: Record<string, (assessment: ProfileAssessment) => string> = {
  'Microsoft Office Certification': (a) =>
    `With your ${labelEnglish(a)} English and target of ${a.targetFieldLabel}, employers expect Excel, Outlook, and document skills before they shortlist admin applications.`,
  'Business Administration Certificate': (a) =>
    `Your ${labelEducation(a)} background means a Level 2/3 business admin certificate signals commitment and fills the qualification gap UK recruiters look for.`,
  'CompTIA A+': (a) =>
    `Because you are moving into ${a.targetFieldLabel} without IT employment history, CompTIA A+ is the most recognised UK entry credential for helpdesk roles.`,
  'Google IT Support Certificate': (a) =>
    `This gives you structured troubleshooting evidence while you ${a.urgency === 'immediate' ? 'work a bridge job and study part-time' : 'study before applying'}.`,
  'Care Certificate': (a) =>
    `Required for most UK care employers — with ${a.hasWorkExperience ? 'your experience' : 'no care experience yet'}, employer-funded routes are realistic after a bridge role.`,
  'Digital Marketing Certificate': (a) =>
    `Makes your ${a.targetFieldLabel} applications competitive when you lack a marketing employment history.`,
  'AAT Foundation Certificate': (a) =>
    `Essential first finance qualification — bridges the gap between your ${labelEducation(a)} education and UK accountant entry roles.`,
}

function labelEnglish(a: ProfileAssessment): string {
  const labels: Record<string, string> = {
    beginner: 'beginner',
    basic: 'basic',
    intermediate: 'intermediate',
    good: 'good',
    fluent: 'fluent',
  }
  return labels[a.englishLevel] ?? a.englishLevel
}

function labelEducation(a: ProfileAssessment): string {
  const labels: Record<string, string> = {
    no_formal: 'no formal qualifications',
    gcse_a_levels: 'GCSE/A Level',
    vocational: 'vocational',
    diploma_college: 'college diploma',
    bachelors: "bachelor's degree",
    masters: "master's degree",
    phd: 'doctorate',
  }
  return labels[a.educationLevel] ?? a.educationLevel
}

function labelExperience(a: ProfileAssessment): string {
  if (!a.hasWorkExperience) return 'no paid work experience'
  const map: Record<string, string> = {
    '0_1': 'less than 1 year',
    '1_3': '1–3 years',
    '3_5': '3–5 years',
    '5_10': '5–10 years',
    '10_plus': '10+ years',
  }
  return map[a.experienceYears] ?? a.experienceYears
}

export function resolveProgressiveCareerLadder(
  targetSector: CareerSectorId | null,
  blueprint: TargetProgressionBlueprint,
  assessment: ProfileAssessment
): string[] {
  const sectorLadder = targetSector ? SECTOR_PROGRESSION_LADDERS[targetSector] : undefined

  const fallback = [
    blueprint.workNow[0]?.title ?? 'Entry-level role',
    blueprint.intermediateRole,
    ...blueprint.longTerm,
  ].filter(Boolean)

  const ladder = sectorLadder ?? fallback

  const targetEntry = blueprint.workNow[0]?.title
  let startIdx = 0
  if (targetEntry) {
    const idx = ladder.findIndex(
      (step) => step.toLowerCase().includes(targetEntry.toLowerCase().split(' ')[0])
    )
    if (idx > 0) startIdx = idx
  }

  if (assessment.mustUseBridgeEmployment && startIdx === 0 && ladder.length > 4) {
    startIdx = Math.min(1, ladder.length - 4)
  }

  return ladder.slice(startIdx, startIdx + 6)
}

export function ladderToLongTermDirections(
  ladder: string[],
  assessment: ProfileAssessment
): CareerPathDirection[] {
  return ladder.map((title, i) => ({
    id: `progression-${i}`,
    title,
    why: [
      i === 0
        ? `Your first ${assessment.targetFieldLabel} role after bridge employment and training — typically 6–18 months from today with your profile.`
        : i === ladder.length - 1
          ? `Long-term destination in ${assessment.targetFieldLabel} — realistic after sustained UK experience, not an immediate step.`
          : `Typical UK promotion stage ${i + 1} on the ${assessment.targetFieldLabel} pathway.`,
    ],
    chips: i === ladder.length - 1 ? ['Long-term goal'] : [`Stage ${i + 1}`],
  }))
}

export function prioritizeEssentialActions(
  assessment: ProfileAssessment,
  fromTarget: EssentialAction[],
  answers: Record<string, string>
): EssentialAction[] {
  const out: EssentialAction[] = []
  let step = 1

  const push = (action: EssentialAction) => {
    if (out.some((a) => a.id === action.id)) return
    out.push({ ...action, step, priority: action.priority ?? 'critical' })
    step += 1
  }

  if (ENGLISH_RANK[assessment.englishLevel] < 2) {
    push({
      id: 'improve_english',
      title: 'Improve English for Work (ESOL)',
      description: `Your ${labelEnglish(assessment)} English is the biggest barrier to ${assessment.targetFieldLabel} roles — UK employers need clearer workplace communication before specialist applications.`,
      priority: 'critical',
      href: '/career-hub',
    })
  }

  push({
    id: 'build_uk_cv',
    title: 'Build a UK-format CV',
    description: `Create a CV that highlights transferable skills from ${assessment.currentFieldLabel} and explains your move into ${assessment.targetFieldLabel} — UK recruiters scan CVs in under 10 seconds.`,
    priority: 'critical',
    href: '/cv-builder',
  })

  if (!assessment.hasUkWorkExperience) {
    push({
      id: 'gain_uk_experience',
      title: 'Gain first UK work experience',
      description: `You have ${labelExperience(assessment)} but no UK references yet — even 3–6 months in a bridge role gives employers confidence you can work in the UK.`,
      priority: 'critical',
    })
  }

  const urgencyNote =
    assessment.urgency === 'immediate'
      ? ' Prioritise this while applying for bridge jobs — income matters now.'
      : ''

  for (const action of fromTarget) {
    if (/english|esol/i.test(action.title) && out.some((a) => /english|esol/i.test(a.title))) {
      continue
    }
    push({
      ...action,
      description: `${action.description}${urgencyNote}`,
    })
  }

  if (assessment.studyWilling && !out.some((a) => /certif|qualif|course|training/i.test(a.title))) {
    push({
      id: 'open_to_training',
      title: `Complete ${assessment.targetFieldLabel} entry qualifications`,
      description: `You said you are willing to retrain — completing the first recommended certificate moves you from bridge employment into ${assessment.targetFieldLabel}.`,
      priority: 'recommended',
    })
  }

  return out.slice(0, 8)
}

function milestoneWhyText(m: BuildNextMilestone, assessment: ProfileAssessment): string {
  const custom = MILESTONE_WHY[m.title]
  if (custom) return custom(assessment)
  if (m.category === 'certification') {
    return `${m.description} UK ${assessment.targetFieldLabel} employers treat this as proof you are serious about the career change.`
  }
  if (m.category === 'experience') {
    return `${m.description} With ${labelExperience(assessment)}, this builds the ${assessment.targetFieldLabel} evidence your CV currently lacks.`
  }
  return `${m.description} This directly supports your move into ${assessment.targetFieldLabel}.`
}

export function buildNextRoadmap(
  assessment: ProfileAssessment,
  blueprint: TargetProgressionBlueprint,
  prioritizedActions: EssentialAction[],
  recommendedCourses: Array<{ title: string; whyReasons: string[] }>
): CareerPathDirection[] {
  const steps: Array<{ order: number; title: string; why: string; chips: string[] }> = []
  let order = 1

  const add = (title: string, why: string, chips: string[]) => {
    if (steps.some((s) => s.title === title)) return
    steps.push({ order: order++, title, why, chips })
  }

  const englishAction = prioritizedActions.find((a) => /english|esol/i.test(a.title))
  if (englishAction) {
    add(englishAction.title, englishAction.description, ['Step 1', 'Training'])
  }

  const cvAction = prioritizedActions.find((a) => a.id === 'build_uk_cv')
  if (cvAction) {
    add(cvAction.title, cvAction.description, ['CV', 'Foundation'])
  }

  const ukExpAction = prioritizedActions.find((a) => a.id === 'gain_uk_experience')
  if (ukExpAction) {
    add(ukExpAction.title, ukExpAction.description, ['Experience', 'UK'])
  }

  const milestones = assessment.studyWilling
    ? blueprint.milestonesStudyYes
    : blueprint.milestonesStudyNo

  for (const m of milestones.slice(0, 4)) {
    add(m.title, milestoneWhyText(m, assessment), [
      m.category === 'certification' ? 'Certificate' : 'Training',
    ])
  }

  for (const course of recommendedCourses.slice(0, 2)) {
    add(
      course.title,
      course.whyReasons[0] ??
        `Recommended for your ${assessment.targetFieldLabel} transition given your ${labelEducation(assessment)} education.`,
      ['Course']
    )
  }

  const targetEntry = blueprint.workNow[0]?.title
  if (assessment.mustUseBridgeEmployment && targetEntry) {
    add(
      targetEntry,
      `After bridge work and training, ${targetEntry} is your realistic entry into ${assessment.targetFieldLabel} — not a role you can obtain today, but the next career step.`,
      ['Career step']
    )
  }

  add(
    blueprint.intermediateRole,
    `Natural progression after 12–18 months in ${assessment.targetFieldLabel} — consolidates UK experience before senior roles.`,
    ['Career step']
  )

  return steps.map((s) => ({
    id: `build-${s.order}`,
    title: s.title,
    why: [`Why: ${s.why}`],
    chips: s.chips,
  }))
}

export function buildPersonalizedTimelinePhases(
  assessment: ProfileAssessment,
  essentialActions: EssentialAction[],
  buildNextTitles: string[],
  estimatedTimeline: string
): StartNewCareerTimelinePhase[] {
  const phase1: string[] = []
  const phase2: string[] = []
  const phase3: string[] = []

  if (ENGLISH_RANK[assessment.englishLevel] < 2) {
    phase1.push('Improve English (ESOL or workplace English)')
  }
  phase1.push(
    assessment.mustUseBridgeEmployment
      ? 'Apply for bridge jobs (retail, warehouse, hospitality, cleaning)'
      : `Apply for ${assessment.targetFieldLabel} entry-level roles`
  )
  phase1.push('Build a UK-format CV targeting your transition')
  if (!assessment.hasUkWorkExperience) {
    phase1.push('Secure first UK work reference (even 3–6 months counts)')
  }
  if (assessment.urgency === 'immediate') {
    phase1.push('Prioritise income — accept realistic bridge work while planning training')
  }

  const certs = buildNextTitles.filter((t) =>
    /certificate|certification|compTIA|AAT|ESOL|Office|Course|Diploma/i.test(t)
  )
  if (certs.length) {
    phase2.push(`Complete: ${certs.slice(0, 2).join(', ')}`)
  } else {
    phase2.push('Complete recommended qualifications from your Build Next roadmap')
  }
  phase2.push(`Move into ${assessment.targetFieldLabel} entry-level role`)
  phase2.push('Gain 6–12 months UK experience in your target field')
  phase2.push('Collect references and document achievements for promotion')

  phase3.push('Progress through senior advisor / coordinator stages')
  phase3.push('Complete advanced certifications if required for management')
  phase3.push(`Reach long-term ${assessment.targetFieldLabel} career goal`)
  if (assessment.studyWilling) {
    phase3.push('Consider further study if required for regulated senior roles')
  }

  const urgencyLabel =
    assessment.urgency === 'immediate'
      ? 'Focus on income and foundations first'
      : assessment.urgency === 'study_first'
        ? 'Study-first approach — bridge work can follow qualifications'
        : 'Balance paid work with part-time training'

  return [
    {
      period: '0–6 months',
      label: 'Foundation & income',
      description: `${urgencyLabel}. Your ${labelEnglish(assessment)} English and ${labelExperience(assessment)} experience shape what is realistic right now.`,
      actions: phase1,
    },
    {
      period: '6–18 months',
      label: 'Enter your target field',
      description: `Transition from bridge employment into ${assessment.targetFieldLabel} with qualifications and UK references in place.`,
      actions: phase2,
    },
    {
      period: '2–5 years',
      label: 'Career progression',
      description: `Progress through realistic UK promotion stages in ${assessment.targetFieldLabel} — not a single jump to management.`,
      actions: phase3,
    },
  ]
}

export function buildRealityCheckSummary(
  assessment: ProfileAssessment,
  answers: Record<string, string>,
  targetField: string,
  estimatedTimeline: string,
  readinessScore: number
): RealityCheckSummary {
  const currentProfile: string[] = []

  if (!assessment.hasWorkExperience) {
    currentProfile.push('No work experience')
  } else {
    currentProfile.push(`${labelExperience(assessment)} work experience`)
    if (assessment.currentFieldLabel !== 'No prior work experience') {
      currentProfile.push(`Background in ${assessment.currentFieldLabel}`)
    }
  }

  currentProfile.push(`${labelEnglish(assessment).charAt(0).toUpperCase() + labelEnglish(assessment).slice(1)} English`)

  if (assessment.educationLevel === 'no_formal') {
    currentProfile.push('No formal qualifications')
  } else {
    currentProfile.push(`${labelEducation(assessment).charAt(0).toUpperCase() + labelEducation(assessment).slice(1)} education`)
  }

  if (assessment.hasUkWorkExperience) {
    currentProfile.push('UK work experience')
  } else {
    currentProfile.push('No UK work experience yet')
  }

  const biggestChallenges = [...assessment.barriers]
  if (assessment.urgency === 'immediate' && !biggestChallenges.includes('Need income quickly')) {
    biggestChallenges.unshift('Need income quickly')
  }

  let successLikelihood: RealityCheckSummary['successLikelihood'] = 'Moderate'
  if (readinessScore >= 75) successLikelihood = 'High'
  else if (readinessScore >= 58) successLikelihood = 'Medium'
  else if (readinessScore < 45) successLikelihood = 'Challenging'

  const interestPhrase = formatInterestAreasPhrase(assessment.interestAreas)

  const personalisedNote = assessment.mustUseBridgeEmployment
    ? `Given ${labelEnglish(assessment)} English and ${assessment.hasWorkExperience ? labelExperience(assessment) + ' experience' : 'no experience'}, we prioritised bridge employment before ${targetField} — aligned with ${interestPhrase}.`
    : `Your profile supports a faster route into ${targetField}, building on ${interestPhrase} and ${labelExperience(assessment)} experience.`

  return {
    currentProfile,
    targetCareer: targetField,
    biggestChallenges: biggestChallenges.slice(0, 4),
    estimatedTimeline,
    successLikelihood,
    personalisedNote,
  }
}

export { labelEnglish, labelEducation, labelExperience }
