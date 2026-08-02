/**
 * Path ladder for My Plan — preserves Career Coach stages without changing engine logic.
 * Extra Income example: Start Now (Steward) → Train Next (SIA) → Upgrade (Door Supervisor).
 */

import type { ExtraIncomePlanResult } from '@/lib/career-engine/extra-income/types'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import type { StartNewCareerPlanResult } from '@/lib/career-engine/start-new-career/types'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import type { AssessmentBundle } from './planFromAssessment'
import {
  allowExtraIncomeQualTitle,
  collectSkillHints,
  isSecurityRoute,
  isSiaDoorTitle,
  splitSecurityAddOns,
} from './myPlanDisplayFilter'
import {
  isJobAZPlan,
  jobazPlanToPathLadder,
  mapCareerCoachResultToPlan,
} from './mapCareerCoachResultToPlan'

export type PathPlanStep = {
  title: string
  description?: string
  /** Display-only pay hint when available from Coach data */
  salaryRange?: string
  href?: string
  /** Qual catalog id when known */
  id?: string
  referralUrl?: string
  officialUrl?: string
  publishedCourseId?: string
}

export type PathPlanLadder = {
  /** e.g. "Security extra income" */
  routeLabel: string
  /** Immediate work — not the same as the training goal */
  startNow: PathPlanStep[]
  /** Next qualification step */
  trainNext: PathPlanStep[]
  /** Roles unlocked after training — not treated as the current chosen goal */
  upgradeAfter: PathPlanStep[]
  /** Optional later add-ons (combined) */
  optionalAddOns: PathPlanStep[]
  /** Security (and similar): prioritised add-ons */
  relevantAddOns: PathPlanStep[]
  /** De-prioritised but allowed for this user's skill mix */
  otherRouteAddOns: PathPlanStep[]
  /** Titles to resolve into Recommended Training cards */
  trainingTitles: string[]
  /** Pre-resolved cards from Career Coach when persisted */
  structuredCards: RecommendationCourseCardData[]
  pathId?: string
  /** True when route is security extra income */
  isSecurityRoute?: boolean
}

/** Display-only unlocks after a named qualification — not Career Coach decision logic. */
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
  manual_handling: ['Warehouse Operative', 'Care Assistant'],
  taxi_phv: ['Private Hire Driver', 'Delivery Driver'],
  personal_licence: ['Bar Staff', 'Front of House'],
}

function jobFinderHref(title: string): string {
  return `/job-finder?query=${encodeURIComponent(
    /matchday\s*steward/i.test(title)
      ? 'Matchday Steward'
      : /event\s*steward|stadium\s*steward/i.test(title)
        ? 'Event Steward'
        : title
  )}`
}

function isExtraIncomeResult(raw: unknown): raw is ExtraIncomePlanResult {
  return Boolean(
    raw &&
      typeof raw === 'object' &&
      (raw as ExtraIncomePlanResult).pathId === 'side_job' &&
      Array.isArray((raw as ExtraIncomePlanResult).immediateOpportunities)
  )
}

function isEducationLikeResult(raw: unknown): raw is CareerEnginePlanResult {
  return Boolean(
    raw &&
      typeof raw === 'object' &&
      ((raw as CareerEnginePlanResult).pathId === 'work_in_education' ||
        (raw as CareerEnginePlanResult).pathId === 'work_in_experience') &&
      Array.isArray((raw as CareerEnginePlanResult).essentialActions)
  )
}

function isStartNewCareerRoadmap(raw: unknown): raw is StartNewCareerPlanResult {
  return Boolean(
    raw &&
      typeof raw === 'object' &&
      (raw as StartNewCareerPlanResult).pathId === 'start_new_career' &&
      (raw as StartNewCareerPlanResult).phase === 'roadmap'
  )
}

function buildExtraIncomeLadder(result: ExtraIncomePlanResult): PathPlanLadder {
  const skillBlob = collectSkillHints(result.skillsLabels, result.answers ?? {})
  const routeMeta = result.routeLogic
  const allowSia = Boolean(routeMeta?.allow_sia)
  const routeLabel = routeMeta?.route_title || `${result.skillsLabels[0] ?? 'Side'} extra income`
  const securityRoute = allowSia || isSecurityRoute(skillBlob, routeLabel)

  const startNow: PathPlanStep[] = result.immediateOpportunities.slice(0, 3).map((job) => ({
    title: job.title,
    description: job.matchReasons?.[0] || job.whyMatch,
    salaryRange: job.hourlyPay,
    href: jobFinderHref(job.title),
  }))

  const filteredQuals = result.qualifications.filter((q) =>
    allowExtraIncomeQualTitle(q.title, skillBlob, routeLabel)
  )

  const primaryQual = (() => {
    if (filteredQuals.length === 0) return undefined
    const primary = filteredQuals.find((q) => q.recommendedBadge) ?? filteredQuals[0]
    if (primary && isSiaDoorTitle(primary.title) && !allowSia) {
      return filteredQuals.find((q) => !isSiaDoorTitle(q.title))
    }
    if (primary && /first\s*aid/i.test(primary.title)) {
      const better = filteredQuals.find(
        (q) => q.recommendedBadge && !/first\s*aid/i.test(q.title) && !isSiaDoorTitle(q.title)
      )
      if (better) return better
    }
    return primary
  })()

  const trainNext: PathPlanStep[] = primaryQual
    ? [
        {
          id: primaryQual.id,
          title: primaryQual.title,
          description: `Complete ${primaryQual.title} — ${primaryQual.whyHelps}`,
          referralUrl: primaryQual.affiliateUrl ?? undefined,
          officialUrl: primaryQual.officialUrl ?? undefined,
        },
      ]
    : []

  const upgradeTitles =
    (routeMeta?.after_training_roles?.length
      ? routeMeta.after_training_roles
      : primaryQual && QUALIFICATION_UPGRADE_ROLES[primaryQual.id]) ||
    (securityRoute ? ['Door Supervisor', 'Security Guard', 'Event Security'] : [])

  const upgradeAfter: PathPlanStep[] = upgradeTitles.map((title) => ({
    title,
    description: 'Apply after completing your next qualification',
    href: jobFinderHref(title),
  }))

  // Remaining filtered quals become optional add-ons
  let optionalAddOns: PathPlanStep[] = filteredQuals
    .filter((q) => q.id !== primaryQual?.id)
    .map((q) => ({
      id: q.id,
      title: q.title,
      description: q.whyHelps,
    }))

  // For security, ensure First Aid / CCTV appear as relevant when Coach ranked them
  // (already in filteredQuals if present). Prefer those at front of relevant group.
  if (securityRoute) {
    optionalAddOns = optionalAddOns.filter((s) => allowExtraIncomeQualTitle(s.title, skillBlob, routeLabel))
  }

  const { relevantAddOns, otherRouteAddOns } = securityRoute
    ? splitSecurityAddOns(optionalAddOns)
    : { relevantAddOns: optionalAddOns, otherRouteAddOns: [] as PathPlanStep[] }

  // If security and Coach didn't include First Aid / CCTV but catalog ranked them in
  // result.qualifications originally and they were filtered only by slice — already handled.
  // Prefer relevant titles first when building trainingTitles.
  const structuredCards = (result.structuredRecommendations?.recommendedCourses ?? [])
    .filter((c) => allowExtraIncomeQualTitle(c.title, skillBlob, routeLabel))
    .slice(0, 6)

  const trainingTitles = [
    ...trainNext.map((t) => t.title),
    ...relevantAddOns.map((t) => t.title),
    ...otherRouteAddOns.map((t) => t.title),
  ]

  return {
    routeLabel,
    startNow,
    trainNext,
    upgradeAfter,
    optionalAddOns: [...relevantAddOns, ...otherRouteAddOns],
    relevantAddOns,
    otherRouteAddOns,
    trainingTitles,
    structuredCards,
    pathId: 'side_job',
    isSecurityRoute: securityRoute,
  }
}

function buildEducationLikeLadder(result: CareerEnginePlanResult): PathPlanLadder {
  const routeLabel = result.specialisationLabel
    ? `${result.specialisationLabel} · ${result.fieldLabel}`
    : result.fieldLabel

  const startNow: PathPlanStep[] = result.workNow.slice(0, 3).map((job) => ({
    title: job.title,
    description: 'Matched to your Career Coach route.',
    salaryRange: job.salaryRange,
    href: job.href,
  }))

  const trainNext: PathPlanStep[] = result.recommendedCourses.slice(0, 2).map((c) => ({
    title: c.title,
    description: c.whyReasons[0],
    href: c.href,
  }))

  const upgradeAfter: PathPlanStep[] = result.careerTimeline.slice(1, 4).map((step) => ({
    title: step,
  }))

  const optionalAddOns: PathPlanStep[] = result.essentialActions
    .filter((a) => a.priority !== 'critical')
    .slice(0, 3)
    .map((a) => ({ title: a.title, description: a.description, href: a.href }))

  const structuredCards =
    result.structuredRecommendations?.recommendedCourses?.slice(0, 6) ?? []

  return {
    routeLabel,
    startNow,
    trainNext,
    upgradeAfter,
    optionalAddOns,
    relevantAddOns: optionalAddOns,
    otherRouteAddOns: [],
    trainingTitles: [
      ...result.recommendedCourses.map((c) => c.title),
      ...structuredCards.map((c) => c.title),
    ],
    structuredCards,
    pathId: result.pathId,
  }
}

function buildStartNewCareerLadder(result: StartNewCareerPlanResult): PathPlanLadder {
  return {
    routeLabel: `${result.currentField} → ${result.targetField}`,
    startNow: result.triad.workNow.slice(0, 3).map((item) => ({
      title: item.title,
      description: item.why[0],
    })),
    trainNext: [
      ...result.triad.buildNext.slice(0, 2).map((item) => ({
        title: item.title,
        description: item.why[0],
      })),
      ...result.recommendedCourses.slice(0, 2).map((c) => ({
        title: c.title,
        description: c.whyReasons[0],
        href: c.href,
      })),
    ],
    upgradeAfter: result.triad.longTerm.slice(0, 3).map((item) => ({
      title: item.title,
      description: item.why[0],
    })),
    optionalAddOns: result.essentialActions.slice(0, 3).map((a) => ({
      title: a.title,
      description: a.description,
      href: a.href,
    })),
    relevantAddOns: result.essentialActions.slice(0, 3).map((a) => ({
      title: a.title,
      description: a.description,
      href: a.href,
    })),
    otherRouteAddOns: [],
    trainingTitles: result.recommendedCourses.map((c) => c.title),
    structuredCards: result.structuredRecommendations?.recommendedCourses?.slice(0, 6) ?? [],
    pathId: 'start_new_career',
  }
}

export function buildPathPlanLadder(bundle: AssessmentBundle): PathPlanLadder | null {
  const storedPlan = bundle.aiState?.jobaz_plan
  if (isJobAZPlan(storedPlan)) return jobazPlanToPathLadder(storedPlan)

  const raw = bundle.aiState?.career_engine_result
  if (raw && typeof raw === 'object' && isJobAZPlan((raw as { jobazPlan?: unknown }).jobazPlan)) {
    return jobazPlanToPathLadder((raw as { jobazPlan: import('./mapCareerCoachResultToPlan').JobAZPlan }).jobazPlan)
  }

  const mapped = mapCareerCoachResultToPlan(raw)
  if (mapped) return jobazPlanToPathLadder(mapped)

  // Legacy fallbacks if mapper cannot recognise the payload
  if (isExtraIncomeResult(raw)) return buildExtraIncomeLadder(raw)
  if (isEducationLikeResult(raw)) return buildEducationLikeLadder(raw)
  if (isStartNewCareerRoadmap(raw)) return buildStartNewCareerLadder(raw)
  return null
}

/** Training requirement titles for My Plan / roadmap — qualifications only for Extra Income. */
export function extractPathTrainingTitles(bundle: AssessmentBundle): string[] {
  const ladder = buildPathPlanLadder(bundle)
  if (ladder?.trainingTitles.length) {
    return [...new Set(ladder.trainingTitles.map((t) => t.trim()).filter(Boolean))]
  }
  return []
}
