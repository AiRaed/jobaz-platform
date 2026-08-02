/**
 * Client helper: prefer JAZ JobAZPlan over legacy mapped plan.
 */

import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazAnalyseResult } from './types'
import type { JazPlanSource } from './attachJazToCareerResult'

export type PreferJazPlanInput = {
  goalPath: string
  jazPlan?: JobAZPlan | null
  jazAnalyse?: JazAnalyseResult | null
  planSource?: JazPlanSource | null
  legacyPlan: JobAZPlan | null
}

export type PreferJazPlanOutput = {
  plan: JobAZPlan | null
  plan_source: JazPlanSource
  ai_provider?: string
  engine_version?: string
  matched_count: number
}

export function preferJazOrLegacyPlan(input: PreferJazPlanInput): PreferJazPlanOutput {
  if (input.jazPlan?.version === 1) {
    const source: JazPlanSource =
      input.planSource === 'jaz' || input.jazAnalyse?.ai_provider === 'ollama'
        ? 'jaz'
        : input.planSource === 'jaz_fallback' || input.jazAnalyse?.ai_provider === 'fallback'
          ? 'jaz_fallback'
          : 'jaz_fallback'

    const out: PreferJazPlanOutput = {
      plan: input.jazPlan,
      plan_source: source,
      ai_provider: input.jazAnalyse?.ai_provider,
      engine_version: input.jazAnalyse?.engine_version,
      matched_count: input.jazAnalyse?.matched_jobaz_courses?.length ?? input.jazPlan.structured_cards?.length ?? 0,
    }

    console.info('[preferJazOrLegacyPlan]', {
      goal_path: input.goalPath,
      plan_source: out.plan_source,
      ai_provider: out.ai_provider,
      engine_version: out.engine_version,
      matched_jobaz_courses: out.matched_count,
      route: input.jazPlan.route_summary.route_title,
      current_focus: input.jazPlan.route_summary.current_target_role,
      next_upgrade: input.jazPlan.route_summary.next_upgrade_role,
    })

    return out
  }

  console.info('[preferJazOrLegacyPlan]', {
    goal_path: input.goalPath,
    plan_source: 'legacy',
    route: input.legacyPlan?.route_summary.route_title,
  })

  return {
    plan: input.legacyPlan,
    plan_source: 'legacy',
    matched_count: input.legacyPlan?.structured_cards?.length ?? 0,
  }
}
