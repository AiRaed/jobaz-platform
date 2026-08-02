'use client'

import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecommendedTrainingRoute } from '@/lib/career-hub/trainingPlan'
import { trainingRouteHref } from '@/lib/career-hub/trainingPlan'

type Props = {
  routes: RecommendedTrainingRoute[]
  caSessionId?: string | null
  className?: string
}

export default function RecommendedTrainingPlanPanel({ routes, caSessionId, className }: Props) {
  if (!routes.length) return null

  return (
    <section
      className={cn(
        'rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/25 via-slate-950/90 to-cyan-950/15 p-6 space-y-5',
        className
      )}
    >
      <div>
        <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-1">Your recommended training plan</p>
        <p className="text-sm text-slate-400">
          Top career routes matched to your assessment — open a training plan to see courses and licences.
        </p>
      </div>

      <div className="space-y-4">
        {routes.map((route) => (
          <div
            key={route.pathId}
            className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 hover:border-violet-500/35 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="text-xl" aria-hidden>
                    {route.icon}
                  </span>
                  {route.categoryLabel}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    Readiness:{' '}
                    <span className="text-violet-200 font-medium">{route.readinessPercent}%</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>
                    Recommended next step:{' '}
                    <span className="text-emerald-300/90">{route.nextStepLabel}</span>
                  </span>
                </div>
                <div className="mt-3 h-1.5 max-w-xs rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
                    style={{ width: `${route.readinessPercent}%` }}
                  />
                </div>
              </div>
              <Link
                href={trainingRouteHref(route.pathId, caSessionId)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition shrink-0"
              >
                <GraduationCap className="w-4 h-4" />
                View Training Plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
