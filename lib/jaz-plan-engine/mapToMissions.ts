/**
 * Map JAZ Plan Engine actions → existing MissionItem UI shape.
 */

import type { MissionItem } from '@/lib/career-journey/actionPlanTypes'
import type { PlanNextAction } from '@/lib/dashboard/careerOs/types'
import type { JazPlanAction, JazActionPlanResult } from './types'

export function jazActionsToMissions(actions: JazPlanAction[]): MissionItem[] {
  return actions.slice(0, 5).map((a) => ({
    id: a.id,
    label: a.title,
    href: a.cta_target || '#this-weeks-plan',
    completed: a.status === 'done',
    status:
      a.status === 'skipped'
        ? 'not_started'
        : a.status === 'done'
          ? 'done'
          : a.status === 'in_progress'
            ? 'in_progress'
            : 'not_started',
    optional: a.priority === 'optional',
    actionLabel: a.cta_label,
    locked: false,
  }))
}

export function jazNextBestToPlanNextAction(
  action: JazPlanAction | null | undefined,
  fallback?: PlanNextAction
): PlanNextAction {
  if (!action) {
    return (
      fallback || {
        priority: 'Continue your plan',
        buttonLabel: 'Open First Action Plan',
        href: '#this-weeks-plan',
      }
    )
  }
  return {
    priority: action.why_it_matters || action.title,
    buttonLabel: action.cta_label || 'Continue',
    href: action.cta_target || '#this-weeks-plan',
  }
}

export function summarizeJazPlanForUi(plan: JazActionPlanResult) {
  return {
    missions: jazActionsToMissions(plan.this_week_actions),
    nextAction: jazNextBestToPlanNextAction(plan.next_best_action),
    progress: plan.progress_summary,
    planSource: plan.plan_source,
    actionPlanId: plan.action_plan_id || null,
  }
}
