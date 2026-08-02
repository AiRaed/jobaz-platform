'use client'

import type { JazPlanSource } from '@/lib/jaz-career-engine/attachJazToCareerResult'

type Props = {
  plan_source: JazPlanSource
  goal_path: string
  ai_provider?: string
  engine_version?: string
  matched_count?: number
}

/** Dev-only debug strip for Career Coach handoff. */
export default function JazPlanSourceBadge({
  plan_source,
  goal_path,
  ai_provider,
  engine_version,
  matched_count = 0,
}: Props) {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <p
      className="text-[10px] text-slate-500 px-1 font-mono"
      data-plan-source={plan_source}
      data-goal-path={goal_path}
    >
      plan_source: {plan_source} · goal: {goal_path}
      {ai_provider ? ` · ai: ${ai_provider}` : ''}
      {engine_version ? ` · ${engine_version}` : ''}
      {` · matched: ${matched_count}`}
    </p>
  )
}
