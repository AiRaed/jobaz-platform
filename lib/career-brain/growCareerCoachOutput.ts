/**
 * Grow Career coach output — profiles, gaps, plans, promotion readiness narrative.
 */

import {
  computeCareerGrowthScore,
  extractRoleCore,
  identifyMainBarrier,
  inferDynamicProgression,
  normalizeGrowLevelSlug,
  resolveLeadershipDestination,
  type DynamicProgression,
} from './growCareerGrowthAdvisor'
import {
  getGrowCareerBlockers,
  getGrowCareerCoreSkills,
  isGrowCareerStudyWilling,
  labelGrowCareerExperienceYears,
  labelGrowCareerGoal,
  labelGrowCareerLevel,
  resolveGrowCareerCurrentJobTitle,
  resolveGrowCareerField,
} from './growCareerPath'
import type { CareerBrainState } from './types'

export type CareerGrowthProfileLabel =
  | 'Early Career Professional'
  | 'Emerging Specialist'
  | 'Promotion Ready Candidate'
  | 'Leadership Candidate'
  | 'Career Accelerator'
  | 'Technical Expert Track'
  | 'Management Track'
  | 'High Potential Candidate'
  | 'Established Professional'

export type GrowCareerDetailedGaps = {
  skills: string[]
  qualifications: string[]
  certifications: string[]
  experience: string[]
  leadership: string[]
  technical: string[]
  portfolio: string[]
  networking: string[]
}

export type GrowCareerCoachAnalysis = {
  careerProfile: CareerGrowthProfileLabel
  promotionReadinessScore: number
  promotionReadinessExplanation: string
  growthBarriers: string[]
  mostLikelyNextRole: { role: string; reason: string; timeline: string }
  alternativeGrowthRoute: { role: string; reason: string }
  skillsToDevelop: string[]
  recommendedCertifications: string[]
  actionPlan90Days: string[]
  growthPlan6To12Months: string[]
  longTermCareerDirection: string
  detailedGaps: GrowCareerDetailedGaps
  assumptions: string[]
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}

function isCreativeRole(title: string): boolean {
  return /design|creative|motion|graphic|video|animator|content|art|media|illustrat/i.test(title)
}

function isTechnicalRole(title: string): boolean {
  return /developer|software|engineer|analyst|it |technology|programmer|architect|devops|data/i.test(title)
}

function isEducationRole(title: string): boolean {
  return /teach|teacher|education|tutor|hlta|learning support|classroom/i.test(title)
}

function isHealthcareRole(title: string): boolean {
  return /nurse|healthcare|care|clinical|hca|support worker|midwife/i.test(title)
}

export function inferCareerGrowthProfile(
  state: CareerBrainState,
  progression: DynamicProgression,
  readinessScore: number
): CareerGrowthProfileLabel {
  const goal = String(answers(state).cb_grow_goal ?? '')
  const level = normalizeGrowLevelSlug(state)
  const leadership = String(answers(state).cb_grow_leadership_ready ?? '')
  const years = String(answers(state).cb_grow_years ?? '')
  const blockers = getGrowCareerBlockers(state).filter((b) => b !== 'not_sure')

  if (readinessScore >= 78 && (level === 'senior' || level === 'team_leader')) {
    return 'High Potential Candidate'
  }
  if (readinessScore >= 72) return 'Promotion Ready Candidate'
  if (goal === 'leadership' && leadership !== 'no') return 'Leadership Candidate'
  if (goal === 'specialist' || goal === 'salary') return 'Technical Expert Track'
  if (goal === 'leadership') return 'Management Track'
  if (goal === 'change_company' && String(answers(state).cb_grow_employer_change ?? '') !== 'no') {
    return 'Career Accelerator'
  }
  if ((level === 'entry' || level === 'junior') && (years === '0_1' || years === '1_3')) {
    return 'Early Career Professional'
  }
  if (level === 'mid' && blockers.length <= 2) return 'Emerging Specialist'
  if (level === 'senior' || level === 'team_leader' || level === 'manager') {
    return 'Established Professional'
  }
  return 'Emerging Specialist'
}

export function buildPromotionReadinessExplanation(
  state: CareerBrainState,
  score: number,
  profile: CareerGrowthProfileLabel,
  mainBarrier: string
): string {
  const parts: string[] = []
  const years = labelCareerChangeExperienceYearsSafe(state)
  const study = isGrowCareerStudyWilling(state)
  const leadership = String(answers(state).cb_grow_leadership_ready ?? '')
  const employer = String(answers(state).cb_grow_employer_change ?? '')
  const blockers = getGrowCareerBlockers(state).filter((b) => b !== 'not_sure')

  parts.push(`Profile: ${profile}.`)
  parts.push(`You have ${years} in ${resolveGrowCareerCurrentJobTitle(state)} with a goal of ${labelGrowCareerGoal(state)}.`)

  if (score >= 75) {
    parts.push('Strong alignment between experience, goal clarity, and development commitment.')
  } else if (score >= 60) {
    parts.push('Good foundation — closing a few gaps should unlock the next level within 6–18 months.')
  } else if (score >= 40) {
    parts.push('Progress is achievable but requires structured development before promotion conversations.')
  } else {
    parts.push('Focus on fundamentals first: evidence, skills, and a clear next-step target.')
  }

  if (study) parts.push('Learning willingness adds readiness.')
  else parts.push('Limited study commitment may slow qualification-based progression.')

  if (leadership === 'yes') parts.push('Leadership readiness supports people-management routes.')
  if (employer === 'yes' || employer === 'maybe') parts.push('Employer mobility keeps external options open.')

  if (blockers.length) {
    parts.push(`Primary drag: ${mainBarrier.toLowerCase()}${blockers.length > 1 ? ` (+${blockers.length - 1} other barrier${blockers.length > 2 ? 's' : ''})` : ''}.`)
  }

  return parts.join(' ')
}

function labelCareerChangeExperienceYearsSafe(state: CareerBrainState): string {
  return labelGrowCareerExperienceYears(state)
}

export function buildDetailedGaps(state: CareerBrainState): GrowCareerDetailedGaps {
  const blockers = getGrowCareerBlockers(state)
  const jobTitle = resolveGrowCareerCurrentJobTitle(state).toLowerCase()
  const goal = String(answers(state).cb_grow_goal ?? '')
  const study = isGrowCareerStudyWilling(state)

  const gaps: GrowCareerDetailedGaps = {
    skills: [],
    qualifications: [],
    certifications: [],
    experience: [],
    leadership: [],
    technical: [],
    portfolio: [],
    networking: [],
  }

  if (blockers.includes('technical_skills')) {
    gaps.technical.push('Advanced technical depth for the next level in your craft')
  }
  if (blockers.includes('qualification') || !study) {
    gaps.qualifications.push('Formal or accredited qualification aligned to your next role level')
  }
  if (blockers.includes('uk_exp')) {
    gaps.experience.push('UK-specific references and employer-verified track record')
  }
  if (blockers.includes('leadership_exp') || goal === 'leadership') {
    gaps.leadership.push('Evidence of leading projects, people, or workstreams')
  }
  if (blockers.includes('weak_cv') || blockers.includes('confidence')) {
    gaps.skills.push('Promotion narrative — quantified impact on CV and in interviews')
  }
  if (blockers.includes('limited_opportunities')) {
    gaps.networking.push('Internal visibility and external market awareness for next-level roles')
  }

  if (isCreativeRole(jobTitle)) {
    gaps.portfolio.push('Portfolio pieces that prove next-level creative standards')
    if (study) gaps.certifications.push('Advanced tool certification (Adobe, motion, or UX)')
  }
  if (isTechnicalRole(jobTitle) && study) {
    gaps.certifications.push('Vendor or professional certification relevant to your stack')
    gaps.technical.push('Production-grade project or system ownership evidence')
  }
  if (isEducationRole(jobTitle)) {
    gaps.qualifications.push('Teaching assistant or HLTA qualification pathway if targeting classroom roles')
  }
  if (isHealthcareRole(jobTitle)) {
    gaps.qualifications.push('Mandatory care or clinical training for band/grade progression')
  }

  if (!gaps.networking.length) {
    gaps.networking.push('Professional network in your field for hidden promotion opportunities')
  }
  if (!gaps.experience.length) {
    gaps.experience.push('Documented ownership of outcomes at your current level')
  }

  return {
    skills: gaps.skills.slice(0, 3),
    qualifications: gaps.qualifications.slice(0, 3),
    certifications: gaps.certifications.slice(0, 3),
    experience: gaps.experience.slice(0, 3),
    leadership: gaps.leadership.slice(0, 3),
    technical: gaps.technical.slice(0, 3),
    portfolio: gaps.portfolio.slice(0, 3),
    networking: gaps.networking.slice(0, 3),
  }
}

export function buildGrowthBarriersList(state: CareerBrainState): string[] {
  const main = identifyMainBarrier(state)
  const blockers = getGrowCareerBlockers(state).filter((b) => b !== 'not_sure')
  const labels: Record<string, string> = {
    qualification: 'Missing qualifications for the next level',
    uk_exp: 'Limited UK experience or references',
    technical_skills: 'Technical depth not yet at next-level standard',
    leadership_exp: 'Limited leadership or people-management evidence',
    confidence: 'Under-selling achievements in applications',
    limited_opportunities: 'Limited progression in current company',
    weak_cv: 'CV / LinkedIn not aligned to next-level roles',
  }
  const list = blockers.map((b) => labels[b] ?? b.replace(/_/g, ' '))
  if (!list.includes(main) && main !== 'Unclear blocker') {
    list.unshift(main)
  }
  return [...new Set(list)].slice(0, 5)
}

export function inferAlternativeGrowthRoute(
  state: CareerBrainState,
  progression: DynamicProgression
): { role: string; reason: string } {
  const goal = String(answers(state).cb_grow_goal ?? '')
  const core = extractRoleCore(resolveGrowCareerCurrentJobTitle(state))
  const leadership = String(answers(state).cb_grow_leadership_ready ?? '')
  const techProgression = String(answers(state).jaz_tech_progression ?? '')
  const isSoftwareIc =
    techProgression === 'senior_ic' || techProgression === 'specialist' || techProgression === 'product'

  if (isSoftwareIc) {
    const icAlt =
      progression.buildNextTitle === 'Mid-Level Developer'
        ? 'Senior Developer (specialist depth)'
        : 'Staff Engineer / Principal Engineer track'
    return {
      role: icAlt,
      reason: `Based on your individual contributor goal, deepening technical scope as ${icAlt} is a realistic alternative — not engineering management.`,
    }
  }

  if (goal === 'leadership' && leadership !== 'no') {
    const specialist = progression.longTermTitle.includes('Director') || progression.longTermTitle.includes('Principal')
      ? progression.buildNextTitle
      : `Senior ${titleCase(core)}`
    return {
      role: specialist,
      reason: `If management openings are limited, deepening as ${specialist} raises pay and influence while keeping you in ${core}.`,
    }
  }

  if (goal === 'specialist') {
    const leadTitle = /engineer|developer|designer|analyst/i.test(core)
      ? `Lead ${titleCase(core)}`
      : `${titleCase(core)} Team Leader`
    return {
      role: leadTitle,
      reason: `An alternative is people leadership — useful if you prefer scope through teams rather than solo craft depth.`,
    }
  }

  if (goal === 'change_company') {
    return {
      role: progression.buildNextTitle,
      reason: `Same next-level target (${progression.buildNextTitle}) at a new employer — often faster than waiting for internal promotion.`,
    }
  }

  if (goal === 'work_life_balance') {
    return {
      role: progression.workNowTitle,
      reason: `Lateral move to a similar ${progression.workNowTitle} role with better conditions before pushing for ${progression.buildNextTitle}.`,
    }
  }

  const management = resolveLeadershipDestination(core, 'leadership')
  return {
    role: management,
    reason: `Management track (${management}) if you want broader scope beyond ${progression.buildNextTitle}.`,
  }
}

export function buildPrioritizedSkillsToDevelop(state: CareerBrainState): string[] {
  const gaps = buildDetailedGaps(state)
  const goal = String(answers(state).cb_grow_goal ?? '')
  const coreSkills = getGrowCareerCoreSkills(state)
  const prioritized: string[] = []

  if (goal === 'leadership') prioritized.push('People leadership and stakeholder communication')
  if (goal === 'specialist') prioritized.push(`Advanced ${extractRoleCore(resolveGrowCareerCurrentJobTitle(state))} craft`)
  if (!coreSkills.includes('Project Management')) prioritized.push('Project ownership and delivery accountability')
  if (gaps.technical.length) prioritized.push(gaps.technical[0]!)
  if (gaps.leadership.length) prioritized.push(gaps.leadership[0]!)
  if (gaps.skills.length) prioritized.push(gaps.skills[0]!)
  if (gaps.portfolio.length) prioritized.push('Portfolio quality and case-study storytelling')

  prioritized.push('Promotion evidence — metrics, outcomes, and references')

  return [...new Set(prioritized)].slice(0, 6)
}

export function buildRecommendedCertifications(state: CareerBrainState, buildNextTitle: string): string[] {
  if (!isGrowCareerStudyWilling(state)) return []

  const title = `${resolveGrowCareerCurrentJobTitle(state)} ${buildNextTitle}`.toLowerCase()
  const certs: string[] = []

  if (/motion|video|animator|creative|design|graphic|art/i.test(title)) {
    certs.push('Adobe Certified Professional (relevant app)')
    certs.push('Advanced motion design / After Effects course')
  } else if (/software|developer|engineer|it |technology|support|systems|network|data/i.test(title)) {
    certs.push('Relevant vendor cert (AWS, Azure, CompTIA, or stack-specific)')
  } else if (/nurse|healthcare|care|clinical/i.test(title)) {
    certs.push('Care Certificate / NVQ Level 3 (or role-specific clinical training)')
  } else if (/teach|education|hlta|learning support/i.test(title)) {
    certs.push('Level 3 Teaching Assistant or HLTA qualification')
  } else if (/account|finance|payroll|bookkeep/i.test(title)) {
    certs.push('AAT Level 3/4 or CIMI equivalent for finance progression')
  } else if (/market|brand|digital|social/i.test(title)) {
    certs.push('Google Analytics / CIM Level 4 (optional)')
  } else if (/engineer|mechanical|electrical|civil/i.test(title)) {
    certs.push('HNC/HND Engineering or AutoCAD professional certification')
  } else if (/manager|lead|coordinator|operations/i.test(title)) {
    certs.push('ILM Level 3 Leadership & Management (optional)')
  }

  return certs.slice(0, 4)
}

export function build90DayActionPlan(
  state: CareerBrainState,
  progression: DynamicProgression
): string[] {
  const actions: string[] = []
  const blockers = getGrowCareerBlockers(state)
  const jobTitle = resolveGrowCareerCurrentJobTitle(state).toLowerCase()

  actions.push('Update CV and LinkedIn with quantified achievements from the last 12 months')
  actions.push(`Align profile language to ${progression.buildNextTitle} responsibilities`)

  if (blockers.includes('weak_cv') || blockers.includes('confidence')) {
    actions.push('Prepare three STAR stories for promotion or interview conversations')
  }
  if (isCreativeRole(jobTitle)) {
    actions.push('Add 2 portfolio pieces that demonstrate next-level creative standards')
  }
  if (isTechnicalRole(jobTitle)) {
    actions.push('Document one technical project with measurable business impact')
  }
  if (blockers.includes('leadership_exp') || String(answers(state).cb_grow_goal) === 'leadership') {
    actions.push('Volunteer to lead a small workstream and capture outcomes for your manager')
  }
  if (blockers.includes('limited_opportunities')) {
    actions.push('Book a career conversation with your line manager about progression timeline')
  }

  return [...new Set(actions)].slice(0, 3)
}

export function build612MonthGrowthPlan(
  state: CareerBrainState,
  progression: DynamicProgression,
  certifications: string[]
): string[] {
  const study = isGrowCareerStudyWilling(state)
  const employer = String(answers(state).cb_grow_employer_change ?? '')
  const actions: string[] = []

  actions.push(`Build evidence for ${progression.buildNextTitle} — projects, references, and measurable KPIs`)
  if (study && certifications[0]) {
    actions.push(`Complete: ${certifications[0]}`)
  } else if (!study) {
    actions.push('Gain stretch assignments that mirror next-level responsibilities')
  }
  if (employer === 'yes' || employer === 'maybe') {
    actions.push(`Run a targeted job search for ${progression.buildNextTitle} roles while performing strongly`)
  } else {
    actions.push('Build an internal promotion case with your manager and HR')
  }
  actions.push(`Target applications or promotion conversations for ${progression.buildNextTitle} (${progression.nextStepTimeline})`)

  return actions.slice(0, 4)
}

export function buildLongTermCareerDirection(
  state: CareerBrainState,
  progression: DynamicProgression
): string {
  const field = resolveGrowCareerField(state)
  const goal = labelGrowCareerGoal(state)
  const jobTitle = resolveGrowCareerCurrentJobTitle(state)
  const isEducation = isEducationRole(jobTitle)

  if (isEducation && String(answers(state).jaz_edu_progression ?? '') === 'leadership') {
    return [
      `Over 3–5 years in ${field}, a possible progression from ${jobTitle} is:`,
      `${progression.workNowTitle} → ${progression.buildNextTitle} → ${progression.longTermTitle}.`,
      'This is possible long-term progression if qualifications and experience are gained — school leadership is not guaranteed.',
      'Typical requirements: recognised qualifications, leadership evidence, and several years of progression in UK schools.',
      `Your stated goal (${goal}) keeps this inside education — not a career change.`,
    ].join(' ')
  }

  return [
    `Over 3–5 years in ${field}, a likely progression from ${jobTitle} is:`,
    `${progression.workNowTitle} → ${progression.buildNextTitle} → ${progression.longTermTitle}.`,
    `Based on current evidence, your goal (${goal}) keeps this inside your current profession — not a career change.`,
    `Timeline assumption: ${progression.longTermTimeline} with consistent performance, ${isGrowCareerStudyWilling(state) ? 'continued learning,' : 'workplace evidence,'} and ${String(answers(state).cb_grow_employer_change ?? 'maybe') !== 'no' ? 'employer mobility if internal growth stalls' : 'loyalty to internal progression'}.`,
  ].join(' ')
}

export function buildProfessionalAssumptions(state: CareerBrainState): string[] {
  const assumptions: string[] = []
  if (!getGrowCareerCoreSkills(state).length) {
    assumptions.push('Core skills inferred from your job title where not explicitly selected.')
  }
  if (getGrowCareerBlockers(state).includes('not_sure')) {
    assumptions.push('Primary barrier inferred from your goal and level where obstacles were unclear.')
  }
  assumptions.push('UK labour market progression norms applied to your stated industry and title.')
  return assumptions.slice(0, 3)
}

export function buildGrowCareerCoachAnalysis(state: CareerBrainState): GrowCareerCoachAnalysis {
  const progression = inferDynamicProgression(state)
  const promotionReadinessScore = computeCareerGrowthScore(state)
  const mainBarrier = identifyMainBarrier(state)
  const careerProfile = inferCareerGrowthProfile(state, progression, promotionReadinessScore)
  const detailedGaps = buildDetailedGaps(state)
  const recommendedCertifications = buildRecommendedCertifications(state, progression.buildNextTitle)

  return {
    careerProfile,
    promotionReadinessScore,
    promotionReadinessExplanation: buildPromotionReadinessExplanation(
      state,
      promotionReadinessScore,
      careerProfile,
      mainBarrier
    ),
    growthBarriers: buildGrowthBarriersList(state),
    mostLikelyNextRole: {
      role: progression.buildNextTitle,
      reason: progression.nextStepReason,
      timeline: progression.nextStepTimeline,
    },
    alternativeGrowthRoute: inferAlternativeGrowthRoute(state, progression),
    skillsToDevelop: buildPrioritizedSkillsToDevelop(state),
    recommendedCertifications,
    actionPlan90Days: build90DayActionPlan(state, progression),
    growthPlan6To12Months: build612MonthGrowthPlan(state, progression, recommendedCertifications),
    longTermCareerDirection: buildLongTermCareerDirection(state, progression),
    detailedGaps,
    assumptions: buildProfessionalAssumptions(state),
  }
}
