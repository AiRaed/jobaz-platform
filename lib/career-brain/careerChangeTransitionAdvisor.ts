/**
 * Career Change Transition Advisor — difficulty, readiness, progression blueprints.
 */

import {
  isCareerChangeStudyWilling,
  labelCareerChangeExperienceYears,
  labelCareerChangeReason,
  resolveCareerChangeCurrentField,
} from './careerChangePath'
import type { CareerBrainState } from './types'

export type CareerChangeFieldSlug =
  | 'hospitality'
  | 'retail'
  | 'customer_service'
  | 'marketing'
  | 'it'
  | 'engineering'
  | 'healthcare'
  | 'education'
  | 'administration'
  | 'finance'
  | 'law'
  | 'logistics'
  | 'construction'
  | 'creative_media'
  | 'driving'
  | 'other'

export type CareerChangeTargetSlug =
  | 'technology'
  | 'business_administration'
  | 'marketing'
  | 'healthcare'
  | 'education'
  | 'law'
  | 'finance'
  | 'engineering'
  | 'creative_media'
  | 'skilled_trades'

export type TransitionDifficultyLevel = 'Easy' | 'Medium' | 'Hard'

export type TransitionTimelinePhase = {
  period: string
  label: string
  description: string
}

export type BuildNextMilestone = {
  title: string
  category: 'certification' | 'skill' | 'experience' | 'portfolio'
  description: string
}

export type TargetProgressionBlueprint = {
  pathLabel: string
  workNow: Array<{
    title: string
    expectedSalary: string
    entryDifficulty: 'Low' | 'Medium' | 'High'
  }>
  intermediateRole: string
  milestonesStudyYes: BuildNextMilestone[]
  milestonesStudyNo: BuildNextMilestone[]
  longTerm: string[]
}

const FIELD_CLUSTER: Record<CareerChangeFieldSlug, string> = {
  hospitality: 'people_service',
  retail: 'people_service',
  customer_service: 'people_service',
  marketing: 'office_commercial',
  it: 'technical',
  engineering: 'technical',
  healthcare: 'regulated_care',
  education: 'regulated_care',
  administration: 'office_commercial',
  finance: 'office_commercial',
  law: 'regulated_professional',
  logistics: 'operations',
  construction: 'trades',
  creative_media: 'creative',
  driving: 'operations',
  other: 'general',
}

const TARGET_CLUSTER: Record<CareerChangeTargetSlug, string> = {
  technology: 'technical',
  business_administration: 'office_commercial',
  marketing: 'office_commercial',
  healthcare: 'regulated_care',
  education: 'regulated_care',
  law: 'regulated_professional',
  finance: 'office_commercial',
  engineering: 'technical',
  creative_media: 'creative',
  skilled_trades: 'trades',
}

/** Lower score = easier transition (0–100). */
const PAIR_DIFFICULTY: Record<string, number> = {
  customer_service_marketing: 18,
  customer_service_business_administration: 20,
  retail_customer_service: 15,
  retail_marketing: 18,
  retail_business_administration: 20,
  administration_business_administration: 12,
  hospitality_marketing: 22,
  hospitality_business_administration: 25,
  marketing_business_administration: 20,
  marketing_marketing: 10,
  it_technology: 15,
  finance_finance: 12,
  law_law: 15,
  healthcare_healthcare: 18,
  education_education: 18,
  law_technology: 48,
  marketing_technology: 45,
  finance_technology: 42,
  hospitality_technology: 72,
  hospitality_engineering: 78,
  construction_law: 80,
  healthcare_engineering: 75,
  hospitality_law: 68,
  construction_engineering: 55,
}

const CLUSTER_DISTANCE: Record<string, number> = {
  people_service_office_commercial: 25,
  people_service_technical: 55,
  people_service_regulated_professional: 60,
  people_service_regulated_care: 35,
  office_commercial_technical: 45,
  office_commercial_regulated_professional: 50,
  technical_regulated_care: 50,
  technical_regulated_professional: 55,
  operations_office_commercial: 30,
  operations_technical: 50,
  trades_regulated_professional: 70,
  trades_technical: 45,
  creative_technical: 40,
  general_technical: 50,
}

function pairKey(current: CareerChangeFieldSlug, target: CareerChangeTargetSlug): string {
  return `${current}_${target}`
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

export function scoreTransitionDifficulty(
  current: CareerChangeFieldSlug,
  target: CareerChangeTargetSlug
): number {
  const key = pairKey(current, target)
  if (PAIR_DIFFICULTY[key] !== undefined) return PAIR_DIFFICULTY[key]

  if (current === target || FIELD_CLUSTER[current] === TARGET_CLUSTER[target]) return 20

  const from = FIELD_CLUSTER[current] ?? 'general'
  const to = TARGET_CLUSTER[target] ?? 'general'
  const distKey = `${from}_${to}`
  const reverseKey = `${to}_${from}`
  return CLUSTER_DISTANCE[distKey] ?? CLUSTER_DISTANCE[reverseKey] ?? 50
}

export function levelFromDifficultyScore(score: number): TransitionDifficultyLevel {
  if (score <= 30) return 'Easy'
  if (score <= 55) return 'Medium'
  return 'Hard'
}

export function computeTransitionDifficulty(
  current: CareerChangeFieldSlug,
  target: CareerChangeTargetSlug
): { level: TransitionDifficultyLevel; score: number } {
  const score = scoreTransitionDifficulty(current, target)
  return { level: levelFromDifficultyScore(score), score }
}

export function computeTransitionReadiness(
  state: CareerBrainState,
  difficulty: TransitionDifficultyLevel,
  difficultyScore: number,
  transferableSkills: string[]
): { score: number; summary: string } {
  const years = String(answers(state).cb_change_experience_years ?? '')
  let score = 58

  if (/10_plus/.test(years)) score += 14
  else if (/5_10/.test(years)) score += 12
  else if (/3_5/.test(years)) score += 9
  else if (/1_3/.test(years)) score += 5

  if (isCareerChangeStudyWilling(state)) score += 10
  else score += 3

  const retrain = String(answers(state).cb_change_retrain_time ?? answers(state).cb_change_pace ?? '')
  if (retrain === 'over_2_years' || retrain === '1_2_years') score += 8
  else if (retrain === '3_12_months') score += 5
  else if (retrain === 'under_3_months' || retrain === 'quick') score += 2

  if (String(answers(state).cb_change_salary_reduction) === 'yes') score += 7

  if (difficulty === 'Easy') score += 10
  else if (difficulty === 'Medium') score += 2
  else score -= 10

  score += Math.min(8, transferableSkills.length * 1.5)
  score -= Math.max(0, Math.round((difficultyScore - 40) / 8))

  const finalScore = Math.max(42, Math.min(92, Math.round(score)))

  let summary: string
  if (finalScore >= 78) {
    summary = 'High likelihood of a successful transition within 12–24 months with consistent action.'
  } else if (finalScore >= 62) {
    summary = 'Good transition potential — bridge employment plus targeted training should move you forward within 12–24 months.'
  } else if (finalScore >= 50) {
    summary = 'Achievable with a staged plan — expect 18–36 months and focus on building evidence in your target field.'
  } else {
    summary = 'A demanding transition — plan for longer retraining, bridge roles, and proof of new-field experience.'
  }

  return { score: finalScore, summary }
}

export function computeEmployabilityForTransition(
  readinessScore: number,
  difficulty: TransitionDifficultyLevel
): number {
  let score = readinessScore - 8
  if (difficulty === 'Easy') score += 6
  if (difficulty === 'Hard') score -= 4
  return Math.max(40, Math.min(88, Math.round(score)))
}

export function computeTransitionTimeline(
  state: CareerBrainState,
  difficulty: TransitionDifficultyLevel
): string {
  const retrain = String(answers(state).cb_change_retrain_time ?? answers(state).cb_change_pace ?? '')
  const byRetrain: Record<string, string> = {
    under_3_months: '6–12 months to first target-sector role',
    '3_12_months': '12–24 months',
    '1_2_years': '18–30 months',
    over_2_years: '24–48 months',
    quick: '6–12 months',
    gradual: '18–24 months',
    retrain: '24–48 months',
  }
  let timeline = byRetrain[retrain] ?? '12–24 months'
  if (difficulty === 'Hard' && !timeline.includes('24')) {
    timeline = '24–48 months (allow extra time for specialist entry)'
  }
  if (difficulty === 'Easy' && retrain === 'under_3_months') {
    timeline = '3–9 months to a bridge role, then 12–18 months to stabilise'
  }
  return timeline
}

export function buildTransitionTimelinePhases(
  difficulty: TransitionDifficultyLevel,
  targetField: string
): TransitionTimelinePhase[] {
  if (difficulty === 'Easy') {
    return [
      { period: '0–6 months', label: 'Bridge role', description: `Secure a ${targetField} entry role using transferable skills.` },
      { period: '6–18 months', label: 'Sector experience', description: 'Build references, complete short training, and deepen target-field exposure.' },
      { period: '2–4 years', label: 'Professional position', description: `Move into a stable ${targetField} career with clearer progression.` },
    ]
  }
  if (difficulty === 'Medium') {
    return [
      { period: '0–9 months', label: 'Bridge role', description: `Enter ${targetField} through a realistic support or assistant role.` },
      { period: '9–24 months', label: 'Sector experience', description: 'Combine paid work with certifications and portfolio evidence.' },
      { period: '2–5 years', label: 'Professional position', description: 'Progress into a mid-level specialist or coordinator role.' },
    ]
  }
  return [
    { period: '0–12 months', label: 'Bridge role', description: `Take a paid ${targetField} support role while retraining — income stability matters.` },
    { period: '1–3 years', label: 'Sector experience', description: 'Stack qualifications, projects, and UK references before targeting specialist roles.' },
    { period: '3–5 years', label: 'Professional position', description: 'Reach a credible long-term destination after sustained evidence building.' },
  ]
}

const TARGET_BLUEPRINTS: Record<CareerChangeTargetSlug, TargetProgressionBlueprint> = {
  technology: {
    pathLabel: 'Technology Path',
    workNow: [
      { title: 'IT Support Assistant', expectedSalary: '£22k–£28k', entryDifficulty: 'Low' },
      { title: 'Helpdesk Analyst', expectedSalary: '£24k–£30k', entryDifficulty: 'Low' },
      { title: 'Technical Support Analyst', expectedSalary: '£25k–£32k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'IT Support Specialist',
    milestonesStudyYes: [
      { title: 'CompTIA A+', category: 'certification', description: 'Foundation IT credential recognised by UK employers.' },
      { title: 'Google IT Support Certificate', category: 'certification', description: 'Structured helpdesk and troubleshooting basics.' },
      { title: 'Networking Fundamentals', category: 'skill', description: 'TCP/IP, DNS, and basic network troubleshooting.' },
      { title: 'Active Directory Basics', category: 'skill', description: 'User accounts, permissions, and office IT environments.' },
      { title: 'Technical Support Experience', category: 'experience', description: '6–12 months paid helpdesk work with documented tickets resolved.' },
    ],
    milestonesStudyNo: [
      { title: 'Home lab troubleshooting portfolio', category: 'portfolio', description: 'Document PC, network, and software fixes you can demonstrate.' },
      { title: 'Shadow an IT helpdesk team', category: 'experience', description: 'Observe ticket workflows and employer tools.' },
      { title: 'Software testing volunteer projects', category: 'experience', description: 'Entry route using analytical habits from your previous field.' },
    ],
    longTerm: ['Systems Administrator', 'Cloud Engineer', 'Cyber Security Analyst'],
  },
  business_administration: {
    pathLabel: 'Business & Administration Path',
    workNow: [
      { title: 'Office Administrator', expectedSalary: '£22k–£27k', entryDifficulty: 'Low' },
      { title: 'Admin Assistant', expectedSalary: '£21k–£26k', entryDifficulty: 'Low' },
      { title: 'Business Support Administrator', expectedSalary: '£23k–£28k', entryDifficulty: 'Low' },
    ],
    intermediateRole: 'Operations Coordinator',
    milestonesStudyYes: [
      { title: 'Microsoft Office Certification', category: 'certification', description: 'Excel, Outlook, and document management for UK offices.' },
      { title: 'Business Administration Certificate', category: 'certification', description: 'Part-time Level 2/3 admin qualification.' },
      { title: 'Process mapping & stakeholder communication', category: 'skill', description: 'Show you can coordinate tasks across teams.' },
      { title: 'Office systems experience', category: 'experience', description: '6–12 months in a UK admin team with references.' },
    ],
    milestonesStudyNo: [
      { title: 'Volunteer office admin (charity/SME)', category: 'experience', description: 'Build UK admin references quickly.' },
      { title: 'Excel self-study (free resources)', category: 'skill', description: 'Spreadsheets are essential for admin progression.' },
      { title: 'Temp agency admin placements', category: 'experience', description: 'Short contracts to prove reliability and systems use.' },
    ],
    longTerm: ['Operations Manager', 'Business Manager', 'Project Manager'],
  },
  marketing: {
    pathLabel: 'Marketing Path',
    workNow: [
      { title: 'Marketing Assistant', expectedSalary: '£22k–£28k', entryDifficulty: 'Low' },
      { title: 'Marketing Admin Assistant', expectedSalary: '£21k–£27k', entryDifficulty: 'Low' },
      { title: 'Social Media Assistant', expectedSalary: '£22k–£29k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'Marketing Coordinator',
    milestonesStudyYes: [
      { title: 'Digital Marketing Certificate', category: 'certification', description: 'Campaign basics, channels, and metrics.' },
      { title: 'Google Analytics / social media short course', category: 'certification', description: 'Show measurable campaign thinking.' },
      { title: 'Content portfolio (3–5 pieces)', category: 'portfolio', description: 'Posts, landing pages, or campaign examples.' },
      { title: 'Campaign support experience', category: 'experience', description: 'Assist on live campaigns in a junior marketing team.' },
    ],
    milestonesStudyNo: [
      { title: 'Volunteer social media for a local business', category: 'portfolio', description: 'Build before/after metrics for your CV.' },
      { title: 'Spec creative briefs', category: 'portfolio', description: 'Show strategy + execution without a formal course.' },
      { title: 'Junior marketing applications with portfolio link', category: 'experience', description: 'Target SMEs that hire on evidence over certificates.' },
    ],
    longTerm: ['Marketing Executive', 'Brand Manager', 'Marketing Manager'],
  },
  healthcare: {
    pathLabel: 'Healthcare Path',
    workNow: [
      { title: 'Healthcare Assistant', expectedSalary: '£21k–£25k', entryDifficulty: 'Low' },
      { title: 'Care Coordinator Assistant', expectedSalary: '£22k–£27k', entryDifficulty: 'Medium' },
      { title: 'Patient Support Administrator', expectedSalary: '£22k–£28k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'Senior Healthcare Assistant',
    milestonesStudyYes: [
      { title: 'Care Certificate', category: 'certification', description: 'Standard UK care entry — often employer-supported.' },
      { title: 'Moving and Handling / basic life support', category: 'certification', description: 'Common care employer requirements.' },
      { title: 'Safeguarding awareness', category: 'skill', description: 'Essential for NHS and private care settings.' },
      { title: 'Paid care experience', category: 'experience', description: '6–12 months HCA work with strong references.' },
    ],
    milestonesStudyNo: [
      { title: 'Volunteer in a care home or ward', category: 'experience', description: 'Build care references before paid applications.' },
      { title: 'Shadow a care coordinator', category: 'experience', description: 'Learn patient pathways and documentation.' },
      { title: 'Apply for employer-funded Care Certificate routes', category: 'experience', description: 'Many employers train after hire.' },
    ],
    longTerm: ['Senior Care Worker', 'Healthcare Coordinator', 'Team Leader (care)'],
  },
  education: {
    pathLabel: 'Education Path',
    workNow: [
      { title: 'Teaching Assistant', expectedSalary: '£20k–£24k', entryDifficulty: 'Low' },
      { title: 'Learning Support Assistant', expectedSalary: '£20k–£25k', entryDifficulty: 'Low' },
      { title: 'School Admin Assistant', expectedSalary: '£21k–£26k', entryDifficulty: 'Low' },
    ],
    intermediateRole: 'Senior Teaching Assistant',
    milestonesStudyYes: [
      { title: 'Teaching Assistant qualification', category: 'certification', description: 'Level 2/3 supporting teaching and learning.' },
      { title: 'Safeguarding training', category: 'certification', description: 'Required for most school-facing roles.' },
      { title: 'Classroom experience', category: 'experience', description: 'Term-time placement or paid TA work.' },
      { title: 'Level 3 Education Support', category: 'certification', description: 'Progression toward HLTA or cover supervisor routes.' },
    ],
    milestonesStudyNo: [
      { title: 'Volunteer in a school or homework club', category: 'experience', description: 'Build safeguarding-aware classroom exposure.' },
      { title: 'Shadow a learning support team', category: 'experience', description: 'Observe SEN and pastoral support routines.' },
      { title: 'School admin → pupil support route', category: 'experience', description: 'Move from office work into pupil-facing support.' },
    ],
    longTerm: ['Higher Level Teaching Assistant', 'SEN Specialist', 'Education Coordinator'],
  },
  law: {
    pathLabel: 'Law Path',
    workNow: [
      { title: 'Legal Receptionist', expectedSalary: '£21k–£26k', entryDifficulty: 'Low' },
      { title: 'Legal Admin Assistant', expectedSalary: '£22k–£28k', entryDifficulty: 'Medium' },
      { title: 'Casework Assistant', expectedSalary: '£23k–£29k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'Legal Administrator',
    milestonesStudyYes: [
      { title: 'Legal Administration Course', category: 'certification', description: 'Legal terminology, filing, and confidentiality.' },
      { title: 'Legal Secretary Certificate', category: 'certification', description: 'Recognised UK legal support qualification.' },
      { title: 'Case file management experience', category: 'experience', description: '6–12 months in a firm or advice centre.' },
    ],
    milestonesStudyNo: [
      { title: 'Volunteer at Citizens Advice', category: 'experience', description: 'Casework exposure without long study.' },
      { title: 'Shadow legal admin staff', category: 'experience', description: 'Learn client intake and document control.' },
      { title: 'Legal admin applications with confidentiality focus', category: 'experience', description: 'Highlight attention to detail from prior work.' },
    ],
    longTerm: ['Legal Administrator', 'Paralegal', 'Legal Operations Coordinator'],
  },
  finance: {
    pathLabel: 'Finance Path',
    workNow: [
      { title: 'Accounts Assistant', expectedSalary: '£22k–£28k', entryDifficulty: 'Low' },
      { title: 'Finance Administrator', expectedSalary: '£23k–£29k', entryDifficulty: 'Medium' },
      { title: 'Payroll Assistant', expectedSalary: '£24k–£30k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'Assistant Accountant',
    milestonesStudyYes: [
      { title: 'AAT Foundation Certificate', category: 'certification', description: 'Core UK finance entry qualification.' },
      { title: 'Bookkeeping Certificate', category: 'certification', description: 'Practical accounts processing skills.' },
      { title: 'Excel Advanced for finance', category: 'skill', description: 'Pivot tables, reconciliations, and reporting.' },
      { title: 'Finance team experience', category: 'experience', description: '6–12 months processing invoices and payroll.' },
    ],
    milestonesStudyNo: [
      { title: 'Excel for finance short course', category: 'certification', description: 'Low-cost boost for finance admin applications.' },
      { title: 'Volunteer bookkeeper (charity)', category: 'experience', description: 'Build UK finance references.' },
      { title: 'Accounts assistant temp placements', category: 'experience', description: 'Prove numeracy and accuracy quickly.' },
    ],
    longTerm: ['Assistant Accountant', 'Payroll Manager', 'Finance Officer'],
  },
  engineering: {
    pathLabel: 'Engineering Path',
    workNow: [
      { title: 'Engineering Technician Assistant', expectedSalary: '£24k–£30k', entryDifficulty: 'Medium' },
      { title: 'CAD Technician Assistant', expectedSalary: '£25k–£32k', entryDifficulty: 'Medium' },
      { title: 'Quality Technician', expectedSalary: '£24k–£31k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'Engineering Technician',
    milestonesStudyYes: [
      { title: 'CAD training (SolidWorks/AutoCAD)', category: 'certification', description: 'Technical drawing skills for manufacturing teams.' },
      { title: 'HNC Engineering (part-time)', category: 'certification', description: 'Structured progression toward technician roles.' },
      { title: 'Quality & inspection basics', category: 'skill', description: 'Measurement, tolerances, and documentation.' },
    ],
    milestonesStudyNo: [
      { title: 'CAD self-practice portfolio', category: 'portfolio', description: 'Sample drawings and models for applications.' },
      { title: 'Workplace shadowing on site', category: 'experience', description: 'Observe engineering workflows and safety.' },
      { title: 'Technician apprentice or trainee applications', category: 'experience', description: 'Employer-led routes without full degree.' },
    ],
    longTerm: ['Project Engineer', 'Engineering Project Coordinator', 'Design Engineer'],
  },
  creative_media: {
    pathLabel: 'Creative & Media Path',
    workNow: [
      { title: 'Content Assistant', expectedSalary: '£20k–£26k', entryDifficulty: 'Medium' },
      { title: 'Production Assistant (creative)', expectedSalary: '£21k–£27k', entryDifficulty: 'Medium' },
      { title: 'Design Assistant', expectedSalary: '£22k–£28k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'Junior Content Producer',
    milestonesStudyYes: [
      { title: 'Portfolio development workshop', category: 'certification', description: 'Structured feedback on creative work.' },
      { title: 'Video editing / design short course', category: 'certification', description: 'Tool-based skills employers expect.' },
      { title: 'Published portfolio pieces', category: 'portfolio', description: '3–5 strong samples with brief + outcome.' },
    ],
    milestonesStudyNo: [
      { title: 'Spec projects for local businesses', category: 'portfolio', description: 'Build evidence without formal study.' },
      { title: 'Volunteer content for charities', category: 'experience', description: 'Real briefs and deadlines for your showreel.' },
      { title: 'Freelance micro-projects', category: 'experience', description: 'Small paid pieces to prove client delivery.' },
    ],
    longTerm: ['Content Producer', 'Motion Designer', 'Creative Lead'],
  },
  skilled_trades: {
    pathLabel: 'Skilled Trades Path',
    workNow: [
      { title: 'Trainee Electrician', expectedSalary: '£20k–£26k', entryDifficulty: 'Medium' },
      { title: 'Construction Operative', expectedSalary: '£22k–£28k', entryDifficulty: 'Low' },
      { title: 'Maintenance Technician', expectedSalary: '£23k–£30k', entryDifficulty: 'Medium' },
    ],
    intermediateRole: 'Qualified Tradesperson (apprentice route)',
    milestonesStudyYes: [
      { title: 'CSCS Card', category: 'certification', description: 'Required for most UK construction sites.' },
      { title: 'Health & Safety on site', category: 'certification', description: 'Site induction and safety awareness.' },
      { title: 'Trade apprenticeship or NVQ', category: 'certification', description: 'Employer-led qualification pathway.' },
    ],
    milestonesStudyNo: [
      { title: 'Labourer role to learn on site', category: 'experience', description: 'Entry while seeking trainee placement.' },
      { title: 'Employer trainee programme applications', category: 'experience', description: 'Target firms hiring career changers.' },
      { title: 'Basic tools + site safety awareness', category: 'skill', description: 'Show practical readiness in interviews.' },
    ],
    longTerm: ['Qualified Tradesperson', 'Site Supervisor', 'Maintenance Manager'],
  },
}

/** Pair-specific Work Now title overrides (still target-field roles). */
const WORK_NOW_OVERRIDES: Record<string, string[]> = {
  hospitality_to_marketing: ['Marketing Assistant', 'Marketing Admin Assistant', 'Social Media Assistant'],
  finance_to_education: ['Teaching Assistant', 'Learning Support Assistant', 'School Admin Assistant'],
  marketing_to_finance: ['Accounts Assistant', 'Finance Admin Assistant', 'Payroll Assistant'],
  hospitality_to_law: ['Legal Receptionist', 'Legal Admin Assistant', 'Casework Assistant'],
  engineering_to_technology: ['IT Support Assistant', 'Junior Web Developer', 'Technical Support Analyst'],
  customer_service_to_healthcare: ['Healthcare Assistant', 'Care Coordinator Assistant', 'Patient Support Administrator'],
}

export function getTargetBlueprint(target: CareerChangeTargetSlug): TargetProgressionBlueprint {
  return TARGET_BLUEPRINTS[target]
}

export function resolveWorkNowRoles(
  current: CareerChangeFieldSlug,
  target: CareerChangeTargetSlug
): TargetProgressionBlueprint['workNow'] {
  const override = WORK_NOW_OVERRIDES[pairKey(current, target)]
  const blueprint = TARGET_BLUEPRINTS[target]
  if (!override) return blueprint.workNow
  return override.map((title, i) => {
    const base = blueprint.workNow[i] ?? blueprint.workNow[0]
    return { ...base, title }
  })
}

export function buildEnhancedRealityCheck(
  state: CareerBrainState,
  currentField: string,
  targetField: string,
  difficulty: TransitionDifficultyLevel,
  currentSlug: CareerChangeFieldSlug,
  targetSlug: CareerChangeTargetSlug
): string {
  const reason = labelCareerChangeReason(state)
  const study = isCareerChangeStudyWilling(state)
  const salaryFlex = String(answers(state).cb_change_salary_reduction) === 'yes'

  if (difficulty === 'Hard') {
    const obstacle =
      study && salaryFlex
        ? `proving ${targetField} experience to employers while your CV is still heavily focused on ${currentField}`
        : !study
          ? `gaining ${targetField} qualifications and references without committing to structured retraining`
          : `funding the transition while maintaining income — ${targetField} employers will want evidence, not just intent`
    return `Your biggest challenge is not simply "wanting" ${targetField}. Your biggest challenge is ${obstacle}. Focus on building evidence, projects, certifications, and transferable skills from ${currentField}.`
  }

  if (reason.includes('salary') && !salaryFlex) {
    return `You want better salary but may need a temporary pay adjustment during the bridge phase — plan savings or part-time study around your first ${targetField} role.`
  }

  if (!study) {
    return `Your biggest challenge is proving ${targetField} experience without formal study. Prioritise bridge employment, volunteering, and portfolio evidence so employers see ${targetField} capability — not only ${currentField} history.`
  }

  const clusterGap =
    FIELD_CLUSTER[currentSlug] !== TARGET_CLUSTER[targetSlug]
  if (clusterGap) {
    return `Your biggest challenge is not learning ${targetField} basics — it is convincing UK employers you belong in ${targetField} while your track record is in ${currentField}. Use bridge roles, certifications, and project evidence to close that perception gap.`
  }

  return `Your main obstacle is speed: moving from ${currentField} into ${targetField} before employers default to your old field label. Lead applications with transferable skills and target-sector references.`
}

export function buildStrategicSummary(
  state: CareerBrainState,
  currentField: string,
  targetField: string,
  transferableSkills: string[],
  routeType: string,
  difficulty: TransitionDifficultyLevel,
  readinessSummary: string
): string {
  const years = labelCareerChangeExperienceYears(state)
  const reason = labelCareerChangeReason(state)
  const skills = transferableSkills.slice(0, 4).join(', ')
  return [
    `You are moving from ${currentField} into ${targetField} (${difficulty} transition).`,
    `Your ${years} in ${currentField} gives you ${skills} — assets that still matter.`,
    `Because you want ${reason}, the strategic route is ${routeType}.`,
    readinessSummary,
  ].join(' ')
}

export function milestoneCategoryLabel(category: BuildNextMilestone['category']): string {
  switch (category) {
    case 'certification':
      return 'Certification'
    case 'skill':
      return 'Skill'
    case 'experience':
      return 'Experience'
    case 'portfolio':
      return 'Portfolio'
    default:
      return 'Step'
  }
}
