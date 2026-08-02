/**
 * CV Builder adapter — maps Career Route Stage Framework → CV suggestion UI.
 * Prefer adding new routes in `@/lib/career-routes`, not here.
 */

import {
  resolveCareerRouteStage,
  type ResolveCareerRouteStageInput,
  type CareerRouteStageId,
  type ResolvedCareerRouteStage,
} from '@/lib/career-routes'
import type {
  CvPlanStageId,
  CvRouteSuggestionRule,
  CvSummarySuggestionId,
  ResolvedCvSuggestions,
  ResolveCvSuggestionsInput,
  TrainingMentionStatus,
} from './types'

/** Legacy CV stage id ↔ framework stage id */
export function toCareerStageId(stage: CvPlanStageId | CareerRouteStageId | null | undefined): CareerRouteStageId | null {
  if (!stage) return null
  if (stage === 'after_upgrade') return 'after_training'
  return stage as CareerRouteStageId
}

export function toCvPlanStageId(stage: CareerRouteStageId): CvPlanStageId {
  if (stage === 'after_training') return 'after_upgrade'
  if (stage === 'general') return 'work_now' // general is summary-only; plan stage stays work_now
  return 'work_now'
}

function toCvSummaryId(id: CareerRouteStageId): CvSummarySuggestionId {
  if (id === 'after_training') return 'after_upgrade'
  if (id === 'general') return 'general'
  return 'work_now'
}

function adaptRule(resolved: ResolvedCareerRouteStage): CvRouteSuggestionRule {
  const rule = resolved.rule
  const primary = rule.training_upgrades.find((t) => t.primary) ?? rule.training_upgrades[0]
  return {
    id: rule.route_id,
    matchRoute: rule.matchRoute,
    routeLabel: rule.route_title,
    workNowTarget: rule.cv_stages.work_now.targetRole,
    afterUpgradeTarget: rule.cv_stages.after_training.targetRole,
    workNowSearchQuery: rule.cv_stages.work_now.primaryJobQuery,
    afterUpgradeSearchQuery: rule.cv_stages.after_training.primaryJobQuery,
    stageLabels: {
      work_now: rule.cv_stages.work_now.stageLabel,
      after_upgrade: rule.cv_stages.after_training.stageLabel,
    },
    upgradeTrainingMatch: primary?.match ?? /training/i,
    summarySuggestions: rule.summary_templates.map((t) => ({
      id: toCvSummaryId(t.id),
      buttonLabel: t.buttonLabel,
      helperText: t.helperText,
      requiresCompletedUpgrade: t.requiresCompletedUpgrade,
      warning: t.warning,
      buildSummary: (ctx) =>
        t.buildSummary({
          ...ctx,
          primaryTrainingTitle: resolved.primaryTrainingTitle,
        }),
    })),
    skills: rule.skills,
    experienceBullets: rule.experience_bullets,
    qualifications: rule.qualifications,
  }
}

export function resolveCvSuggestions(input: ResolveCvSuggestionsInput): ResolvedCvSuggestions | null {
  const stageOverride = toCareerStageId(input.stageOverride)
  const resolved = resolveCareerRouteStage({
    routeTitle: input.routeTitle,
    currentTarget: input.currentTarget,
    nextUpgrade: input.nextUpgrade,
    stageOverride,
    upgradeTrainingStatus: input.upgradeTrainingStatus,
    planItemStatuses: input.planItemStatuses,
    cvCertificationTitles: input.cvCertificationTitles,
    includeStubs: false,
  } satisfies ResolveCareerRouteStageInput)

  if (!resolved || resolved.implementation !== 'full') return null
  if (!resolved.summaryTemplates.length) return null

  const rule = adaptRule(resolved)

  return {
    rule,
    routeTitle: resolved.routeTitle,
    trainingStatus: resolved.trainingStatus as TrainingMentionStatus,
    recommendedStage: toCvPlanStageId(resolved.recommendedStage),
    activeStage: toCvPlanStageId(
      resolved.activeStage === 'general' ? 'work_now' : resolved.activeStage
    ),
    currentTarget: resolved.currentTarget,
    nextUpgrade: resolved.nextUpgrade,
    jobSearchQuery: resolved.jobSearchQuery,
    stageLabel: resolved.stageLabel,
    summarySuggestions: rule.summarySuggestions,
    skills: resolved.skills,
    experienceBullets: resolved.experienceBullets,
    qualificationSuggestions: resolved.qualificationSuggestions,
    // Framework extras for UI
    afterTrainingButtonLabel: resolved.afterTrainingButtonLabel,
    workNowButtonLabel: resolved.workNowButtonLabel,
    afterTrainingWarning: resolved.afterTrainingWarning,
    routeAnalyticsKey: resolved.analytics.route_key,
    primaryTrainingTitle: resolved.primaryTrainingTitle,
  }
}

export function findCvSuggestionRule(routeTitle?: string | null, currentTarget?: string | null) {
  const resolved = resolveCareerRouteStage({
    routeTitle,
    currentTarget,
    includeStubs: false,
  })
  if (!resolved || resolved.implementation !== 'full') return null
  return adaptRule(resolved)
}

export function resolveUpgradeTrainingStatus(
  rule: CvRouteSuggestionRule,
  input: ResolveCvSuggestionsInput
): TrainingMentionStatus {
  // Delegate via framework using rule id match
  const resolved = resolveCareerRouteStage({
    routeTitle: rule.routeLabel,
    currentTarget: rule.workNowTarget,
    upgradeTrainingStatus: input.upgradeTrainingStatus,
    planItemStatuses: input.planItemStatuses,
    cvCertificationTitles: input.cvCertificationTitles,
  })
  return (resolved?.trainingStatus ?? 'none') as TrainingMentionStatus
}
