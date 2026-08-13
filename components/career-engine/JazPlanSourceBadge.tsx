'use client'

import type { JazPlanSource } from '@/lib/jaz-career-engine/attachJazToCareerResult'

type Props = {
  plan_source: JazPlanSource
  goal_path: string
  ai_provider?: string
  engine_version?: string
  matched_count?: number
}

/** Dev-only debug strip for Career Coach handoff — collapsed, never inline in public cards. */
export default function JazPlanSourceBadge({
  plan_source,
  goal_path,
  ai_provider,
  engine_version,
  matched_count = 0,
}: Props) {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <details className="rounded-lg border border-dashed border-slate-700/80 bg-slate-950/40 px-2 py-1.5">
      <summary className="cursor-pointer select-none text-[10px] font-medium text-slate-500">
        Dev debug
      </summary>
      <p
        className="mt-1 text-[10px] text-slate-500 font-mono"
        data-plan-source={plan_source}
        data-goal-path={goal_path}
      >
        plan_source: {plan_source} · goal: {goal_path}
        {ai_provider ? ` · ai: ${ai_provider}` : ''}
        {engine_version ? ` · ${engine_version}` : ''}
        {` · matched: ${matched_count}`}
      </p>
    </details>
  )
}
