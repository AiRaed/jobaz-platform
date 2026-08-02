'use client'

import Link from 'next/link'
import { ArrowRight, Compass, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCareerPlan } from '@/hooks/useCareerPlan'
import {
  courseDetailHref,
  getPrimaryPlanItem,
  getUnfinishedPlanCount,
  CAREER_HUB_HOME,
} from '@/lib/career-hub'

const STATUS_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  saved: 'Saved',
  interested: 'Interested',
  in_progress: 'In progress',
  completed: 'Completed',
}

export default function MyCareerPlanWidget() {
  const { items } = useCareerPlan()
  const primary = getPrimaryPlanItem()
  const unfinished = getUnfinishedPlanCount()
  const displayItems = items.slice(0, 5)

  if (!displayItems.length) {
    return (
      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
        <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-2">My Career Plan</p>
        <p className="text-sm text-slate-400 mb-4">
          Complete the UK Career Assistant or browse Career Hub to save courses and licences here.
        </p>
        <Link
          href={CAREER_HUB_HOME}
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          <Compass className="w-4 h-4" />
          Explore Career Hub
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    )
  }

  const continueHref = primary?.pathId
    ? courseDetailHref(primary.pathId, primary.courseSlug)
    : CAREER_HUB_HOME

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/20 via-slate-950/90 to-slate-900/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-1">My Career Plan</p>
          {unfinished > 0 && (
            <p className="text-xs text-slate-500">{unfinished} item{unfinished === 1 ? '' : 's'} waiting for you</p>
          )}
        </div>
        <Shield className="w-5 h-5 text-violet-400/60 shrink-0" />
      </div>

      <ul className="space-y-2">
        {displayItems.map((item) => (
          <li key={item.id}>
            <Link
              href={item.pathId ? courseDetailHref(item.pathId, item.courseSlug) : CAREER_HUB_HOME}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-700/40 bg-slate-900/50 hover:border-violet-500/30 transition"
            >
              <span className="text-sm text-slate-100 truncate">
                {item.icon} {item.courseName}
              </span>
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wide shrink-0 px-2 py-0.5 rounded-full border',
                  item.status === 'saved'
                    ? 'border-emerald-500/30 text-emerald-300 bg-emerald-950/30'
                    : item.status === 'interested'
                      ? 'border-cyan-500/30 text-cyan-300 bg-cyan-950/30'
                      : 'border-amber-500/30 text-amber-200 bg-amber-950/20'
                )}
              >
                {STATUS_LABELS[item.status] ?? item.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {primary && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-2">Continue your journey</p>
          <p className="text-sm text-slate-300 mb-3">
            Recommended next step: {primary.icon} View {primary.courseName} options
          </p>
          <Link
            href={continueHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <Link
        href={CAREER_HUB_HOME}
        className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-violet-300 transition"
      >
        Open full Career Hub
        <ArrowRight className="w-3 h-3" />
      </Link>
    </section>
  )
}
