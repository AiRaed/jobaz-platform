/**
 * Grow Career Growth Advisor — dynamic progression from job title (no per-industry trees).
 */

import {
  getGrowCareerBlockers,
  getGrowCareerCoreSkills,
  isGrowCareerStudyWilling,
  labelGrowCareerExperienceYears,
  labelGrowCareerGoal,
  labelGrowCareerLevel,
  resolveGrowCareerCurrentJobTitle,
  resolveGrowCareerField,
  resolveGrowCareerFieldSlug,
} from './growCareerPath'
import { describeExperienceRoleLower } from './jaz/growCareerExperienceLabels'
import { inferProfessionProgression } from './jaz/jazProfessionProgression'
import type { CareerBrainState, CareerDomain } from './types'

export type GrowCareerFieldSlug =
  | 'it'
  | 'engineering'
  | 'healthcare'
  | 'education'
  | 'customer_service'
  | 'administration'
  | 'finance'
  | 'marketing'
  | 'construction'
  | 'logistics'
  | 'hospitality'
  | 'retail'
  | 'creative_media'
  | 'other'

export type GrowCareerLevelSlug = 'entry' | 'junior' | 'mid' | 'senior' | 'team_leader' | 'manager'

export type GrowCareerScoreLabel =
  | 'Building Readiness'
  | 'Growing Profile'
  | 'Strong Growth Potential'
  | 'Promotion Ready'

export type MainBarrierLabel =
  | 'Qualification gap'
  | 'Technical skills gap'
  | 'Leadership gap'
  | 'Employer limitation'
  | 'Confidence gap'
  | 'Experience gap'
  | 'CV / employability gap'
  | 'Unclear blocker'

export type DynamicProgression = {
  workNowTitle: string
  buildNextTitle: string
  longTermTitle: string
  nextStepReason: string
  nextStepTimeline: string
  longTermTimeline: string
}

const LEVEL_ORDER: GrowCareerLevelSlug[] = ['entry', 'junior', 'mid', 'senior', 'team_leader', 'manager']

const FIELD_TO_DOMAIN: Record<GrowCareerFieldSlug, CareerDomain> = {
  it: 'IT_digital',
  engineering: 'construction_trades',
  healthcare: 'healthcare',
  education: 'education_training',
  customer_service: 'retail_customer_service',
  administration: 'admin_business',
  finance: 'finance_accounting',
  marketing: 'admin_business',
  construction: 'construction_trades',
  logistics: 'driving_logistics',
  hospitality: 'hospitality',
  retail: 'retail_customer_service',
  creative_media: 'creative_media',
  other: 'admin_business',
}

const PREFIXES = [
  'entry level',
  'entry-level',
  'entry',
  'graduate',
  'trainee',
  'junior',
  'assistant',
  'mid-level',
  'mid level',
  'mid',
  'senior',
  'lead',
  'principal',
  'head of',
  'chief',
]

const BLOCKER_TO_BARRIER: Record<string, MainBarrierLabel> = {
  qualification: 'Qualification gap',
  uk_exp: 'Experience gap',
  technical_skills: 'Technical skills gap',
  leadership_exp: 'Leadership gap',
  confidence: 'Confidence gap',
  limited_opportunities: 'Employer limitation',
  weak_cv: 'CV / employability gap',
  not_sure: 'Unclear blocker',
}

const BLOCKER_PRIORITY_BY_GOAL: Record<string, string[]> = {
  salary: ['qualification', 'technical_skills', 'weak_cv', 'limited_opportunities', 'confidence', 'uk_exp', 'leadership_exp'],
  promotion: ['leadership_exp', 'qualification', 'technical_skills', 'limited_opportunities', 'weak_cv', 'confidence', 'uk_exp'],
  leadership: ['leadership_exp', 'confidence', 'qualification', 'limited_opportunities', 'technical_skills', 'weak_cv', 'uk_exp'],
  specialist: ['technical_skills', 'qualification', 'weak_cv', 'confidence', 'uk_exp', 'limited_opportunities', 'leadership_exp'],
  change_company: ['weak_cv', 'uk_exp', 'confidence', 'qualification', 'technical_skills', 'limited_opportunities', 'leadership_exp'],
  work_life_balance: ['limited_opportunities', 'confidence', 'weak_cv', 'qualification', 'technical_skills', 'uk_exp', 'leadership_exp'],
}

const BLOCKER_TO_DEVELOPMENT: Record<string, string> = {
  qualification: 'Formal qualifications or accredited training for the next level',
  uk_exp: 'UK-specific experience evidence and local references',
  technical_skills: 'Deeper technical depth for the next role level',
  leadership_exp: 'Evidence of leading people, projects, or workstreams',
  confidence: 'Interview presence and self-advocacy in promotion conversations',
  limited_opportunities: 'Internal visibility or external options if growth is blocked',
  weak_cv: 'CV and LinkedIn aligned to your next-level target',
  not_sure: 'Structured plan with measurable milestones',
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ')
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function normalizeGrowFieldSlug(state: CareerBrainState): GrowCareerFieldSlug {
  const slug = resolveGrowCareerFieldSlug(state)
  if (slug in FIELD_TO_DOMAIN) return slug as GrowCareerFieldSlug
  return 'other'
}

export function normalizeGrowLevelSlug(state: CareerBrainState): GrowCareerLevelSlug {
  const level = String(answers(state).cb_grow_level ?? 'mid')
  if (LEVEL_ORDER.includes(level as GrowCareerLevelSlug)) return level as GrowCareerLevelSlug
  return 'mid'
}

export function domainForGrowField(field: GrowCareerFieldSlug): CareerDomain {
  return FIELD_TO_DOMAIN[field]
}

export function extractRoleCore(jobTitle: string): string {
  let core = normalizeTitle(jobTitle)
  for (const prefix of PREFIXES) {
    const re = new RegExp(`^${prefix}\\s+`, 'i')
    if (re.test(core)) {
      core = core.replace(re, '').trim()
      break
    }
  }
  core = core.replace(/\s+(assistant|trainee|graduate)$/i, '').trim()
  return core || normalizeTitle(jobTitle)
}

function levelIndex(level: GrowCareerLevelSlug): number {
  return Math.max(0, LEVEL_ORDER.indexOf(level))
}

function clampLevel(index: number): GrowCareerLevelSlug {
  return LEVEL_ORDER[Math.min(Math.max(index, 0), LEVEL_ORDER.length - 1)]!
}

function titleAlreadyHasLevel(title: string, level: GrowCareerLevelSlug): boolean {
  const t = title.toLowerCase()
  if (level === 'junior' && /\bjunior\b/.test(t)) return true
  if (level === 'senior' && /\bsenior\b/.test(t)) return true
  if (level === 'entry' && /\b(entry|trainee|graduate)\b/.test(t)) return true
  if (level === 'team_leader' && /\b(lead|team leader)\b/.test(t)) return true
  if (level === 'manager' && /\b(manager|head of|director)\b/.test(t)) return true
  if (level === 'mid' && !/\b(junior|senior|lead|manager|director|head of)\b/.test(t)) return true
  return false
}

export function formatTitleForLevel(level: GrowCareerLevelSlug, core: string, goal: string): string {
  const c = titleCase(core)
  switch (level) {
    case 'entry':
      return c
    case 'junior':
      return `Junior ${c}`
    case 'mid':
      return c
    case 'senior':
      return `Senior ${c}`
    case 'team_leader':
      if (/engineer|developer|designer|analyst|architect|producer/i.test(c)) {
        return `Lead ${c}`
      }
      return `${c} Team Leader`
    case 'manager':
      return resolveLeadershipDestination(core, goal)
    default:
      return c
  }
}

export function resolveLeadershipDestination(core: string, goal: string): string {
  const c = core.toLowerCase()
  if (/motion|graphic|designer|creative|content|video|animator|producer/i.test(c)) {
    return 'Creative Director'
  }
  if (/mechanical|electrical|civil|design engineer|engineer/i.test(c)) {
    return 'Engineering Manager'
  }
  if (/software|developer|it support|helpdesk|systems|network/i.test(c)) {
    return goal === 'leadership' ? 'Engineering Manager' : 'IT Service Manager'
  }
  if (/nurse|healthcare|care|clinical|midwife/i.test(c)) {
    return 'Clinical Team Leader'
  }
  if (/teacher|teaching|education|tutor/i.test(c)) {
    return 'Education Coordinator'
  }
  if (/account|finance|payroll|bookkeep/i.test(c)) {
    return 'Finance Manager'
  }
  if (/market|brand|digital|social/i.test(c)) {
    return 'Marketing Director'
  }
  if (/admin|administrator|office|coordinator/i.test(c)) {
    return 'Operations Manager'
  }
  if (/customer service|advisor|support agent/i.test(c)) {
    return 'Customer Service Manager'
  }
  return `${titleCase(core)} Manager`
}

function resolveSpecialistDestination(core: string): string {
  const c = core.toLowerCase()
  if (/designer|creative|motion|graphic|video|animator/i.test(c)) {
    return `Senior ${titleCase(core)}`
  }
  if (/engineer/i.test(c)) {
    return `Principal ${titleCase(core)}`
  }
  if (/developer|analyst|architect/i.test(c)) {
    return `Senior ${titleCase(core)}`
  }
  return `Senior ${titleCase(core)}`
}

function resolveNextLevel(
  current: GrowCareerLevelSlug,
  goal: string,
  leadershipReady: string
): GrowCareerLevelSlug {
  const goalKey = String(goal)
  let next = clampLevel(levelIndex(current) + 1)

  if (goalKey === 'leadership' && leadershipReady !== 'no') {
    next = clampLevel(Math.max(levelIndex(next), levelIndex('team_leader')))
  }

  if (goalKey === 'specialist' && levelIndex(current) >= levelIndex('mid')) {
    next = clampLevel(Math.max(levelIndex(current), levelIndex('senior')))
  }

  if (current === 'manager') {
    next = 'manager'
  }

  return next
}

function resolveLongTermLevel(
  current: GrowCareerLevelSlug,
  next: GrowCareerLevelSlug,
  goal: string,
  leadershipReady: string
): GrowCareerLevelSlug {
  const goalKey = String(goal)

  if (goalKey === 'leadership' && leadershipReady !== 'no') {
    return clampLevel(Math.max(levelIndex(next) + 1, levelIndex('manager')))
  }

  if (goalKey === 'specialist') {
    return clampLevel(Math.max(levelIndex(next), levelIndex('senior')))
  }

  if (goalKey === 'work_life_balance') {
    return clampLevel(levelIndex(next))
  }

  return clampLevel(levelIndex(next) + 1)
}

export function inferDynamicProgression(state: CareerBrainState): DynamicProgression {
  const professionLadder = inferProfessionProgression(state)
  if (professionLadder) return professionLadder

  const jobTitle = resolveGrowCareerCurrentJobTitle(state)
  const currentLevel = normalizeGrowLevelSlug(state)
  const goal = String(answers(state).cb_grow_goal ?? 'promotion')
  const leadershipReady = String(answers(state).cb_grow_leadership_ready ?? 'not_sure')
  const core = extractRoleCore(jobTitle)

  const workNowTitle = titleAlreadyHasLevel(jobTitle, currentLevel)
    ? normalizeTitle(jobTitle)
    : formatTitleForLevel(currentLevel, core, goal)

  const nextLevel = resolveNextLevel(currentLevel, goal, leadershipReady)
  const buildNextTitle = formatTitleForLevel(nextLevel, core, goal)

  let longTermLevel = resolveLongTermLevel(currentLevel, nextLevel, goal, leadershipReady)
  let longTermTitle =
    goal === 'specialist' && longTermLevel === 'senior'
      ? resolveSpecialistDestination(core)
      : formatTitleForLevel(longTermLevel, core, goal)

  if (longTermTitle.toLowerCase() === buildNextTitle.toLowerCase()) {
    longTermLevel = clampLevel(levelIndex(longTermLevel) + 1)
    longTermTitle =
      goal === 'specialist'
        ? resolveSpecialistDestination(core)
        : formatTitleForLevel(longTermLevel, core, goal)
  }

  const devTime = String(answers(state).cb_grow_dev_time ?? '3_12_months')
  const nextStepTimeline =
    devTime === 'under_3_months'
      ? '3–9 months'
      : devTime === '3_12_months'
        ? '6–18 months'
        : devTime === '1_2_years'
          ? '12–24 months'
          : '18–36 months'

  const longTermTimeline =
    devTime === 'under_3_months' ? '2–4 years' : devTime === '3_12_months' ? '3–5 years' : '4–7 years'

  const field = resolveGrowCareerField(state)
  const mainBarrier = identifyMainBarrier(state)
  const nextStepReason = [
    `${buildNextTitle} is the natural next step from ${workNowTitle} in ${field}.`,
    `Your goal is ${labelGrowCareerGoal(state)} — this progression stays inside your current profession.`,
    `Address ${mainBarrier.toLowerCase()} while building evidence employers expect at the next level.`,
  ].join(' ')

  return {
    workNowTitle,
    buildNextTitle,
    longTermTitle,
    nextStepReason,
    nextStepTimeline,
    longTermTimeline,
  }
}

export function growthScoreLabel(score: number): GrowCareerScoreLabel {
  if (score >= 75) return 'Promotion Ready'
  if (score >= 60) return 'Strong Growth Potential'
  if (score >= 40) return 'Growing Profile'
  return 'Building Readiness'
}

export function identifyMainBarrier(state: CareerBrainState): MainBarrierLabel {
  const blockers = getGrowCareerBlockers(state)
  if (!blockers.length) return 'Unclear blocker'
  const goal = String(answers(state).cb_grow_goal ?? '')
  const priority = BLOCKER_PRIORITY_BY_GOAL[goal] ?? Object.keys(BLOCKER_TO_BARRIER)
  for (const key of priority) {
    if (blockers.includes(key)) return BLOCKER_TO_BARRIER[key] ?? 'Unclear blocker'
  }
  return BLOCKER_TO_BARRIER[blockers[0]!] ?? 'Unclear blocker'
}

export function buildSkillsGap(state: CareerBrainState): {
  strengths: string[]
  needsDevelopment: string[]
} {
  const selected = getGrowCareerCoreSkills(state)
  const strengths = selected.length ? selected : inferStrengthsFromTitle(resolveGrowCareerCurrentJobTitle(state))

  const needs = getGrowCareerBlockers(state)
    .filter((b) => b !== 'not_sure')
    .map((b) => BLOCKER_TO_DEVELOPMENT[b] ?? b.replace(/_/g, ' '))

  const goal = String(answers(state).cb_grow_goal ?? '')
  if (goal === 'leadership' && !selected.includes('Leadership')) {
    needs.push('People leadership and stakeholder management')
  }
  if (goal === 'specialist' && !selected.includes('Technical Skills')) {
    needs.push('Advanced specialist depth in your core craft')
  }

  const uniqueNeeds = [...new Set(needs)]
  while (uniqueNeeds.length < 2 && strengths.length) {
    uniqueNeeds.push('Document measurable outcomes for your next promotion case')
    break
  }

  return {
    strengths: strengths.slice(0, 4),
    needsDevelopment: uniqueNeeds.slice(0, 4),
  }
}

function inferStrengthsFromTitle(jobTitle: string): string[] {
  const t = jobTitle.toLowerCase()
  const out: string[] = []
  if (/design|creative|motion|graphic|video|content|media/i.test(t)) {
    out.push('Design', 'Problem Solving')
  }
  if (/engineer|developer|software|it|technical|systems|network|analyst/i.test(t)) {
    out.push('Technical Skills', 'Problem Solving')
  }
  if (/nurse|care|health|clinical|support/i.test(t)) {
    out.push('Customer Service', 'Communication')
  }
  if (/admin|coordinator|office|operations|logistics|warehouse/i.test(t)) {
    out.push('Operations', 'Communication')
  }
  if (/market|brand|sales|account/i.test(t)) {
    out.push('Marketing', 'Communication')
  }
  if (!out.length) out.push('Communication', 'Problem Solving', 'Operations')
  return [...new Set(out)].slice(0, 4)
}

export function computeCareerGrowthScore(state: CareerBrainState): number {
  const level = normalizeGrowLevelSlug(state)
  const levelBase: Record<GrowCareerLevelSlug, number> = {
    entry: 38,
    junior: 46,
    mid: 56,
    senior: 66,
    team_leader: 72,
    manager: 78,
  }
  const yearsBand = String(answers(state).cb_grow_years ?? '')
  const yearsBonus: Record<string, number> = {
    '0_1': 0,
    '1_3': 6,
    '3_5': 11,
    '5_10': 15,
    '10_plus': 18,
    '1_2': 5,
    '6_10': 13,
  }

  let score = levelBase[level] + (yearsBonus[yearsBand] ?? 6)
  if (isGrowCareerStudyWilling(state)) score += 8
  else score -= 5

  const leadership = String(answers(state).cb_grow_leadership_ready ?? '')
  if (leadership === 'yes') score += 10
  else if (leadership === 'not_sure') score += 3
  else score -= 8

  const employer = String(answers(state).cb_grow_employer_change ?? '')
  if (employer === 'yes') score += 5
  else if (employer === 'maybe') score += 3
  else if (employer === 'no') score -= 4

  if (getGrowCareerCoreSkills(state).length >= 3) score += 4

  const blockers = getGrowCareerBlockers(state).filter((b) => b !== 'not_sure')
  score -= Math.min(blockers.length * 4, 24)

  return Math.max(28, Math.min(92, Math.round(score)))
}

export function buildCurrentPositionSummary(state: CareerBrainState): string {
  const rolePhrase = describeExperienceRoleLower(state)
  const years = labelGrowCareerExperienceYears(state)
  const score = computeCareerGrowthScore(state)
  const label = growthScoreLabel(score)
  const goal = labelGrowCareerGoal(state)
  return `You currently work as a ${rolePhrase} with ${years} of experience. Your goal is ${goal}, and your profile shows ${label.toLowerCase()} for your next step.`
}

export function buildGrowthSummary(state: CareerBrainState, progression: DynamicProgression): string {
  const field = resolveGrowCareerField(state)
  const goal = labelGrowCareerGoal(state)
  const score = computeCareerGrowthScore(state)
  const label = growthScoreLabel(score)
  const mainBarrier = identifyMainBarrier(state)
  return [
    `Career growth assessment for ${field}: ${progression.workNowTitle} → ${progression.buildNextTitle} → ${progression.longTermTitle}.`,
    `Goal: ${goal}. Growth score ${score}/100 (${label}).`,
    `Primary barrier: ${mainBarrier}. This plan stays in your current profession unless growth is genuinely blocked.`,
  ].join(' ')
}

export function buildImmediateActions(state: CareerBrainState, progression: DynamicProgression): string[] {
  const actions: string[] = []
  const jobTitle = resolveGrowCareerCurrentJobTitle(state).toLowerCase()
  const blockers = getGrowCareerBlockers(state)
  const study = isGrowCareerStudyWilling(state)
  const goal = String(answers(state).cb_grow_goal ?? '')

  if (blockers.includes('weak_cv') || blockers.includes('confidence')) {
    actions.push('Update CV and LinkedIn to reflect next-level responsibilities and measurable results')
  } else {
    actions.push('Update CV with quantified achievements from the last 12 months')
  }

  if (/design|motion|graphic|creative|video|animator|content|media/i.test(jobTitle)) {
    actions.push('Improve portfolio quality with 2–3 strong pieces aligned to your next role')
    if (study) actions.push('Complete advanced tool training (e.g. After Effects, Figma, or Adobe Certified Professional)')
    else actions.push('Lead a small creative project to demonstrate end-to-end delivery')
  } else if (/engineer|developer|software|technical|it|systems|network/i.test(jobTitle)) {
    if (study) actions.push('Complete a relevant certification or structured technical course for your next level')
    actions.push('Take ownership of a technical workstream and document outcomes for promotion evidence')
  } else if (/nurse|care|health|clinical|support|teacher|education/i.test(jobTitle)) {
    if (study) actions.push('Complete mandatory or role-relevant training for the next grade or band')
    actions.push('Expand responsibility on your current team with supervisor sign-off for your CV')
  } else {
    if (study) actions.push(`Complete training that directly supports ${progression.buildNextTitle}`)
    actions.push(`Prepare a promotion case showing impact ready for ${progression.buildNextTitle}`)
  }

  if (blockers.includes('leadership_exp') || goal === 'leadership') {
    actions.push('Volunteer to lead a small project or mentor a junior colleague')
  }
  if (blockers.includes('limited_opportunities') && String(answers(state).cb_grow_employer_change ?? '') !== 'no') {
    actions.push('Research external roles at your next level while tracking internal vacancies')
  }

  return [...new Set(actions)].slice(0, 3)
}

export function buildRecommendedJobAZActions(state: CareerBrainState): Array<{ action: string; label: string; href?: string }> {
  const actions = [
    { action: 'CREATE_CV', label: 'Improve CV', href: '/cv-builder-v2' },
    { action: 'LINKEDIN', label: 'Improve LinkedIn' },
    { action: 'CAREER_PATH', label: 'Explore Career Paths', href: '/build-your-path' },
    { action: 'INTERVIEW_COACH', label: 'Interview Practice' },
  ]

  if (String(answers(state).cb_grow_employer_change ?? '') !== 'no') {
    actions.push({ action: 'JOB_FINDER', label: 'Search next-level roles', href: '/job-finder' })
  }

  return actions.slice(0, 5)
}

export function suggestTrainingForRole(buildNextTitle: string, state: CareerBrainState): string[] {
  if (!isGrowCareerStudyWilling(state)) return []
  const t = buildNextTitle.toLowerCase()
  const items: string[] = []
  if (/motion|designer|creative|graphic|video|animator/i.test(t)) {
    items.push('Advanced After Effects / motion design course')
  }
  if (/engineer|engineering/i.test(t)) {
    items.push('AutoCAD / technical reporting training')
  }
  if (/developer|software|it|support|systems/i.test(t)) {
    items.push('Relevant vendor or CompTIA certification')
  }
  if (/manager|lead|director|coordinator/i.test(t)) {
    items.push('Leadership or ILM Level 3 (optional)')
  }
  return items.slice(0, 2)
}
