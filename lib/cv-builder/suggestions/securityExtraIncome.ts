/**
 * @deprecated Import from `@/lib/career-routes` instead.
 * Kept so existing imports of securityExtraIncomeRule / cvSuggestionRules keep working.
 */

import { securityExtraIncomeRoute, fullCareerRouteStageRules } from '@/lib/career-routes'
import type { CvRouteSuggestionRule } from './types'

function adapt(rule: typeof securityExtraIncomeRoute): CvRouteSuggestionRule {
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
      id: t.id === 'after_training' ? 'after_upgrade' : t.id === 'general' ? 'general' : 'work_now',
      buttonLabel: t.buttonLabel,
      helperText: t.helperText,
      requiresCompletedUpgrade: t.requiresCompletedUpgrade,
      warning: t.warning,
      buildSummary: (ctx) =>
        t.buildSummary({
          ...ctx,
          primaryTrainingTitle: primary?.title ?? 'Recommended training',
        }),
    })),
    skills: rule.skills,
    experienceBullets: rule.experience_bullets,
    qualifications: rule.qualifications,
  }
}

export const securityExtraIncomeRule = adapt(securityExtraIncomeRoute)

/** Full CV-ready rules only (stubs excluded). */
export const cvSuggestionRules: CvRouteSuggestionRule[] = fullCareerRouteStageRules.map(adapt)
