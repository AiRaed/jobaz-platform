/**
 * Plan-aware CV guidance for Documents tab — display helpers only.
 */

import type { CareerRoadmap } from '@/lib/dashboard/careerOs/types'
import { isJobAZPlan, type JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { isSecurityRoute } from '@/lib/dashboard/careerOs/myPlanDisplayFilter'

export type PlanCvGuidance = {
  hasPlan: boolean
  planTitle: string
  pathId: string | null
  currentTarget: string
  nextUpgrade: string
  cvAction: string
  focusKeywords: string[]
  headline: string
  body: string
}

const SECURITY_FOCUS = [
  'security',
  'event',
  'steward',
  'door supervisor',
  'sia',
  'customer service',
  'availability',
  'flexible',
  'right to work',
  'reliability',
  'crowd',
  'venue',
  'hospitality',
]

function extractFocusFromCvAction(cvAction: string): string[] {
  const match = cvAction.match(/focused on\s+(.+?)(?:\.|$)/i)
  if (!match?.[1]) return []
  return match[1]
    .split(/,|\band\b/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length > 2)
}

function defaultFocusForRoute(pathId: string | null, routeLabel: string, target: string): string[] {
  const blob = `${pathId || ''} ${routeLabel}`.toLowerCase()
  if (isSecurityRoute(blob, routeLabel) || /security|sia|steward/.test(blob)) {
    return SECURITY_FOCUS
  }
  if (/education|work_in_education/.test(blob)) {
    return ['relevant qualification', 'UK English', target, 'teamwork', 'attention to detail'].filter(
      Boolean
    ) as string[]
  }
  if (/experience|work_in_experience/.test(blob)) {
    return ['transferable skills', 'UK experience', target, 'reliability', 'communication'].filter(
      Boolean
    ) as string[]
  }
  if (/start_new|new career/.test(blob)) {
    return ['transferable strengths', target, 'adaptability', 'willingness to learn'].filter(
      Boolean
    ) as string[]
  }
  if (target) {
    return [target, 'reliability', 'communication', 'right to work', 'availability']
  }
  return ['reliability', 'communication', 'relevant skills', 'availability']
}

export function buildPlanCvGuidance(
  roadmap: CareerRoadmap | null | undefined,
  jobazPlan?: JobAZPlan | null
): PlanCvGuidance {
  const plan =
    jobazPlan && isJobAZPlan(jobazPlan)
      ? jobazPlan
      : null

  if (!roadmap && !plan) {
    return {
      hasPlan: false,
      planTitle: '',
      pathId: null,
      currentTarget: '',
      nextUpgrade: '',
      cvAction: '',
      focusKeywords: [],
      headline: 'General CV readiness',
      body: 'Create a career plan to get more specific CV guidance.',
    }
  }

  const planTitle =
    plan?.route_summary.route_title || roadmap?.routeLabel || 'Your career plan'
  const pathId = plan?.source_path_id || roadmap?.routePathId || null
  const currentTarget =
    plan?.route_summary.current_target_role ||
    roadmap?.targetRole ||
    roadmap?.destination.targetRole ||
    ''
  const nextUpgrade =
    plan?.route_summary.next_upgrade_role ||
    roadmap?.pathLadder?.upgradeAfter[0]?.title ||
    roadmap?.destination.nextRole ||
    ''
  const cvAction =
    plan?.cv_action ||
    `Build a UK CV that supports applications for ${currentTarget || 'your target roles'}.`

  const fromAction = extractFocusFromCvAction(cvAction)
  const focusKeywords =
    fromAction.length >= 3
      ? fromAction
      : defaultFocusForRoute(pathId, planTitle, currentTarget)

  const isSecurity =
    Boolean(roadmap?.pathLadder?.isSecurityRoute) ||
    isSecurityRoute(`${planTitle} ${pathId}`, planTitle)

  const body = isSecurity
    ? 'Your CV should focus on reliability, availability, customer service, right to work, flexibility, and security/events experience.'
    : cvAction

  return {
    hasPlan: true,
    planTitle,
    pathId,
    currentTarget,
    nextUpgrade,
    cvAction,
    focusKeywords: focusKeywords.slice(0, 8),
    headline: `CV readiness for ${planTitle}`,
    body,
  }
}

/** Build Improve CV URL — existing builder ignores unknown params safely. */
export function buildImproveCvHref(params: {
  cvId?: string | null
  targetRole?: string
  route?: string
  pathId?: string | null
  focusKeywords?: string[]
}): string {
  const q = new URLSearchParams()
  q.set('mode', 'improve')
  if (params.cvId) q.set('cvId', params.cvId)
  if (params.targetRole) q.set('targetRole', params.targetRole)
  if (params.route) q.set('route', params.route)
  if (params.pathId) q.set('planPath', params.pathId)
  if (params.focusKeywords?.length) q.set('focus', params.focusKeywords.slice(0, 6).join(','))
  const qs = q.toString()
  return qs ? `/cv-builder-v2?${qs}` : '/cv-builder-v2?mode=improve'
}
