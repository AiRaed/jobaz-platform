/**
 * Shared Career Coach → My Plan contract.
 * Assistant previews this; My Plan executes it. Coach reasoning stays on full engine results.
 */

import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import type { ExtraIncomePlanResult } from '@/lib/career-engine/extra-income/types'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import type {
  StartNewCareerPlanResult,
} from '@/lib/career-engine/start-new-career/types'
import type { CareerActionPlan } from '@/lib/career-journey/actionPlanTypes'
import { computeCareerReadiness } from './readiness'
import type { PathPlanLadder, PathPlanStep } from './pathPlanLadder'
import type { PlanActivitySignals } from './types'
import {
  allowExtraIncomeQualTitle,
  collectSkillHints,
  isSecurityRoute,
  isSiaDoorTitle,
  splitSecurityAddOns,
  titlesMatchLoose,
} from './myPlanDisplayFilter'
import { resolveRouteCourseFallbacks } from './routeCourseFallbacks'
import { filterExtraIncomeCourseTitles } from '@/lib/jaz-career-engine/extraIncomeSafetyBridge'

export type JobAZTrainingType = 'published_course' | 'recommendation_only' | 'course_type'

export type JobAZWorkNowRole = {
  title: string
  why_it_matches: string
  estimated_pay_range: string
  action_label: 'View jobs'
  href: string
}

export type JobAZTrainingItem = {
  title: string
  type: JobAZTrainingType
  why_recommended: string
  provider_name?: string
  apply_url?: string
  official_url?: string
  action_label: 'Apply Now' | 'Search / Add to roadmap' | 'View recommendation'
  id?: string
  published_course_id?: string
  slug?: string
  badge?: string
  /** True when route recommends this course type but no affiliate provider is published yet */
  no_published_provider?: boolean
}

export type JobAZOptionalTraining = {
  title: string
  why_useful: string
  type: JobAZTrainingType
  id?: string
}

export type JobAZPlan = {
  version: 1
  source_path_id: string
  route_summary: {
    route_title: string
    one_sentence_summary: string
    current_target_role: string
    next_upgrade_role: string
    readiness_score: number
    /** Match % when discovery/scoring provides it */
    match_score?: number
  }
  work_now: JobAZWorkNowRole[]
  training_next: JobAZTrainingItem | null
  optional_training: JobAZOptionalTraining[]
  /** Roles unlocked after primary training — used by My Plan After Training */
  after_training: Array<{ title: string; href: string }>
  cv_action: string
  /** Role to tailor the CV for — used by Open CV Builder CTA */
  cv_target_role?: string
  this_week_plan: string[]
  dashboard_handoff: {
    save_label: string
    open_dashboard_label: string
    continue_guest_label: string
  }
  /** Structured course cards from resolver — preserve for Apply Now resolution */
  structured_cards: RecommendationCourseCardData[]
}

export type CareerCoachPersistableResult =
  | ExtraIncomePlanResult
  | CareerEnginePlanResult
  | StartNewCareerPlanResult

const QUALIFICATION_UPGRADE_ROLES: Record<string, string[]> = {
  sia_door: ['Door Supervisor', 'Security Guard', 'Event Security'],
  cctv: ['CCTV Operator', 'Control Room Operator'],
  cscs: ['Construction Labourer', 'Site Operative'],
  forklift: ['Forklift Operator', 'Warehouse Operative'],
  food_hygiene: ['Kitchen Assistant', 'Catering Assistant'],
  first_aid: [],
  customer_service: ['Customer Service Assistant', 'Sales Assistant', 'Retail Supervisor'],
  ms_office: ['Digital Assistant', 'Admin Assistant', 'Office Administrator'],
  digital_skills: ['IT Support Trainee', 'Digital Assistant', 'Junior Admin'],
  english_for_work: ['Bilingual Customer Support', 'Online Tutor', 'Translation Support'],
  care_certificate: ['Care Assistant', 'Support Worker'],
  safeguarding: ['Care Assistant', 'Support Worker'],
  tefl: ['Online English Tutor', 'Language Tutor', 'Teaching Assistant'],
  teaching_assistant: ['Teaching Assistant', 'Study Support Assistant'],
  safeguarding_children: ['Teaching Assistant', 'Study Support Assistant', 'Online Tutor'],
  manual_handling: ['Warehouse Operative', 'Care Assistant'],
  taxi_phv: ['Private Hire Driver', 'Delivery Driver'],
  personal_licence: ['Bar Staff', 'Front of House'],
}

/** Primary = first recommended route upgrade — never SIA/First Aid unless route allows. */
function pickPrimaryExtraIncomeQual<T extends { id: string; title: string; recommendedBadge?: boolean }>(
  filteredQuals: T[],
  allowSia: boolean
): T | undefined {
  if (filteredQuals.length === 0) return undefined
  const primary = filteredQuals.find((q) => q.recommendedBadge) ?? filteredQuals[0]
  if (!primary) return undefined
  if (isSiaDoorTitle(primary.title) && !allowSia) {
    return filteredQuals.find((q) => !isSiaDoorTitle(q.title)) ?? undefined
  }
  if (/first\s*aid/i.test(primary.title) && !allowSia) {
    // First Aid never primary on non-care/security-first-aid routes unless it was the only recommended badge
    const better = filteredQuals.find(
      (q) => q.recommendedBadge && !/first\s*aid/i.test(q.title) && !isSiaDoorTitle(q.title)
    )
    if (better) return better
  }
  return primary
}

function pickExtraIncomeInterest(skillsLabels: string[]): string {
  const priority =
    /security|retail|languages|tech|it\b|care|warehouse|hospitality|driving|admin|teaching|customer\s*service|sales/i
  return (
    skillsLabels.find((s) => priority.test(s)) ??
    skillsLabels[0] ??
    'Side'
  )
}

function jobFinderHref(title: string): string {
  // Prefer steward-specific search terms for event/security work-now roles
  if (/matchday\s*steward/i.test(title)) {
    return `/job-finder?query=${encodeURIComponent('Matchday Steward')}`
  }
  if (/event\s*steward|stadium\s*steward/i.test(title)) {
    return `/job-finder?query=${encodeURIComponent('Event Steward')}`
  }
  return `/job-finder?query=${encodeURIComponent(title)}`
}

function shortSentence(text: string | undefined, fallback: string, max = 120): string {
  const raw = (text || '').trim()
  if (!raw) return fallback
  const first = raw.split(/(?<=[.!?])\s+/)[0] || raw
  return first.length > max ? `${first.slice(0, max - 1)}…` : first
}

function resolveTrainingType(
  card: RecommendationCourseCardData | undefined,
  hasApplyLink: boolean
): JobAZTrainingType {
  if (!card) return hasApplyLink ? 'published_course' : 'course_type'
  if (card.visibilityStatus === 'recommendation_only') return 'recommendation_only'
  if (card.publishedCourseId || card.commercialStatus === 'affiliate_ready' || hasApplyLink) {
    return 'published_course'
  }
  if (card.visibilityStatus === 'public_listed') return 'published_course'
  return 'recommendation_only'
}

function findCardForTitle(
  cards: RecommendationCourseCardData[],
  title: string
): RecommendationCourseCardData | undefined {
  return cards.find((c) => titlesMatchLoose(c.title, title))
}

function mapTrainingFromQual(params: {
  title: string
  why: string
  id?: string
  affiliateUrl?: string | null
  officialUrl?: string | null
  cards: RecommendationCourseCardData[]
}): JobAZTrainingItem {
  const card = findCardForTitle(params.cards, params.title)
  const applyUrl = (card?.referralUrl || params.affiliateUrl || '').trim() || undefined
  const officialUrl = (card?.officialUrl || params.officialUrl || '').trim() || undefined
  const hasApply = Boolean(applyUrl)
  const type = resolveTrainingType(card, hasApply || Boolean(officialUrl && card?.publishedCourseId))

  let action_label: JobAZTrainingItem['action_label'] = 'View recommendation'
  if (type === 'published_course' && hasApply) action_label = 'Apply Now'
  else if (type === 'published_course' && officialUrl) action_label = 'Apply Now'
  else if (type === 'recommendation_only') action_label = 'View recommendation'
  else if (type === 'course_type') action_label = 'View recommendation'

  return {
    title: card?.title || params.title,
    type,
    why_recommended: shortSentence(
      card?.whyRecommended || params.why,
      'Can help unlock better-paid roles on this route.'
    ),
    // Never invent providers — only surface when a published card carries a public offer label
    provider_name: (card?.publicOfferLabel || '').trim() || undefined,
    apply_url: applyUrl,
    official_url: officialUrl,
    action_label:
      hasApply || (type === 'published_course' && officialUrl) ? 'Apply Now' : action_label,
    id: params.id || card?.id,
    published_course_id: card?.publishedCourseId,
    slug: card?.slug,
    badge: card?.badge,
    no_published_provider: type === 'course_type' || (type === 'recommendation_only' && !hasApply),
  }
}

function courseTypeItem(title: string, why: string): JobAZTrainingItem {
  return {
    title,
    type: 'course_type',
    why_recommended: shortSentence(why, 'Useful course type for this route.'),
    action_label: 'View recommendation',
    no_published_provider: true,
  }
}

/** Ensure every plan has training_next + optional course types when relevant. */
function ensureTrainingCoverage(
  plan: JobAZPlan,
  hints: Array<string | null | undefined>
): JobAZPlan {
  const fallbacks = resolveRouteCourseFallbacks(
    plan.route_summary.route_title,
    plan.route_summary.current_target_role,
    plan.route_summary.next_upgrade_role,
    ...hints
  )

  let training_next = plan.training_next
  let optional_training = [...plan.optional_training]

  if (!training_next && fallbacks[0]) {
    training_next = courseTypeItem(fallbacks[0].title, fallbacks[0].why)
  }

  if (optional_training.length === 0) {
    const skipTitle = training_next?.title?.toLowerCase()
    optional_training = fallbacks
      .filter((f) => f.title.toLowerCase() !== skipTitle)
      .slice(0, 2)
      .map((f) => ({
        title: f.title,
        why_useful: shortSentence(f.why, 'Useful optional step for this route.'),
        type: 'course_type' as const,
      }))
  }

  // Prefer published Apply Now when a structured card matches the course-type title
  if (training_next && training_next.type === 'course_type' && plan.structured_cards.length > 0) {
    const card = findCardForTitle(plan.structured_cards, training_next.title)
    if (card) {
      training_next = mapTrainingFromQual({
        title: training_next.title,
        why: training_next.why_recommended,
        cards: plan.structured_cards,
      })
    }
  }

  return { ...plan, training_next, optional_training }
}

/** Ensure 2–4 work-now roles when engines return fewer. */
function ensureWorkNowCoverage(
  plan: JobAZPlan,
  extraTitles: string[] = []
): JobAZPlan {
  if (plan.work_now.length >= 2) {
    return { ...plan, work_now: plan.work_now.slice(0, 4) }
  }

  const existing = new Set(plan.work_now.map((j) => j.title.toLowerCase()))
  const padded = [...plan.work_now]

  for (const title of [
    ...extraTitles,
    plan.route_summary.current_target_role,
    ...plan.after_training.map((r) => r.title),
  ]) {
    const t = (title || '').trim()
    if (!t || existing.has(t.toLowerCase())) continue
    existing.add(t.toLowerCase())
    padded.push({
      title: t,
      why_it_matches: 'Realistic starter option on this route.',
      estimated_pay_range: 'Typical UK ranges vary',
      action_label: 'View jobs',
      href: jobFinderHref(t),
    })
    if (padded.length >= 2) break
  }

  return { ...plan, work_now: padded.slice(0, 4) }
}

function finalizePlan(
  plan: JobAZPlan,
  hints: Array<string | null | undefined> = [],
  extraWorkTitles: string[] = []
): JobAZPlan {
  const withWork = ensureWorkNowCoverage(plan, extraWorkTitles)
  const withTraining = ensureTrainingCoverage(withWork, hints)
  return {
    ...withTraining,
    cv_target_role:
      withTraining.cv_target_role || withTraining.route_summary.current_target_role,
    this_week_plan: withTraining.this_week_plan.slice(0, 4),
  }
}

function emptySignals(): PlanActivitySignals {
  return {
    planItems: [],
    savedJobsCount: 0,
    appliedJobsCount: 0,
    interviewConfidence: 0,
    cvQualityScore: 0,
    hasBaseCv: false,
    cvReady: false,
  }
}

function handoffLabels() {
  return {
    save_label: 'Save to My Plan',
    open_dashboard_label: 'Open My Plan Dashboard',
    continue_guest_label: 'Continue as guest',
  }
}

function mapExtraIncomeToPlan(result: ExtraIncomePlanResult): JobAZPlan {
  const skillBlob = collectSkillHints(result.skillsLabels, result.answers ?? {})
  const routeMeta = result.routeLogic
  const allowSia = Boolean(routeMeta?.allow_sia)
  const routeTitle = routeMeta?.route_title || `${pickExtraIncomeInterest(result.skillsLabels)} extra income`
  const securityRoute = allowSia || isSecurityRoute(skillBlob, routeTitle)
  const cards = (result.structuredRecommendations?.recommendedCourses ?? []).filter((c) =>
    allowExtraIncomeQualTitle(c.title, skillBlob, routeTitle)
  )

  const work_now: JobAZWorkNowRole[] = result.immediateOpportunities.slice(0, 3).map((job) => ({
    title: job.title,
    why_it_matches: shortSentence(
      job.matchReasons?.[0] || job.whyMatch,
      'Often a strong fit for your hours and skills.'
    ),
    estimated_pay_range: job.hourlyPay || 'Typical UK side rates vary',
    action_label: 'View jobs' as const,
    href: jobFinderHref(job.title),
  }))

  const filteredQuals = result.qualifications.filter((q) =>
    allowExtraIncomeQualTitle(q.title, skillBlob, routeTitle)
  )
  const primaryQual = pickPrimaryExtraIncomeQual(filteredQuals, allowSia)

  const training_next = primaryQual
    ? mapTrainingFromQual({
        title: primaryQual.title,
        why: primaryQual.whyHelps,
        id: primaryQual.id,
        affiliateUrl: primaryQual.affiliateUrl,
        officialUrl: primaryQual.officialUrl,
        cards,
      })
    : null

  if (securityRoute && training_next && isSiaDoorTitle(training_next.title)) {
    training_next.title = 'SIA Door Supervisor Course'
    training_next.why_recommended =
      'Complete this while starting event/security work to unlock Door Supervisor and better-paid security roles.'
  }

  let optionalSteps: PathPlanStep[] = filteredQuals
    .filter((q) => q.id !== primaryQual?.id)
    .map((q) => ({ id: q.id, title: q.title, description: q.whyHelps }))

  if (securityRoute) {
    optionalSteps = optionalSteps.filter((s) =>
      allowExtraIncomeQualTitle(s.title, skillBlob, routeTitle)
    )
  }

  const { relevantAddOns } = securityRoute
    ? splitSecurityAddOns(optionalSteps)
    : { relevantAddOns: optionalSteps }

  const optional_training: JobAZOptionalTraining[] = relevantAddOns.slice(0, 2).map((s) => {
    const card = findCardForTitle(cards, s.title)
    return {
      title: s.title,
      why_useful: shortSentence(s.description, 'Useful optional step for this route.'),
      type: resolveTrainingType(card, Boolean(card?.referralUrl)),
      id: s.id,
    }
  })

  const optionalSafe = filterExtraIncomeCourseTitles({
    routeId: routeMeta?.route_id || 'general',
    routeTitle,
    titles: optional_training.map((t) => t.title),
    allowSia,
  })
  const optionalTraining = optional_training.filter((t) => optionalSafe.titles.includes(t.title))

  const upgradeTitles =
    (routeMeta?.after_training_roles?.length
      ? routeMeta.after_training_roles
      : primaryQual && QUALIFICATION_UPGRADE_ROLES[primaryQual.id]) ||
    (securityRoute ? ['Door Supervisor', 'Security Guard', 'Event Security'] : [])

  const after_training = upgradeTitles.slice(0, 3).map((title) => ({
    title,
    href: jobFinderHref(title),
  }))

  const currentTarget = work_now[0]?.title || 'Side income role'
  // Prefer real training upgrade — never duplicate work-now / current focus as next_upgrade
  const trainingUpgrade = training_next?.title?.trim() || ''
  const afterUpgrade = after_training.find(
    (r) =>
      r.title.trim().toLowerCase() !== currentTarget.trim().toLowerCase() &&
      r.title.trim().toLowerCase() !== trainingUpgrade.toLowerCase()
  )?.title
  const nextUpgrade =
    (trainingUpgrade &&
    trainingUpgrade.toLowerCase() !== currentTarget.toLowerCase()
      ? trainingUpgrade
      : null) ||
    afterUpgrade ||
    (primaryQual && !isSiaDoorTitle(primaryQual.title) ? primaryQual.title : null) ||
    'Higher-paid role'

  const one_sentence_summary = securityRoute
    ? 'Start earning through event/security steward roles now, then use SIA Door Supervisor to unlock better-paid security roles.'
    : shortSentence(
        result.supportiveMessage || routeMeta?.user_goal || result.fastestPath?.lines?.[0],
        `Start earning with ${currentTarget}, then train for ${nextUpgrade}.`
      )

  const cv_action = routeMeta?.cv_focus
    ? `Build a simple CV focused on ${routeMeta.cv_focus}.`
    : securityRoute
      ? 'Build a simple security/events CV focused on reliability, availability, customer service and right to work.'
      : `Build a simple CV for ${currentTarget} that highlights reliability, availability and relevant skills.`

  const trainStepLabel =
    primaryQual && isSiaDoorTitle(primaryQual.title) ? 'SIA Door Supervisor' : primaryQual?.title
  const optionalFirstAid = optionalTraining.find((t) => /first\s*aid/i.test(t.title))
  const this_week_plan = securityRoute
    ? [
        'Improve simple security/events CV',
        'Compare/book an SIA Door Supervisor course',
        `Apply to 3 ${currentTarget} roles`,
        'Save 2 security/event jobs',
        optionalFirstAid
          ? 'Optional: Compare First Aid at Work'
          : optionalTraining[0]
            ? `Optional: Compare ${optionalTraining[0].title}`
            : null,
      ]
        .filter(Boolean)
        .slice(0, 5) as string[]
    : [
        `Improve CV for ${currentTarget}`,
        primaryQual
          ? `Compare/book a ${trainStepLabel || primaryQual.title} course`
          : 'Review recommended training',
        `Apply to 3 ${currentTarget} roles`,
        'Save 2 matching jobs',
        optionalTraining[0] ? `Optional: Compare ${optionalTraining[0].title}` : 'Practice interview answers',
      ]
        .filter(Boolean)
        .slice(0, 5)

  const ladderPreview: PathPlanLadder = {
    routeLabel: routeTitle,
    startNow: work_now.map((j) => ({
      title: j.title,
      description: j.why_it_matches,
      salaryRange: j.estimated_pay_range,
      href: j.href,
    })),
    trainNext: training_next
      ? [
          {
            title: training_next.title,
            description: training_next.why_recommended,
            referralUrl: training_next.apply_url,
            officialUrl: training_next.official_url,
            id: training_next.id,
          },
        ]
      : [],
    upgradeAfter: after_training.map((r) => ({ title: r.title, href: r.href })),
    optionalAddOns: optionalTraining.map((o) => ({ title: o.title, description: o.why_useful })),
    relevantAddOns: optionalTraining.map((o) => ({ title: o.title, description: o.why_useful })),
    otherRouteAddOns: [],
    trainingTitles: [
      ...(training_next ? [training_next.title] : []),
      ...optionalTraining.map((o) => o.title),
    ],
    structuredCards: cards.slice(0, 6),
    pathId: 'side_job',
    isSecurityRoute: securityRoute,
  }

  const readiness = computeCareerReadiness({
    signals: emptySignals(),
    routeLabel: routeTitle,
    routePathId: 'side_job',
    targetRole: currentTarget,
    pathLadder: ladderPreview,
    missions: this_week_plan.map((label, i) => ({
      id: `preview-${i}`,
      label,
      href: '/dashboard',
      completed: false,
      guestLocked: false,
    })),
    assessmentCompleted: true,
  })

  return finalizePlan(
    {
      version: 1,
      source_path_id: 'side_job',
      route_summary: {
        route_title: routeTitle,
        one_sentence_summary,
        current_target_role: currentTarget,
        next_upgrade_role: nextUpgrade,
        readiness_score: readiness.percent,
      },
      work_now,
      training_next,
      optional_training: optionalTraining,
      after_training,
      cv_action,
      cv_target_role: currentTarget,
      this_week_plan,
      dashboard_handoff: handoffLabels(),
      structured_cards: cards.slice(0, 6),
    },
    [skillBlob, routeTitle, currentTarget, nextUpgrade, primaryQual?.title]
  )
}

function mapEducationLikeToPlan(result: CareerEnginePlanResult): JobAZPlan {
  const routeTitle = result.specialisationLabel
    ? `${result.specialisationLabel} · ${result.fieldLabel}`
    : result.fieldLabel
  const cards = result.structuredRecommendations?.recommendedCourses ?? []
  const work_now: JobAZWorkNowRole[] = result.workNow.slice(0, 3).map((job) => ({
    title: job.title,
    why_it_matches: shortSentence(
      undefined,
      'Matched to your education and Career Coach route.'
    ),
    estimated_pay_range: job.salaryRange || 'Typical UK ranges vary',
    action_label: 'View jobs' as const,
    href: job.href || jobFinderHref(job.title),
  }))

  const primaryCourse = result.recommendedCourses[0]
  const primaryCard = primaryCourse
    ? findCardForTitle(cards, primaryCourse.title) || cards[0]
    : cards[0]

  const training_next = primaryCourse
    ? mapTrainingFromQual({
        title: primaryCourse.title,
        why: primaryCourse.whyReasons?.[0] || '',
        id: primaryCourse.id,
        cards,
      })
    : primaryCard
      ? mapTrainingFromQual({
          title: primaryCard.title,
          why: primaryCard.whyRecommended,
          id: primaryCard.id,
          affiliateUrl: primaryCard.referralUrl,
          officialUrl: primaryCard.officialUrl,
          cards,
        })
      : null

  const optional_training: JobAZOptionalTraining[] = result.recommendedCourses
    .slice(1, 3)
    .map((c) => ({
      title: c.title,
      why_useful: shortSentence(c.whyReasons?.[0], 'Useful next step on this route.'),
      type: resolveTrainingType(findCardForTitle(cards, c.title), false),
      id: c.id,
    }))
    .slice(0, 2)

  const after_training = result.careerTimeline.slice(1, 4).map((title) => ({
    title,
    href: jobFinderHref(title),
  }))

  const currentTarget = work_now[0]?.title || result.workNow[0]?.title || result.fieldLabel
  const nextUpgrade = after_training[0]?.title || training_next?.title || 'Next role'

  const this_week_plan = [
    'Improve your UK CV for this route',
    training_next ? `Compare/book a ${training_next.title} course` : 'Review recommended training',
    `Apply to 3 ${currentTarget} roles`,
    'Save 2 matching jobs',
    result.essentialActions[0]?.title || 'Practice interview answers',
  ].slice(0, 4)

  const readiness = computeCareerReadiness({
    signals: emptySignals(),
    routeLabel: routeTitle,
    routePathId: result.pathId,
    targetRole: currentTarget,
    pathLadder: {
      routeLabel: routeTitle,
      startNow: work_now.map((j) => ({ title: j.title, href: j.href })),
      trainNext: training_next ? [{ title: training_next.title }] : [],
      upgradeAfter: after_training,
      optionalAddOns: [],
      relevantAddOns: [],
      otherRouteAddOns: [],
      trainingTitles: training_next ? [training_next.title] : [],
      structuredCards: cards.slice(0, 6),
      pathId: result.pathId,
    },
    assessmentCompleted: true,
  })

  return finalizePlan(
    {
      version: 1,
      source_path_id: result.pathId,
      route_summary: {
        route_title: routeTitle,
        one_sentence_summary: shortSentence(
          result.goal || result.careerReadiness?.summary,
          `Use ${currentTarget} now, then train toward ${nextUpgrade}.`
        ),
        current_target_role: currentTarget,
        next_upgrade_role: nextUpgrade,
        readiness_score: readiness.percent,
      },
      work_now,
      training_next,
      optional_training,
      after_training,
      cv_action: `Build a UK CV focused on ${currentTarget} and your ${result.fieldLabel} background.`,
      cv_target_role: currentTarget,
      this_week_plan,
      dashboard_handoff: handoffLabels(),
      structured_cards: cards.slice(0, 6),
    },
    [routeTitle, result.fieldLabel, result.specialisationLabel, currentTarget],
    result.careerTimeline
  )
}

function mapStartNewCareerToPlan(result: StartNewCareerPlanResult): JobAZPlan {
  const routeTitle = `${result.currentField} → ${result.targetField}`
  const cards = result.structuredRecommendations?.recommendedCourses ?? []
  const work_now: JobAZWorkNowRole[] = result.triad.workNow.slice(0, 3).map((item) => ({
    title: item.title,
    why_it_matches: shortSentence(
      Array.isArray(item.why) ? item.why[0] : item.why,
      'Can help you start earning while you transition.'
    ),
    estimated_pay_range: 'Typical UK ranges vary',
    action_label: 'View jobs' as const,
    href: jobFinderHref(item.title),
  }))

  const primaryCourse = result.recommendedCourses[0]
  const training_next = primaryCourse
    ? mapTrainingFromQual({
        title: primaryCourse.title,
        why: primaryCourse.whyReasons?.[0] || '',
        id: primaryCourse.id,
        cards,
      })
    : result.triad.buildNext[0]
      ? mapTrainingFromQual({
          title: result.triad.buildNext[0].title,
          why: Array.isArray(result.triad.buildNext[0].why)
            ? result.triad.buildNext[0].why[0]
            : result.triad.buildNext[0].why,
          cards,
        })
      : null

  const optional_training: JobAZOptionalTraining[] = result.recommendedCourses
    .slice(1, 3)
    .map((c) => ({
      title: c.title,
      why_useful: shortSentence(c.whyReasons?.[0], 'Supports your transition.'),
      type: resolveTrainingType(findCardForTitle(cards, c.title), false),
      id: c.id,
    }))

  const after_training = result.triad.longTerm.slice(0, 3).map((item) => ({
    title: item.title,
    href: jobFinderHref(item.title),
  }))

  const currentTarget = work_now[0]?.title || result.targetField
  const nextUpgrade = after_training[0]?.title || result.targetField

  const this_week_plan = [
    `Improve CV toward ${result.targetField}`,
    training_next ? `Compare/book a ${training_next.title} course` : 'Review build-next steps',
    `Apply to 3 ${currentTarget} roles`,
    'Save 2 transition jobs',
    result.essentialActions[0]?.title || 'Practice interview answers',
  ].slice(0, 4)

  const readiness = computeCareerReadiness({
    signals: emptySignals(),
    routeLabel: routeTitle,
    routePathId: 'start_new_career',
    targetRole: currentTarget,
    pathLadder: {
      routeLabel: routeTitle,
      startNow: work_now.map((j) => ({ title: j.title })),
      trainNext: training_next ? [{ title: training_next.title }] : [],
      upgradeAfter: after_training,
      optionalAddOns: [],
      relevantAddOns: [],
      otherRouteAddOns: [],
      trainingTitles: training_next ? [training_next.title] : [],
      structuredCards: cards.slice(0, 6),
      pathId: 'start_new_career',
    },
    assessmentCompleted: true,
  })

  return finalizePlan(
    {
      version: 1,
      source_path_id: 'start_new_career',
      route_summary: {
        route_title: routeTitle,
        one_sentence_summary: shortSentence(
          result.transition?.summary,
          `Start with ${currentTarget}, then build toward ${nextUpgrade}.`
        ),
        current_target_role: currentTarget,
        next_upgrade_role: nextUpgrade,
        readiness_score: readiness.percent,
      },
      work_now,
      training_next,
      optional_training,
      after_training,
      cv_action: `Build a transition CV that shows transferable strengths for ${result.targetField}.`,
      cv_target_role: currentTarget,
      this_week_plan,
      dashboard_handoff: handoffLabels(),
      structured_cards: cards.slice(0, 6),
    },
    [routeTitle, result.currentField, result.targetField, currentTarget],
    result.triad.workNow.map((i) => i.title)
  )
}

function isExtraIncome(raw: unknown): raw is ExtraIncomePlanResult {
  return Boolean(
    raw &&
      typeof raw === 'object' &&
      (raw as ExtraIncomePlanResult).pathId === 'side_job' &&
      Array.isArray((raw as ExtraIncomePlanResult).immediateOpportunities)
  )
}

function isEducationLike(raw: unknown): raw is CareerEnginePlanResult {
  return Boolean(
    raw &&
      typeof raw === 'object' &&
      ((raw as CareerEnginePlanResult).pathId === 'work_in_education' ||
        (raw as CareerEnginePlanResult).pathId === 'work_in_experience') &&
      Array.isArray((raw as CareerEnginePlanResult).essentialActions)
  )
}

function isStartNewRoadmap(raw: unknown): raw is StartNewCareerPlanResult {
  return Boolean(
    raw &&
      typeof raw === 'object' &&
      (raw as StartNewCareerPlanResult).pathId === 'start_new_career' &&
      (raw as StartNewCareerPlanResult).phase === 'roadmap'
  )
}

/** Map UK Career Assistant / Grow / Business action plan into shared JobAZPlan. */
export function mapCareerActionPlanToJobAZPlan(
  actionPlan: CareerActionPlan,
  opts?: { pathId?: string; matchScore?: number; coachNotes?: string }
): JobAZPlan {
  const workTier = actionPlan.tiers.find((t) => t.id === 'work_now')
  const buildTier = actionPlan.tiers.find((t) => t.id === 'build_next')
  const longTier = actionPlan.tiers.find((t) => t.id === 'long_term')

  const work_now: JobAZWorkNowRole[] = (workTier?.jobs ?? [])
    .slice(0, 4)
    .map((job) => ({
      title: job.title,
      why_it_matches: shortSentence(
        job.subtitle || job.badges?.[0],
        'Matched to your Career Assistant answers.'
      ),
      estimated_pay_range: job.salaryRange || 'Typical UK ranges vary',
      action_label: 'View jobs' as const,
      href: job.href || jobFinderHref(job.title),
    }))

  const courses = buildTier?.courses ?? []
  const primaryCourse = courses[0]
  const training_next = primaryCourse
    ? courseTypeItem(
        primaryCourse.title,
        primaryCourse.careerImpact || primaryCourse.qualification || 'Supports your next step.'
      )
    : null

  const optional_training: JobAZOptionalTraining[] = courses.slice(1, 3).map((c) => ({
    title: c.title,
    why_useful: shortSentence(c.careerImpact, 'Useful optional step for this route.'),
    type: 'course_type' as const,
    id: c.id,
  }))

  const after_training = (longTier?.timeline ?? [])
    .filter((s) => s.kind === 'role' || s.kind === 'goal')
    .slice(0, 3)
    .map((s) => ({ title: s.label, href: jobFinderHref(s.label) }))

  const currentTarget = work_now[0]?.title || actionPlan.headline
  const nextUpgrade =
    after_training[0]?.title || training_next?.title || longTier?.items?.[0] || 'Next role'

  const pathId = opts?.pathId || actionPlan.pathId || 'uk_career_assistant'
  const this_week_plan = (
    actionPlan.missions.length > 0
      ? actionPlan.missions.map((m) => m.label)
      : [
          `Improve CV for ${currentTarget}`,
          training_next ? `Review ${training_next.title}` : 'Review recommended training',
          `Apply to 3 ${currentTarget} roles`,
          'Save 2 matching jobs',
          'Continue your plan',
        ]
  ).slice(0, 4)

  const readiness = computeCareerReadiness({
    signals: emptySignals(),
    routeLabel: actionPlan.headline,
    routePathId: pathId,
    targetRole: currentTarget,
    pathLadder: {
      routeLabel: actionPlan.headline,
      startNow: work_now.map((j) => ({ title: j.title, href: j.href })),
      trainNext: training_next ? [{ title: training_next.title }] : [],
      upgradeAfter: after_training,
      optionalAddOns: [],
      relevantAddOns: [],
      otherRouteAddOns: [],
      trainingTitles: training_next ? [training_next.title] : [],
      structuredCards: [],
      pathId,
    },
    assessmentCompleted: true,
  })

  return finalizePlan(
    {
      version: 1,
      source_path_id: pathId,
      route_summary: {
        route_title: actionPlan.headline,
        one_sentence_summary: shortSentence(
          actionPlan.oneLiner || opts?.coachNotes,
          `Start with ${currentTarget}, then train toward ${nextUpgrade}.`
        ),
        current_target_role: currentTarget,
        next_upgrade_role: nextUpgrade,
        readiness_score: readiness.percent,
        match_score: opts?.matchScore,
      },
      work_now,
      training_next,
      optional_training,
      after_training,
      cv_action: `Build a UK CV tailored for ${currentTarget}.`,
      cv_target_role: currentTarget,
      this_week_plan,
      dashboard_handoff: handoffLabels(),
      structured_cards: [],
    },
    [actionPlan.headline, actionPlan.oneLiner, currentTarget],
    workTier?.items ?? []
  )
}

/** Map any Career Coach structured result into the shared JobAZPlan handoff. */
export function mapCareerCoachResultToPlan(result: unknown): JobAZPlan | null {
  if (isExtraIncome(result)) return mapExtraIncomeToPlan(result)
  if (isEducationLike(result)) return mapEducationLikeToPlan(result)
  if (isStartNewRoadmap(result)) return mapStartNewCareerToPlan(result)
  return null
}

/** Convert JobAZPlan into PathPlanLadder so My Plan stays aligned with Assistant handoff. */
export function jobazPlanToPathLadder(plan: JobAZPlan): PathPlanLadder {
  const train = plan.training_next
  return {
    routeLabel: plan.route_summary.route_title,
    startNow: plan.work_now.map((j) => ({
      title: j.title,
      description: j.why_it_matches,
      salaryRange: j.estimated_pay_range,
      href: j.href,
    })),
    trainNext: train
      ? [
          {
            title: train.title,
            description: train.why_recommended,
            referralUrl: train.apply_url,
            officialUrl: train.official_url,
            id: train.id,
            publishedCourseId: train.published_course_id,
          },
        ]
      : [],
    upgradeAfter: plan.after_training.map((r) => ({
      title: r.title,
      href: r.href,
    })),
    optionalAddOns: plan.optional_training.map((o) => ({
      title: o.title,
      description: o.why_useful,
      id: o.id,
    })),
    relevantAddOns: plan.optional_training.map((o) => ({
      title: o.title,
      description: o.why_useful,
      id: o.id,
    })),
    otherRouteAddOns: [],
    trainingTitles: [
      ...(train ? [train.title] : []),
      ...plan.optional_training.map((o) => o.title),
    ],
    structuredCards: plan.structured_cards,
    pathId: plan.source_path_id,
    isSecurityRoute: /security/i.test(plan.route_summary.route_title),
  }
}

export function isJobAZPlan(value: unknown): value is JobAZPlan {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as JobAZPlan).version === 1 &&
      (value as JobAZPlan).route_summary &&
      Array.isArray((value as JobAZPlan).work_now)
  )
}
