/**
 * Weekly AI action plan — delegates to the central intelligence engine.
 */

import { generateWeeklyPlan } from '@/lib/jobaz-ai/engine/generateWeeklyPlan'
import type { AiUserProfile } from './types'
import type { AiActionPlan } from './types'

/** Builds a 3–5 task weekly plan from live profile state (rule-based only). */
export function generateAiActionPlan(profile: AiUserProfile): AiActionPlan {
  const plan = generateWeeklyPlan(profile)
  return {
    title: plan.title,
    summary: plan.summary,
    weeklyTasks: plan.weeklyTasks.map((t) => ({
      label: t.label,
      toolName: t.toolName,
      route: t.route,
      priority: t.priority,
      estimatedMinutes: t.estimatedMinutes,
    })),
  }
}
