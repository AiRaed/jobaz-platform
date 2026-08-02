'use client'

import Link from 'next/link'
import { ArrowRight, Compass, Target } from 'lucide-react'
import { careerHubPathHref } from '@/lib/career-hub/myPlan'
type ProfilePlanSummary = {
  routeLabel: string
  targetRole: string
  routePathId: string | null
}

type Props = {
  plan: ProfilePlanSummary | null
  careerGoal?: string | null
}

export default function ProfileCareerPlanSection({ plan, careerGoal }: Props) {
  if (!plan) {
    return (
      <section className="rounded-2xl border border-dashed border-violet-500/25 bg-violet-950/10 p-6">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-2">Career plan</h2>
        <p className="text-sm text-slate-400 mb-4">
          Complete the UK Career Assistant to generate your route and target role.
        </p>
        <Link
          href="/uk-career-assistant"
          className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200"
        >
          Start assessment
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Career plan</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-violet-400" />
            Career goal
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">{careerGoal?.trim() || plan.targetRole}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Current route
          </p>
          <p className="text-sm font-medium text-slate-100">{plan.routeLabel}</p>
          <p className="text-xs text-slate-500 mt-1">Target: {plan.targetRole}</p>
          {plan.routePathId && (
            <Link
              href={careerHubPathHref(plan.routePathId)}
              className="inline-flex items-center gap-1 text-xs text-violet-400 mt-3 hover:text-violet-300"
            >
              Open in Career Hub
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
