/**
 * Career Change engine — transferable skills, transition routes, UK roadmap.
 */

import {
  buildEnhancedRealityCheck,
  buildStrategicSummary,
  buildTransitionTimelinePhases,
  computeEmployabilityForTransition,
  computeTransitionDifficulty,
  computeTransitionReadiness,
  computeTransitionTimeline,
  getTargetBlueprint,
  resolveWorkNowRoles,
  type BuildNextMilestone,
  type CareerChangeFieldSlug,
  type CareerChangeTargetSlug,
  type TransitionDifficultyLevel,
  type TransitionTimelinePhase,
} from './careerChangeTransitionAdvisor'
import {
  isCareerChangePath,
  isCareerChangeStudyWilling,
  labelCareerChangeCurrentField,
  labelCareerChangeTargetField,
  resolveCareerChangeCurrentField,
  resolveCareerChangeTargetField,
} from './careerChangePath'
import type { CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import { resolveCareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import {
  resolveTargetSectorFromInterests,
  type InterestProfileContext,
} from '@/lib/career-engine/shared/interestScoring'
import type { CareerBrainRecommendation, CareerBrainState, CareerDomain, CareerProfile } from './types'

export type { CareerChangeFieldSlug, CareerChangeTargetSlug } from './careerChangeTransitionAdvisor'
export type TransitionDifficulty = TransitionDifficultyLevel

export type CareerChangeTransitionPlan = {
  currentField: string
  targetField: string
  currentSlug: CareerChangeFieldSlug
  targetSlug: CareerChangeTargetSlug
  transferableSkills: string[]
  transitionDifficulty: TransitionDifficulty
  estimatedTimeline: string
  confidenceScore: number
  transitionReadinessScore: number
  transitionReadinessSummary: string
  difficultyScore: number
  fastestRouteSummary: string
  recommendedTraining: string[]
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
  timelinePhases: TransitionTimelinePhase[]
  buildNextPath: {
    pathLabel: string
    intermediateRole: string
    milestones: BuildNextMilestone[]
  }
  summary: string
  realityCheck: string
  routeType: string
}

const BASE_SKILLS: Record<CareerChangeFieldSlug, string[]> = {
  hospitality: [
    'Customer Communication',
    'Relationship Building',
    'Customer Psychology',
    'Problem Solving',
    'Sales Awareness',
    'Team Collaboration',
    'Time Management',
    'Working Under Pressure',
  ],
  retail: [
    'Customer Service',
    'Sales Awareness',
    'Product Knowledge',
    'Team Collaboration',
    'Cash Handling',
    'Stock Organisation',
    'Problem Solving',
    'Time Management',
  ],
  customer_service: [
    'Customer Communication',
    'Conflict Resolution',
    'Active Listening',
    'Problem Solving',
    'CRM Awareness',
    'Patience Under Pressure',
    'Team Collaboration',
  ],
  marketing: [
    'Communication',
    'Content Awareness',
    'Campaign Thinking',
    'Customer Insight',
    'Creativity',
    'Data Interpretation',
    'Project Coordination',
  ],
  it: [
    'Technical Troubleshooting',
    'Logical Problem Solving',
    'Systems Thinking',
    'Documentation',
    'User Support',
    'Process Improvement',
    'Attention to Detail',
  ],
  engineering: [
    'Analytical Thinking',
    'Data Interpretation',
    'Project Coordination',
    'Problem Solving',
    'Technical Communication',
    'Research Skills',
    'Quality Control',
    'Process Improvement',
  ],
  healthcare: [
    'Empathy',
    'Safeguarding Awareness',
    'Team Collaboration',
    'Record Keeping',
    'Working Under Pressure',
    'Communication with Vulnerable People',
    'Reliability',
  ],
  education: [
    'Communication',
    'Instructional Support',
    'Patience',
    'Organisation',
    'Safeguarding Awareness',
    'Team Collaboration',
    'Presentation Skills',
  ],
  administration: [
    'Organisation',
    'Document Management',
    'Scheduling',
    'Communication',
    'Microsoft Office',
    'Attention to Detail',
    'Customer Service',
  ],
  finance: [
    'Numeracy',
    'Attention to Detail',
    'Compliance Awareness',
    'Data Entry',
    'Reporting',
    'Analytical Thinking',
    'Confidentiality',
  ],
  law: [
    'Research Skills',
    'Written Communication',
    'Attention to Detail',
    'Case Organisation',
    'Confidentiality',
    'Analytical Thinking',
    'Client Communication',
  ],
  logistics: [
    'Time Management',
    'Route Planning',
    'Safety Awareness',
    'Reliability',
    'Physical Stamina',
    'Team Coordination',
    'Customer Service',
  ],
  construction: [
    'Health & Safety Awareness',
    'Practical Problem Solving',
    'Team Collaboration',
    'Manual Dexterity',
    'Site Communication',
    'Reliability',
  ],
  creative_media: [
    'Creativity',
    'Visual Communication',
    'Content Production',
    'Storytelling',
    'Brand Awareness',
    'Project Deadlines',
    'Collaboration',
  ],
  driving: [
    'Reliability',
    'Time Management',
    'Route Planning',
    'Customer Service',
    'Safety Awareness',
    'Independence',
    'Navigation',
  ],
  other: [
    'Communication',
    'Team Collaboration',
    'Problem Solving',
    'Reliability',
    'Adaptability',
    'Time Management',
  ],
}

const TARGET_SKILL_EMPHASIS: Record<CareerChangeTargetSlug, string[]> = {
  technology: ['Logical Problem Solving', 'Technical Communication', 'Attention to Detail', 'Systems Thinking'],
  business_administration: ['Organisation', 'Communication', 'Microsoft Office', 'Scheduling', 'Customer Service'],
  marketing: ['Customer Communication', 'Content Awareness', 'Creativity', 'Data Interpretation', 'Sales Awareness'],
  healthcare: ['Empathy', 'Reliability', 'Communication', 'Safeguarding Awareness', 'Team Collaboration'],
  education: ['Communication', 'Patience', 'Presentation Skills', 'Organisation', 'Instructional Support'],
  law: ['Research Skills', 'Written Communication', 'Attention to Detail', 'Analytical Thinking', 'Confidentiality'],
  finance: ['Numeracy', 'Attention to Detail', 'Analytical Thinking', 'Reporting', 'Compliance Awareness'],
  engineering: ['Analytical Thinking', 'Problem Solving', 'Project Coordination', 'Technical Communication'],
  creative_media: ['Creativity', 'Visual Communication', 'Storytelling', 'Content Production', 'Brand Awareness'],
  skilled_trades: ['Practical Problem Solving', 'Health & Safety Awareness', 'Reliability', 'Manual Dexterity'],
}

function interestContextFromState(state: CareerBrainState): InterestProfileContext {
  const a = answers(state)
  return {
    educationLevel: String(a.cb_first_job_education_level ?? a.education_level ?? ''),
    englishLevel: String(a.cb_english_level ?? a.english_level ?? ''),
    ukWorkExperience: String(a.uk_work_experience ?? ''),
    hasWorkExperience: String(a.cb_change_experience_years ?? '0_1') !== '0_1',
    studyWilling: String(a.cb_change_study_willing ?? 'yes'),
    urgency: String(a.urgency ?? ''),
    targetField: String(a.cb_change_target_field ?? ''),
  }
}

function suggestTargetFromCombinedInterests(state: CareerBrainState): CareerChangeTargetSlug {
  const sector = resolveTargetSectorFromInterests(
    String(answers(state).cb_change_interest_area ?? ''),
    interestContextFromState(state)
  )
  return SECTOR_TO_TARGET_SLUG[sector]
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

const SECTOR_TO_CURRENT_SLUG: Record<CareerSectorId, CareerChangeFieldSlug> = {
  hospitality: 'hospitality',
  retail_sales: 'retail',
  customer_service: 'customer_service',
  office_admin: 'administration',
  hr_recruitment: 'administration',
  accountant: 'finance',
  marketing_digital: 'marketing',
  it_technology: 'it',
  manufacturing_engineering: 'engineering',
  construction_trades: 'construction',
  healthcare: 'healthcare',
  education_teaching: 'education',
  transport_logistics: 'logistics',
  warehouse_supply_chain: 'logistics',
  security: 'other',
  cleaning_facilities: 'other',
  creative_design: 'creative_media',
  legal_compliance: 'law',
  public_sector: 'administration',
  science_laboratory: 'engineering',
  other: 'other',
}

const SECTOR_TO_TARGET_SLUG: Record<CareerSectorId, CareerChangeTargetSlug> = {
  hospitality: 'business_administration',
  retail_sales: 'marketing',
  customer_service: 'business_administration',
  office_admin: 'business_administration',
  hr_recruitment: 'business_administration',
  accountant: 'finance',
  marketing_digital: 'marketing',
  it_technology: 'technology',
  manufacturing_engineering: 'engineering',
  construction_trades: 'skilled_trades',
  healthcare: 'healthcare',
  education_teaching: 'education',
  transport_logistics: 'business_administration',
  warehouse_supply_chain: 'business_administration',
  security: 'business_administration',
  cleaning_facilities: 'skilled_trades',
  creative_design: 'creative_media',
  legal_compliance: 'law',
  public_sector: 'business_administration',
  science_laboratory: 'engineering',
  other: 'business_administration',
}

function normalizeCurrentSlug(state: CareerBrainState): CareerChangeFieldSlug {
  const raw = String(answers(state).cb_change_current_field ?? '').toLowerCase()
  const sectorId = resolveCareerSectorId(raw)
  if (sectorId) return SECTOR_TO_CURRENT_SLUG[sectorId]
  if (raw in BASE_SKILLS) return raw as CareerChangeFieldSlug
  const text = resolveCareerChangeCurrentField(state).toLowerCase()
  if (/hospitality|hotel|bar|kitchen|restaurant/.test(text)) return 'hospitality'
  if (/retail|shop|store/.test(text)) return 'retail'
  if (/customer service|call centre/.test(text)) return 'customer_service'
  if (/marketing|communications|social media/.test(text)) return 'marketing'
  if (/it\b|software|helpdesk|digital/.test(text)) return 'it'
  if (/engineer|manufacturing|cad/.test(text)) return 'engineering'
  if (/health|care|nursing/.test(text)) return 'healthcare'
  if (/teach|education|school/.test(text)) return 'education'
  if (/admin|office|reception/.test(text)) return 'administration'
  if (/finance|account/.test(text)) return 'finance'
  if (/legal|law/.test(text)) return 'law'
  if (/logistics|warehouse|delivery|driver|taxi/.test(text)) return 'logistics'
  if (/construction|trades|electric/.test(text)) return 'construction'
  if (/creative|media|design|video/.test(text)) return 'creative_media'
  if (/driv|taxi|courier/.test(text)) return 'driving'
  return 'other'
}

export function normalizeTargetSlug(state: CareerBrainState): CareerChangeTargetSlug {
  const raw = String(
    answers(state).cb_change_target_field ?? answers(state).cb_change_direction ?? ''
  ).toLowerCase()

  if (raw === 'not_sure' || raw === 'unsure') {
    const suggested = String(answers(state).cb_change_suggested_target ?? '').toLowerCase()
    const suggestedSector = resolveCareerSectorId(suggested)
    if (suggestedSector) return SECTOR_TO_TARGET_SLUG[suggestedSector]
    if (suggested && suggested in TARGET_SKILL_EMPHASIS) return suggested as CareerChangeTargetSlug
    const interest = String(answers(state).cb_change_interest_area ?? '')
    if (interest) return suggestTargetFromCombinedInterests(state)
    return 'business_administration'
  }

  const sectorId = resolveCareerSectorId(raw)
  if (sectorId) return SECTOR_TO_TARGET_SLUG[sectorId]

  const mapped =
    raw === 'office_admin'
      ? 'business_administration'
      : raw === 'it_digital'
        ? 'technology'
        : raw === 'care_support'
          ? 'healthcare'
          : raw === 'skilled_trade'
            ? 'skilled_trades'
            : raw

  if (mapped in TARGET_SKILL_EMPHASIS) return mapped as CareerChangeTargetSlug
  const text = resolveCareerChangeTargetField(state).toLowerCase()
  if (/tech|software|digital|it\b/.test(text)) return 'technology'
  if (/market/.test(text)) return 'marketing'
  if (/health|care/.test(text)) return 'healthcare'
  if (/legal|law/.test(text)) return 'law'
  if (/finance/.test(text)) return 'finance'
  if (/engineer/.test(text)) return 'engineering'
  if (/creative|media/.test(text)) return 'creative_media'
  if (/trade|construction/.test(text)) return 'skilled_trades'
  return 'business_administration'
}

export function suggestTargetFromInterest(state: CareerBrainState): CareerChangeTargetSlug {
  return suggestTargetFromCombinedInterests(state)
}

export function buildTransferableSkills(
  current: CareerChangeFieldSlug,
  target: CareerChangeTargetSlug
): string[] {
  const base = BASE_SKILLS[current] ?? BASE_SKILLS.other
  const emphasis = TARGET_SKILL_EMPHASIS[target] ?? []
  const merged: string[] = []
  for (const skill of [...emphasis, ...base]) {
    if (!merged.some((s) => s.toLowerCase() === skill.toLowerCase())) merged.push(skill)
    if (merged.length >= 10) break
  }
  while (merged.length < 4) {
    for (const skill of base) {
      if (!merged.includes(skill)) merged.push(skill)
      if (merged.length >= 4) break
    }
    break
  }
  return merged.slice(0, 6)
}

function domainForTarget(target: CareerChangeTargetSlug): CareerDomain {
  switch (target) {
    case 'technology':
      return 'IT_digital'
    case 'healthcare':
      return 'healthcare'
    case 'finance':
      return 'finance_accounting'
    case 'engineering':
    case 'skilled_trades':
      return 'construction_trades'
    case 'creative_media':
      return 'creative_media'
    case 'education':
      return 'education_training'
    case 'law':
    case 'business_administration':
    case 'marketing':
    default:
      return 'admin_business'
  }
}

function rec(
  title: string,
  why: string,
  track: CareerBrainRecommendation['track'],
  domain: CareerDomain,
  options?: {
    stepType?: CareerBrainRecommendation['stepType']
    expectedSalary?: string
    entryDifficulty?: 'Low' | 'Medium' | 'High'
    recommendedTraining?: string[]
  }
): CareerBrainRecommendation {
  const stepType =
    options?.stepType ??
    (track === 'build_next' && /certificate|course|training|certification|qualification/i.test(title)
      ? 'training'
      : 'career_step')
  return {
    title,
    why,
    track,
    field_tag: domain,
    domain,
    source: 'fallback',
    stepType,
    expectedSalary: options?.expectedSalary,
    entryDifficulty: options?.entryDifficulty,
    recommendedTraining: options?.recommendedTraining,
  }
}

function skillPhrase(skills: string[], limit = 3): string {
  return skills.slice(0, limit).join(', ')
}

function buildRouteType(
  state: CareerBrainState,
  difficulty: TransitionDifficultyLevel,
  targetField: string,
  studyWilling: boolean
): string {
  const retrain = String(answers(state).cb_change_retrain_time ?? '')
  if (!studyWilling) return `a low-study, experience-first route into ${targetField}`
  if (difficulty === 'Hard') return `a staged retraining route into ${targetField} with bridge employment first`
  if (retrain === 'under_3_months') return `a fast bridge-role entry into ${targetField} while completing short certifications`
  if (retrain === 'over_2_years') return `a structured qualification pathway into ${targetField}`
  return `a balanced bridge-job plus certification route into ${targetField}`
}

function formatWorkNowWhy(
  role: { title: string; expectedSalary: string; entryDifficulty: 'Low' | 'Medium' | 'High' },
  skills: string[],
  currentField: string,
  targetField: string
): string {
  return [
    `Why it fits: uses your ${skillPhrase(skills)} from ${currentField} while giving direct ${targetField} experience.`,
    `This role creates a realistic bridge into the sector — not a fallback outside your target field.`,
    `What to do next: tailor your CV to ${role.title} vacancies, lead with transferable skills in applications, and prepare examples from ${currentField} that map to ${targetField}.`,
    `Expected salary: ${role.expectedSalary} (UK guide, varies by region and employer).`,
    `Entry difficulty: ${role.entryDifficulty}.`,
  ].join(' ')
}

function formatMilestoneWhy(milestone: BuildNextMilestone, targetField: string, pathLabel: string): string {
  return [
    `${milestone.description}`,
    `Why it fits: this ${milestone.category} step directly supports your ${pathLabel} into ${targetField}.`,
    `What to do next: schedule this within your retraining window and track completion on your CV.`,
  ].join(' ')
}

function formatIntermediateRoleWhy(
  roleTitle: string,
  currentField: string,
  targetField: string,
  pathLabel: string
): string {
  return [
    `Why it fits: the natural next step after bridge roles — consolidates ${targetField} experience beyond ${currentField}.`,
    `What to do next: target ${roleTitle} roles once you have 6–12 months of ${targetField} references.`,
    `This milestone sits at the centre of your ${pathLabel}.`,
  ].join(' ')
}

function formatLongTermWhy(title: string, targetField: string, blueprintLabel: string): string {
  return [
    `Why it fits: a realistic ${targetField} destination on the ${blueprintLabel} — not a random jump from entry roles.`,
    `Expected progression: typically 2–5 years of UK ${targetField} experience, strong references, and completed development milestones.`,
    `What to do next: use this as your north star when choosing training and bridge roles.`,
  ].join(' ')
}

export function buildCareerChangeTransitionPlan(
  profile: CareerProfile,
  state: CareerBrainState
): CareerChangeTransitionPlan {
  const currentSlug = normalizeCurrentSlug(state)
  let targetSlug = normalizeTargetSlug(state)

  if (String(answers(state).cb_change_target_field ?? '') === 'not_sure') {
    targetSlug = suggestTargetFromInterest(state)
  }

  const currentField = resolveCareerChangeCurrentField(state) || labelCareerChangeCurrentField(currentSlug)
  const targetField = labelCareerChangeTargetField(targetSlug)
  const skills = buildTransferableSkills(currentSlug, targetSlug)
  const { level: difficulty, score: difficultyScore } = computeTransitionDifficulty(currentSlug, targetSlug)
  const timeline = computeTransitionTimeline(state, difficulty)
  const readiness = computeTransitionReadiness(state, difficulty, difficultyScore, skills)
  const employability = computeEmployabilityForTransition(readiness.score, difficulty)
  const blueprint = getTargetBlueprint(targetSlug)
  const workNowRoles = resolveWorkNowRoles(currentSlug, targetSlug)
  const domain = domainForTarget(targetSlug)
  const studyWilling = isCareerChangeStudyWilling(state)
  const routeType = buildRouteType(state, difficulty, targetField, studyWilling)
  const milestones = studyWilling ? blueprint.milestonesStudyYes : blueprint.milestonesStudyNo
  const timelinePhases = buildTransitionTimelinePhases(difficulty, targetField)

  const workNow = workNowRoles.slice(0, 3).map((role) =>
    rec(
      role.title,
      formatWorkNowWhy(role, skills, currentField, targetField),
      'work_now',
      domain,
      { expectedSalary: role.expectedSalary, entryDifficulty: role.entryDifficulty }
    )
  )

  const milestoneTitles = milestones.map((m) => m.title)
  const intermediateWhy = formatIntermediateRoleWhy(
    blueprint.intermediateRole,
    currentField,
    targetField,
    blueprint.pathLabel
  )

  const buildNext: CareerBrainRecommendation[] = [
    rec(blueprint.intermediateRole, intermediateWhy, 'build_next', domain, {
      stepType: 'career_step',
      recommendedTraining: milestoneTitles,
    }),
    ...milestones.slice(0, 4).map((m) =>
      rec(m.title, formatMilestoneWhy(m, targetField, blueprint.pathLabel), 'build_next', domain, {
        stepType: 'training',
      })
    ),
  ]

  const longTerm = blueprint.longTerm.slice(0, 3).map((title) =>
    rec(title, formatLongTermWhy(title, targetField, blueprint.pathLabel), 'long_term', domain)
  )

  const fastestRoute = workNow[0]
    ? `Phase 1: ${workNow[0].title} (${timelinePhases[0]?.period ?? '0–6 months'}) → Phase 2: ${blueprint.intermediateRole} → Phase 3: ${blueprint.longTerm[0]}. Typical overall window: ${timeline}.`
    : `Use a bridge role in ${targetField} while completing ${blueprint.pathLabel} milestones — typical window: ${timeline}.`

  profile.transferableSkills = skills

  const summary = buildStrategicSummary(
    state,
    currentField,
    targetField,
    skills,
    routeType,
    difficulty,
    readiness.summary
  )
  const realityCheck = buildEnhancedRealityCheck(state, currentField, targetField, difficulty, currentSlug, targetSlug)

  return {
    currentField,
    targetField,
    currentSlug,
    targetSlug,
    transferableSkills: skills,
    transitionDifficulty: difficulty,
    estimatedTimeline: timeline,
    confidenceScore: employability,
    transitionReadinessScore: readiness.score,
    transitionReadinessSummary: readiness.summary,
    difficultyScore,
    fastestRouteSummary: fastestRoute,
    recommendedTraining: milestoneTitles,
    workNow,
    buildNext,
    longTerm,
    timelinePhases,
    buildNextPath: {
      pathLabel: blueprint.pathLabel,
      intermediateRole: blueprint.intermediateRole,
      milestones,
    },
    summary,
    realityCheck,
    routeType,
  }
}

export function buildCareerChangeRecommendations(
  profile: CareerProfile,
  state: CareerBrainState
): { recommendations: CareerBrainRecommendation[]; plan: CareerChangeTransitionPlan; reasoning: string[] } {
  const plan = buildCareerChangeTransitionPlan(profile, state)
  const recommendations = [...plan.workNow, ...plan.buildNext, ...plan.longTerm]
  const reasoning = [
    `Career transition advisor: ${plan.currentField} → ${plan.targetField}`,
    `Transition difficulty: ${plan.transitionDifficulty} (score ${plan.difficultyScore}/100)`,
    `Transition readiness: ${plan.transitionReadinessScore}/100 — ${plan.transitionReadinessSummary}`,
    `Timeline: ${plan.estimatedTimeline}`,
    `Transferable skills: ${plan.transferableSkills.join(', ')}`,
    plan.realityCheck,
  ]
  return { recommendations, plan, reasoning }
}

export function isCareerChangeRecommendationPath(state: CareerBrainState): boolean {
  return isCareerChangePath(state)
}
