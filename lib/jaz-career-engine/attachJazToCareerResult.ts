/**
 * Attach JAZ Career Engine analyse output to any Career Engine path result.
 * Server-side only (calls analyseCareerGoal + inventory matching).
 */

import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { analyseCareerGoal } from './analyseCareerGoal'
import { buildJazInputForGoal } from './goalInput'
import { mapJazAnalyseToJobAZPlan } from './mapJazAnalyseToJobAZPlan'
import type { JazAnalyseResult } from './types'

export type JazPlanSource = 'jaz' | 'jaz_fallback' | 'legacy'

export type JazAttachedFields = {
  jaz_analyse: JazAnalyseResult | null
  jaz_jobaz_plan: JobAZPlan | null
  plan_source: JazPlanSource
}

export { buildJazInputForGoal } from './goalInput'

export async function attachJazToCareerResult(
  goalId: StrategicGoalId,
  answers: Record<string, unknown>
): Promise<JazAttachedFields> {
  const input = buildJazInputForGoal(goalId, answers)

  console.info('[jaz-attach] calling analyseCareerGoal', {
    goalId,
    goal: input.goal,
    skills: input.skills,
  })

  try {
    const analyse = await analyseCareerGoal(input, { goalPath: goalId })
    const plan = mapJazAnalyseToJobAZPlan(analyse, {
      pathId: goalId,
      coachNotes: analyse.why_this_route_fits,
    })
    const plan_source: JazPlanSource =
      analyse.ai_provider === 'ollama' ? 'jaz' : 'jaz_fallback'

    console.info('[jaz-attach] success', {
      goalId,
      plan_source,
      ai_provider: analyse.ai_provider,
      engine_version: analyse.engine_version,
      route_title: analyse.route_title,
      current_focus: analyse.current_focus,
      next_upgrade: analyse.next_upgrade,
      matched_count: analyse.matched_jobaz_courses.length,
    })

    return {
      jaz_analyse: analyse,
      jaz_jobaz_plan: plan,
      plan_source,
    }
  } catch (err) {
    console.error('[jaz-attach] failed — UI may use legacy', { goalId, err })
    return {
      jaz_analyse: null,
      jaz_jobaz_plan: null,
      plan_source: 'legacy',
    }
  }
}
