import { parseMultiSelectValue } from '@/lib/career-engine/shared/assessmentMultiSelect'
import {
  LONG_TERM_CATALOG,
  OPPORTUNITY_CATALOG,
  QUALIFICATION_CATALOG,
  SIDE_SKILL_OPTIONS,
} from './catalog'
import {
  orderedRouteCourseTypes,
  resolveExtraIncomeRoute,
  type CareerRouteLogic,
  type CourseTypeRec,
} from './routeIntelligence'
import type {
  ActionWeek,
  EarningsBoostQualification,
  EarningsEstimate,
  ExtraIncomePlanResult,
  FastestPathSummary,
  HiringDemand,
  ImmediateOpportunity,
  LongTermSideIncome,
  OpportunityDifficulty,
  StartTimeline,
} from './types'

const PROFILE_LABELS: Record<string, string> = {
  student: 'Student',
  employed_full: 'Employed full-time',
  employed_part: 'Employed part-time',
  self_employed: 'Self-employed',
  not_working: 'Not currently working',
}

const HOURS_LABELS: Record<string, string> = {
  under_10: 'Under 10 hours/week',
  '10_20': '10–20 hours/week',
  '20_plus': '20+ hours/week',
}

const SCHEDULE_LABELS: Record<string, string> = {
  evenings_weekends: 'Evenings & weekends',
  weekdays: 'Weekdays only',
  flexible: 'Fully flexible',
}

const GOAL_LABELS: Record<string, string> = {
  under_500: 'Under £500/month',
  '500_1000': '£500–£1,000/month',
  '1000_plus': '£1,000+/month',
}

const HOURS_WEEK: Record<string, number> = {
  under_10: 8,
  '10_20': 15,
  '20_plus': 25,
}

const GOAL_MID: Record<string, number> = {
  under_500: 400,
  '500_1000': 750,
  '1000_plus': 1200,
}

const SKILL_LABELS = Object.fromEntries(SIDE_SKILL_OPTIONS.map((o) => [o.value, o.label]))

function hoursPerWeek(answers: Record<string, string>): number {
  return HOURS_WEEK[answers.side_hours ?? '10_20'] ?? 15
}

function monthlyFromHourly(hourlyLow: number, hourlyHigh: number, hours: number): { low: number; high: number } {
  const weeks = 4.3
  return {
    low: Math.round(hourlyLow * hours * weeks),
    high: Math.round(hourlyHigh * hours * weeks),
  }
}

function formatMoneyRange(low: number, high: number): string {
  return `£${low.toLocaleString()}–£${high.toLocaleString()}/month`
}

function skillSet(answers: Record<string, string>): Set<string> {
  const skills = parseMultiSelectValue(answers.side_skills)
  if (skills.length === 0) return new Set(['general'])
  return new Set(skills)
}

function mapStartTimeline(speed: 'today' | 'this_week' | 'two_weeks' | 'after_course'): StartTimeline {
  switch (speed) {
    case 'today':
      return 'Can start today'
    case 'this_week':
      return 'Can start this week'
    case 'two_weeks':
      return 'Usually within 2 weeks'
    case 'after_course':
      return 'After completing a short course'
  }
}

function mapDifficulty(level: 'easy' | 'medium' | 'competitive'): OpportunityDifficulty {
  switch (level) {
    case 'easy':
      return 'Easy'
    case 'medium':
      return 'Medium'
    case 'competitive':
      return 'Competitive'
  }
}

function mapHiringDemand(level: 'very_high' | 'high' | 'medium'): HiringDemand {
  switch (level) {
    case 'very_high':
      return 'Very High Demand'
    case 'high':
      return 'High Demand'
    case 'medium':
      return 'Medium Demand'
  }
}

function buildMatchReasons(
  op: (typeof OPPORTUNITY_CATALOG)[number],
  answers: Record<string, string>,
  skills: Set<string>,
  score: number
): string[] {
  const reasons: string[] = []
  const hours = answers.side_hours ?? '10_20'
  const schedule = answers.side_schedule ?? 'flexible'
  const profile = answers.side_profile ?? ''
  const matchedSkills = op.skillTags.filter((t) => t !== 'general' && skills.has(t))

  if (hours === 'under_10') {
    reasons.push('Matches your limited weekly hours')
  } else if (hours === '20_plus') {
    reasons.push('Matches your available hours for stronger monthly earnings')
  } else {
    reasons.push('Matches your available hours')
  }

  if (schedule === 'evenings_weekends' && op.scheduleFit.includes('evenings_weekends')) {
    reasons.push('Evening/weekend shifts available')
  } else if (schedule === 'weekdays' && op.scheduleFit.includes('weekdays')) {
    reasons.push('Weekday shifts available')
  } else if (schedule === 'flexible' || op.scheduleFit.includes('flexible')) {
    reasons.push('Flexible shifts that fit your schedule')
  }

  if (op.noExperienceRequired) {
    reasons.push('No experience required')
  } else if (matchedSkills.length > 0) {
    reasons.push(
      `Uses your ${matchedSkills.map((s) => SKILL_LABELS[s] ?? s).slice(0, 2).join(' / ')} skills`
    )
  }

  if (op.demand === 'very_high') {
    reasons.push('High demand across the UK')
  } else if (op.demand === 'high') {
    reasons.push('Strong UK hiring demand')
  }

  if (profile === 'employed_full') {
    reasons.push('Suitable alongside your current job')
  } else if (profile === 'student') {
    reasons.push('Works well around study commitments')
  } else if (profile === 'employed_part') {
    reasons.push('Easy to stack with part-time work')
  } else if (profile === 'not_working') {
    reasons.push('Fast route to start earning income')
  }

  if (op.startSpeed === 'today' || op.startSpeed === 'this_week') {
    reasons.push('One of the fastest options to start')
  }

  if (score >= 60 && reasons.length < 3) {
    reasons.push('Strong overall fit for your profile')
  }

  // Deduplicate and keep 3–5
  const unique = [...new Set(reasons)]
  return unique.slice(0, 5)
}

function scoreOpportunity(
  skillTags: string[],
  scheduleFit: string[],
  profiles: string[] | undefined,
  answers: Record<string, string>,
  skills: Set<string>
): number {
  let score = 20

  const openToAnything = skills.has('general')
  const matchedSkills = skillTags.filter((t) => t !== 'general' && skills.has(t))

  if (matchedSkills.length > 0) {
    score += matchedSkills.length * 18
  } else if (openToAnything || skillTags.includes('general')) {
    score += 12
  } else {
    score -= 8
  }

  const schedule = answers.side_schedule ?? 'flexible'
  if (scheduleFit.includes(schedule)) {
    score += 16
  } else if (scheduleFit.includes('flexible') || schedule === 'flexible') {
    score += 8
  } else {
    score -= 12
  }

  const profile = answers.side_profile ?? ''
  if (profiles?.length && !profiles.includes(profile)) {
    score -= 10
  } else if (profile === 'employed_full' && schedule === 'evenings_weekends') {
    score += 6
  } else if (profile === 'student') {
    score += 4
  }

  const location = (answers.preferred_location ?? '').toLowerCase()
  if (location.includes('london')) {
    score += 3
  }

  const goal = answers.side_income_goal ?? '500_1000'
  if (goal === '1000_plus') {
    score += skillTags.some((t) => ['driving', 'teaching', 'tech', 'security'].includes(t)) ? 6 : 0
  }

  return Math.max(0, Math.min(100, score))
}

function isDeliveryOrDrivingTitle(id: string, title: string): boolean {
  return /delivery|driver|amazon\s*flex|uber|taxi|phv|courier/i.test(`${id} ${title}`)
}

function routeAllowsDeliveryDriver(route: CareerRouteLogic, skills: Set<string>): boolean {
  if (route.route_id === 'driving' || route.route_id === 'general') return true
  if (skills.has('driving')) return true
  // General-only selection (open to anything) — not when a focused route like teaching won
  if (skills.has('general') && skills.size === 1) return true
  if (route.route_id === 'teaching' || route.route_id === 'languages') return false
  return skills.has('general')
}

function buildImmediateOpportunities(
  answers: Record<string, string>,
  route: CareerRouteLogic
): ImmediateOpportunity[] {
  const skills = skillSet(answers)
  const hours = hoursPerWeek(answers)
  const location = answers.preferred_location ?? 'UK-wide'
  const preferredIds = new Set(route.work_now_opportunity_ids)
  const preferredTitles = route.work_now_roles.map((t) => t.toLowerCase())
  const allowDelivery = routeAllowsDeliveryDriver(route, skills)

  const ranked = OPPORTUNITY_CATALOG.map((op) => {
    let score = scoreOpportunity(op.skillTags, op.scheduleFit, op.profiles, answers, skills)

    // Route-first boost: preferred work-now roles win over affiliate-irrelevant catalog noise
    if (preferredIds.has(op.id)) score += 40
    if (preferredTitles.some((t) => op.title.toLowerCase().includes(t) || t.includes(op.title.toLowerCase()))) {
      score += 25
    }

    // Suppress security steward jobs on non-security routes
    if (!route.allow_sia && /matchday|steward|door\s*supervisor|security/i.test(`${op.id} ${op.title}`)) {
      score -= 50
    }

    // Teaching/tutoring: never surface Delivery Driver unless driving/general-only allowed
    if (!allowDelivery && isDeliveryOrDrivingTitle(op.id, op.title)) {
      score -= 100
    }

    const matchReasons = buildMatchReasons(op, answers, skills, score)
    let hourlyLow = op.hourlyLow
    let hourlyHigh = op.hourlyHigh
    if (op.londonBoost && location.toLowerCase().includes('london')) {
      hourlyLow += 1
      hourlyHigh += 2
    }
    const monthly = monthlyFromHourly(hourlyLow, hourlyHigh, hours)
    return {
      id: op.id,
      title: op.title,
      whyMatch: matchReasons.join('. ') + (matchReasons.length ? '.' : ''),
      matchReasons,
      startTimeline: mapStartTimeline(op.startSpeed),
      difficulty: mapDifficulty(op.entryDifficulty),
      hiringDemand: mapHiringDemand(op.demand),
      entryRequirements: op.entryRequirements,
      flexibility: op.flexibility,
      hourlyPay:
        op.londonBoost && location.toLowerCase().includes('london')
          ? `£${hourlyLow}–£${hourlyHigh}/hr (London rates)`
          : op.hourlyPay,
      monthlyEstimate: formatMoneyRange(monthly.low, monthly.high),
      matchScore: score,
      skillTags: op.skillTags,
      scheduleFit: op.scheduleFit,
      officialUrl: null,
      affiliateUrl: null,
      estimatedCommission: null,
      partnerBadge: false,
      recommendedBadge: score >= 55,
    } satisfies ImmediateOpportunity
  })

  const sorted = ranked.sort((a, b) => b.matchScore - a.matchScore)
  const preferred = sorted.filter(
    (o) =>
      preferredIds.has(o.id) ||
      preferredTitles.some(
        (t) => o.title.toLowerCase().includes(t) || t.includes(o.title.toLowerCase())
      )
  )
  const rest = sorted.filter((o) => !preferred.some((p) => p.id === o.id))
  const merged = [...preferred, ...rest].filter((o) => {
    if (!allowDelivery && isDeliveryOrDrivingTitle(o.id, o.title)) return false
    return o.matchScore > 0
  })

  return merged.slice(0, 8)
}

function qualFromCourseType(
  course: CourseTypeRec,
  opts: { recommendedBadge: boolean; whyOverride?: string }
): EarningsBoostQualification {
  const catalog = QUALIFICATION_CATALOG.find((q) => q.id === course.id)
  if (catalog) {
    return {
      id: catalog.id,
      title: catalog.title,
      whyHelps: opts.whyOverride || course.why,
      cost: catalog.cost,
      studyTime: catalog.studyTime,
      averageIncrease: catalog.averageIncrease,
      skillTags: catalog.skillTags,
      recommendedBadge: opts.recommendedBadge,
      officialUrl: catalog.officialUrl ?? null,
      affiliateUrl: catalog.affiliateUrl ?? null,
      estimatedCommission: catalog.estimatedCommission ?? null,
      partnerBadge: catalog.partnerBadge ?? false,
    }
  }

  // Course-type recommendation with no catalog provider yet
  return {
    id: course.id,
    title: course.title,
    whyHelps: opts.whyOverride || course.why,
    cost: 'Varies',
    studyTime: 'Short UK course',
    averageIncrease: 'Supports progression on this route',
    skillTags: [],
    recommendedBadge: opts.recommendedBadge,
    officialUrl: null,
    affiliateUrl: null,
    estimatedCommission: null,
    partnerBadge: false,
  }
}

/**
 * Route-first qualifications: primary upgrades first, then optional add-ons.
 * Never promotes SIA/First Aid as primary unless the route allows it.
 */
function buildQualificationsFromRoute(route: CareerRouteLogic): EarningsBoostQualification[] {
  const { primary, optional } = orderedRouteCourseTypes(route)
  const primaryQuals = primary.map((c) =>
    qualFromCourseType(c, { recommendedBadge: true, whyOverride: c.why })
  )
  const optionalQuals = optional
    .filter((c) => !primaryQuals.some((p) => p.id === c.id))
    .slice(0, 4)
    .map((c) => qualFromCourseType(c, { recommendedBadge: false, whyOverride: c.why }))

  return [...primaryQuals, ...optionalQuals].slice(0, 5)
}

function buildFastestPath(
  answers: Record<string, string>,
  opportunities: ImmediateOpportunity[],
  qualifications: EarningsBoostQualification[],
  earnings: EarningsEstimate
): FastestPathSummary {
  const top = opportunities[0]
  const topQual = qualifications[0]
  const goalLabel = GOAL_LABELS[answers.side_income_goal ?? ''] ?? 'your income goal'

  const startLine = top
    ? top.startTimeline === 'Can start today'
      ? `Start as a ${top.title} today.`
      : top.startTimeline === 'Can start this week'
        ? `Start as a ${top.title} this week.`
        : top.startTimeline === 'Usually within 2 weeks'
          ? `Apply for ${top.title} roles this week — usually hired within 2 weeks.`
          : `Prepare for ${top.title}, then start after a short course.`
    : 'Apply for your best-matched side job this week.'

  const qualLine = topQual
    ? `Complete the ${topQual.title} next (${topQual.studyTime}).`
    : 'Add one short UK qualification to raise your hourly rate.'

  const targetLow = earnings.afterQualification.low
  const targetHigh = earnings.afterQualification.high
  const earningsLine = `Target ${formatMoneyRange(targetLow, targetHigh).replace('/month', '')} extra per month within 8 weeks.`

  const demandLine =
    top?.hiringDemand === 'Very High Demand'
      ? 'Prioritise this path — hiring demand is very high in the UK.'
      : `Aim for ${goalLabel} by stacking consistent weekly hours.`

  return {
    lines: [startLine, qualLine, earningsLine, demandLine].slice(0, 4),
    topOpportunityTitle: top?.title ?? 'Side income role',
    topQualificationTitle: topQual?.title,
    targetEarningsLabel: formatMoneyRange(targetLow, targetHigh),
  }
}

function buildLongTermStreams(answers: Record<string, string>): LongTermSideIncome[] {
  const skills = skillSet(answers)
  const hours = answers.side_hours ?? '10_20'

  const ranked = LONG_TERM_CATALOG.map((stream) => {
    let score = 10
    const matched = stream.skillTags.filter((t) => skills.has(t))
    score += matched.length * 18
    if (skills.has('general') && stream.difficulty === 'Easy') score += 10
    if (hours === 'under_10' && stream.difficulty === 'Hard') score -= 8

    const whyFit =
      matched.length > 0
        ? `Builds on your ${matched.map((s) => SKILL_LABELS[s] ?? s).join(', ')} skills into a scalable side income.`
        : 'A realistic UK side income stream you can grow alongside paid work.'

    return {
      ...stream,
      whyFit,
      recommendedBadge: score >= 35,
      _score: score,
    }
  })

  return ranked
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)
    .map(({ _score: _, ...rest }) => rest)
}

function buildEarnings(
  answers: Record<string, string>,
  opportunities: ImmediateOpportunity[],
  qualifications: EarningsBoostQualification[]
): EarningsEstimate {
  const hours = hoursPerWeek(answers)
  const top = opportunities[0]
  const topDef = OPPORTUNITY_CATALOG.find((o) => o.id === top?.id)
  const hourlyLow = topDef?.hourlyLow ?? 11
  const hourlyHigh = topDef?.hourlyHigh ?? 14

  const immediate = monthlyFromHourly(hourlyLow, hourlyHigh, hours)

  const qual = QUALIFICATION_CATALOG.find((q) => q.id === qualifications[0]?.id)
  const boostLow = qual?.hourlyBoostLow ?? 1
  const boostHigh = qual?.hourlyBoostHigh ?? 2
  const afterQual = monthlyFromHourly(hourlyLow + boostLow, hourlyHigh + boostHigh, hours)

  // After 12 months: mix of higher rate + slightly more efficient hours
  const after12 = monthlyFromHourly(hourlyLow + boostLow + 2, hourlyHigh + boostHigh + 4, Math.min(hours + 2, 30))

  const goal = answers.side_income_goal ?? '500_1000'
  const goalMid = GOAL_MID[goal] ?? 750

  return {
    immediate: {
      low: immediate.low,
      high: immediate.high,
      label: formatMoneyRange(immediate.low, immediate.high),
    },
    afterQualification: {
      low: afterQual.low,
      high: afterQual.high,
      label: formatMoneyRange(afterQual.low, afterQual.high),
    },
    after12Months: {
      low: after12.low,
      high: after12.high,
      label: formatMoneyRange(after12.low, after12.high),
    },
    hoursPerWeek: hours,
    incomeGoalLabel: GOAL_LABELS[goal] ?? goal,
    goalMetImmediate: immediate.high >= goalMid * 0.8,
    goalMetAfterQual: afterQual.high >= goalMid * 0.9,
  }
}

function buildActionPlan(
  answers: Record<string, string>,
  opportunities: ImmediateOpportunity[],
  qualifications: EarningsBoostQualification[]
): ActionWeek[] {
  const topJobs = opportunities.slice(0, 2).map((o) => o.title)
  const topQual = qualifications[0]

  return [
    {
      week: 1,
      title: 'Week 1 — Get hireable fast',
      actions: [
        'Build or update a UK-format CV focused on reliability and availability',
        `Apply for 15–20 roles: ${topJobs.join(', ') || 'entry-level side jobs'}`,
        'Set up alerts on Indeed, Reed, and local Facebook job groups',
      ],
    },
    {
      week: 2,
      title: 'Week 2 — Unlock higher pay',
      actions: topQual
        ? [
            `Start ${topQual.title} (${topQual.studyTime}, ${topQual.cost})`,
            'Complete any free online modules you can finish this week',
            'Add “in progress” certifications to your CV',
          ]
        : [
            'Complete a short free UK course relevant to your top opportunity',
            'Gather references or proof of reliability',
            'Apply to 10 more flexible roles',
          ],
    },
    {
      week: 3,
      title: 'Week 3 — Activate platforms',
      actions: [
        opportunities.some((o) => /amazon|uber|deliveroo|flex/i.test(o.title))
          ? 'Register with Amazon Flex / delivery platforms if eligible'
          : `Follow up on applications for ${topJobs[0] ?? 'your top opportunity'}`,
        'Prepare documents: ID, NI number, right-to-work proof, bank details',
        'Book interviews or onboarding sessions around your schedule',
      ],
    },
    {
      week: 4,
      title: 'Week 4 — Start earning',
      actions: [
        `Prioritise shifts for ${topJobs[0] ?? 'your best-matched role'}`,
        opportunities[1]
          ? `Keep a backup pipeline for ${opportunities[1].title}`
          : 'Keep applying to 5 roles per week as backup',
        answers.side_income_goal === '1000_plus'
          ? 'Stack a second evening/weekend role if hours allow'
          : 'Track weekly earnings vs your monthly goal',
      ],
    },
  ]
}

function isSecurityStewardRoute(top: ImmediateOpportunity, answers: Record<string, string>): boolean {
  const blob = `${top.id} ${top.title} ${answers.side_skills ?? ''}`.toLowerCase()
  return /matchday|steward|security|event\s*security|sia|door\s*supervisor/.test(blob)
}

/** Single clear earnings estimate — never stack calculated monthly + goal ranges. */
function buildSupportiveMessage(
  top: ImmediateOpportunity,
  hoursLabel: string,
  goalLabel: string,
  answers: Record<string, string>,
  route: CareerRouteLogic
): string {
  if (route.allow_sia && (isSecurityStewardRoute(top, answers) || /matchday|steward/i.test(top.title))) {
    return `With ${hoursLabel}, Matchday Steward work could help you earn around ${goalLabel === 'your income goal' ? '£500–£1,000/month' : goalLabel} depending on hours and shifts. You can start with event/security steward roles now, then use SIA Door Supervisor training to unlock better-paid security roles. Training is Online or UK-wide where available — search jobs by location when you are ready.`
  }

  const primary = route.primary_next_upgrades[0]?.title
  return `With ${hoursLabel}, ${top.title} work could help you earn around ${goalLabel} depending on hours and shifts. Start with roles you can apply for now${primary ? `, then train with ${primary}` : ''} to unlock better-paid UK-wide options.`
}

export function buildExtraIncomeResult(answers: Record<string, string>): ExtraIncomePlanResult {
  const skills = parseMultiSelectValue(answers.side_skills)
  const skillsLabels = skills.map((s) => SKILL_LABELS[s] ?? s.replace(/_/g, ' '))
  const location = answers.preferred_location?.trim() || 'UK-wide'
  const route = resolveExtraIncomeRoute(skillSet(answers))

  const immediateOpportunities = buildImmediateOpportunities(answers, route)
  const qualifications = buildQualificationsFromRoute(route)
  const longTermStreams = buildLongTermStreams(answers)
  const earnings = buildEarnings(answers, immediateOpportunities, qualifications)
  const actionPlan = buildActionPlan(answers, immediateOpportunities, qualifications)
  const fastestPath = buildFastestPath(answers, immediateOpportunities, qualifications, earnings)

  const top = immediateOpportunities[0]
  const goalLabel = GOAL_LABELS[answers.side_income_goal ?? ''] ?? 'your income goal'
  const hoursLabel = HOURS_LABELS[answers.side_hours ?? ''] ?? 'your available hours'
  const supportiveMessage = top
    ? buildSupportiveMessage(top, hoursLabel, goalLabel, answers, route)
    : 'Here is a practical UK side-income plan based on your availability and skills.'

  // Signal missing providers: course types with no affiliate URL in catalog
  const missing_provider_course_types = qualifications
    .filter((q) => !q.affiliateUrl)
    .map((q) => q.title)

  return {
    pathId: 'side_job',
    phase: 'roadmap',
    profileLabel: PROFILE_LABELS[answers.side_profile ?? ''] ?? 'Your profile',
    hoursLabel: HOURS_LABELS[answers.side_hours ?? ''] ?? 'Flexible hours',
    scheduleLabel: SCHEDULE_LABELS[answers.side_schedule ?? ''] ?? 'Flexible schedule',
    incomeGoalLabel: goalLabel,
    skillsLabels: skillsLabels.length ? skillsLabels : ['General / Open to anything'],
    location,
    supportiveMessage,
    fastestPath,
    immediateOpportunities,
    qualifications,
    longTermStreams,
    earnings,
    actionPlan,
    answers,
    routeLogic: {
      route_id: route.route_id,
      route_title: route.route_title,
      user_goal: route.user_goal,
      after_training_roles: route.after_training_roles,
      cv_focus: route.cv_focus,
      allow_sia: route.allow_sia,
      missing_provider_course_types,
    },
  }
}
