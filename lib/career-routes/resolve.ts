import type { CourseInterestStatus } from '@/lib/cv-builder/courseInterest'
import { careerRouteStageRules } from './registry'
import type {
  CareerRouteStageId,
  CareerRouteStageRule,
  ResolvedCareerRouteStage,
  TrainingMentionStatus,
} from './types'

function toTrainingMention(
  status: CourseInterestStatus | 'not_started' | null | undefined
): TrainingMentionStatus {
  if (!status || status === 'not_started' || status === 'dismissed') return 'none'
  if (status === 'completed') return 'completed'
  if (status === 'booked' || status === 'in_progress') return 'in_progress'
  if (status === 'viewed' || status === 'clicked' || status === 'saved') return 'interested'
  return 'none'
}

function rankStatus(a: TrainingMentionStatus, b: TrainingMentionStatus): TrainingMentionStatus {
  const order: TrainingMentionStatus[] = ['none', 'interested', 'in_progress', 'completed']
  return order.indexOf(a) >= order.indexOf(b) ? a : b
}

function statusFromPlanItem(status: string): TrainingMentionStatus {
  const s = status.toLowerCase()
  if (s === 'completed') return 'completed'
  if (s === 'in_progress' || s === 'booked') return 'in_progress'
  if (s === 'saved' || s === 'interested' || s === 'recommended') return 'interested'
  return 'none'
}

export function primaryTrainingUpgrade(rule: CareerRouteStageRule) {
  return rule.training_upgrades.find((t) => t.primary) ?? rule.training_upgrades[0] ?? null
}

export function findCareerRouteStageRule(
  routeTitle?: string | null,
  currentTarget?: string | null,
  options?: { includeStubs?: boolean }
): CareerRouteStageRule | null {
  const title = (routeTitle || '').trim()
  if (!title && !currentTarget) return null
  const includeStubs = options?.includeStubs ?? false
  const pool = includeStubs
    ? careerRouteStageRules
    : careerRouteStageRules.filter((r) => r.implementation === 'full')

  return (
    pool.find((rule) => rule.matchRoute(title || currentTarget || '', currentTarget || undefined)) ??
    null
  )
}

export type ResolveCareerRouteStageInput = {
  routeTitle?: string | null
  currentTarget?: string | null
  nextUpgrade?: string | null
  stageOverride?: CareerRouteStageId | null
  upgradeTrainingStatus?: CourseInterestStatus | 'not_started' | null
  planItemStatuses?: Array<{ title: string; status: string }>
  cvCertificationTitles?: string[]
  /** When true, stub routes can resolve (CV summaries still empty until full). */
  includeStubs?: boolean
}

export function resolveUpgradeTrainingStatus(
  rule: CareerRouteStageRule,
  input: Pick<
    ResolveCareerRouteStageInput,
    'upgradeTrainingStatus' | 'planItemStatuses' | 'cvCertificationTitles'
  >
): TrainingMentionStatus {
  const primary = primaryTrainingUpgrade(rule)
  const match = primary?.match
  let best: TrainingMentionStatus = toTrainingMention(input.upgradeTrainingStatus)

  if (!match) return best

  for (const item of input.planItemStatuses ?? []) {
    if (!match.test(item.title)) continue
    best = rankStatus(best, statusFromPlanItem(item.status))
  }

  for (const title of input.cvCertificationTitles ?? []) {
    if (!match.test(title)) continue
    best = rankStatus(best, 'completed')
  }

  return best
}

/**
 * Resolve route stage for My Plan / CV Builder / Job Finder.
 * Full routes only by default so stubs do not drive CV copy until ready.
 */
export function resolveCareerRouteStage(
  input: ResolveCareerRouteStageInput
): ResolvedCareerRouteStage | null {
  const routeTitle = (input.routeTitle || '').trim()
  const rule = findCareerRouteStageRule(routeTitle, input.currentTarget, {
    includeStubs: input.includeStubs,
  })
  if (!rule) return null

  const primary = primaryTrainingUpgrade(rule)
  const primaryTrainingTitle = primary?.title || rule.training_upgrades[0]?.title || 'Recommended training'
  const trainingStatus = resolveUpgradeTrainingStatus(rule, input)

  const recommendedStage: CareerRouteStageId =
    trainingStatus === 'completed' ? 'after_training' : 'work_now'

  let activeStage: CareerRouteStageId = input.stageOverride || recommendedStage
  // Map legacy CV stage id
  if ((activeStage as string) === 'after_upgrade') activeStage = 'after_training'

  const stageConfig =
    activeStage === 'after_training'
      ? rule.cv_stages.after_training
      : activeStage === 'general'
        ? rule.cv_stages.general
        : rule.cv_stages.work_now

  const currentTarget =
    activeStage === 'after_training'
      ? input.nextUpgrade?.trim() || stageConfig.targetRole
      : input.currentTarget?.trim() || stageConfig.targetRole

  const nextUpgrade = input.nextUpgrade?.trim() || primaryTrainingTitle

  const qualificationSuggestions = rule.qualifications.map((q) => {
    let allowed = false
    let hint = 'Confirm completion before adding.'
    if (q.mode === 'always_optional') {
      allowed = true
      hint = 'Optional add.'
    } else if (q.mode === 'completed_only') {
      const completed =
        (input.planItemStatuses ?? []).some(
          (p) => q.match.test(p.title) && p.status.toLowerCase() === 'completed'
        ) || (input.cvCertificationTitles ?? []).some((t) => q.match.test(t))
      const isPrimaryUpgrade = primary?.match.test(q.label) || primary?.match.test(q.label)
      allowed =
        completed ||
        Boolean(isPrimaryUpgrade && trainingStatus === 'completed' && q.mode === 'completed_only')
      hint = allowed ? 'Confirmed completed — safe to add.' : 'Only add if you have completed this.'
    } else if (q.mode === 'in_progress_ok') {
      const inProgress =
        trainingStatus === 'in_progress' ||
        (input.planItemStatuses ?? []).some(
          (p) =>
            q.match.test(p.title) && ['in_progress', 'booked'].includes(p.status.toLowerCase())
        )
      allowed = inProgress
      hint = allowed
        ? 'Training in progress — can note on CV.'
        : 'Available when you book / start this course.'
    }
    return { ...q, allowed, hint }
  })

  const weeklyPlanSteps =
    rule.weekly_plan_steps?.({
      workNowRole: rule.work_now_roles[0] || currentTarget,
      primaryTrainingTitle,
      optionalAddon: rule.optional_addons[0],
    }) ?? []

  return {
    rule,
    routeTitle: routeTitle || rule.route_title,
    implementation: rule.implementation,
    trainingStatus,
    primaryTrainingTitle,
    recommendedStage,
    activeStage,
    currentTarget,
    nextUpgrade,
    jobSearchQuery: stageConfig.primaryJobQuery,
    stageLabel: stageConfig.stageLabel,
    afterTrainingButtonLabel: rule.cv_stages.after_training.buttonLabel,
    workNowButtonLabel: rule.cv_stages.work_now.buttonLabel,
    afterTrainingWarning: rule.cv_stages.after_training.warning ?? null,
    summaryTemplates: rule.summary_templates,
    skills: rule.skills,
    experienceBullets: rule.experience_bullets,
    qualificationSuggestions,
    workNowRoles: rule.work_now_roles,
    afterTrainingRoles: rule.after_training_roles,
    optionalAddons: rule.optional_addons,
    recommendedCourses: rule.recommended_courses,
    weeklyPlanSteps,
    analytics: rule.analytics,
  }
}
