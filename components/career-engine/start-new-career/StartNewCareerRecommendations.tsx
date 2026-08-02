'use client'

import { ArrowRight, Briefcase, GraduationCap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  CareerDiscoveryRecommendation,
  StartNewCareerRecommendationsResult,
} from '@/lib/career-engine/start-new-career/types'
import { resolveRouteCourseFallbacks } from '@/lib/dashboard/careerOs/routeCourseFallbacks'

type Props = {
  result: StartNewCareerRecommendationsResult
  onConfirmCareer: (sectorId: string) => void | Promise<void>
  confirming?: boolean
}

function CompactRecommendationCard({
  rec,
  index,
  onConfirm,
  confirming,
}: {
  rec: CareerDiscoveryRecommendation
  index: number
  onConfirm: () => void
  confirming?: boolean
}) {
  const workNow = rec.workNow.slice(0, 4)
  const trainingFromRec = [
    ...rec.courses.map((c) => ({ title: c.title, why: c.why || 'Supports this route.' })),
    ...rec.buildNext.map((b) => ({ title: b.title, why: b.why || 'Supports this route.' })),
  ]
  const training =
    trainingFromRec.length > 0
      ? trainingFromRec.slice(0, 3)
      : resolveRouteCourseFallbacks(rec.label, workNow[0], rec.timeline?.firstTargetRole).map(
          (f) => ({ title: f.title, why: f.why })
        )

  const currentFocus = workNow[0] || rec.timeline?.bridgeRole || rec.label
  const nextUpgrade =
    rec.timeline?.firstTargetRole ||
    training[0]?.title ||
    rec.careerProgression[1] ||
    rec.label

  return (
    <li className="rounded-2xl border border-violet-500/20 bg-slate-900/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-violet-400">Route #{index + 1}</span>
          <h4 className="text-base font-semibold text-slate-100 mt-0.5">{rec.label}</h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {rec.scoreReasons[0] ||
              `Start with ${currentFocus}, then build toward ${nextUpgrade}.`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-bold text-emerald-300 tabular-nums">
            {rec.matchScore}% match
          </span>
          <span className="text-[10px] text-slate-500 tabular-nums">
            Readiness {rec.readiness.score}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Current focus</p>
          <p className="text-xs font-medium text-slate-200 mt-0.5 truncate" title={currentFocus}>
            {currentFocus}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Next upgrade</p>
          <p className="text-xs font-medium text-slate-200 mt-0.5 truncate" title={nextUpgrade}>
            {nextUpgrade}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Work you can start now
          </p>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {workNow.map((job) => (
            <li
              key={job}
              className="px-2 py-1 rounded-md text-xs border border-emerald-500/25 bg-emerald-950/20 text-emerald-100"
            >
              {job}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Recommended training
          </p>
        </div>
        <ul className="space-y-1.5">
          {training.map((item) => (
            <li
              key={item.title}
              className="rounded-lg border border-cyan-500/15 bg-cyan-950/10 px-2.5 py-1.5"
            >
              <p className="text-xs font-medium text-slate-200">{item.title}</p>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.why}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Provider not listed yet</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-slate-500">
        This week: improve CV → apply to 3 starter roles → review training.
      </p>

      <button
        type="button"
        disabled={confirming}
        onClick={onConfirm}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
          confirming
            ? 'bg-slate-800 text-slate-500 cursor-wait'
            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
        )}
      >
        <Sparkles className="w-4 h-4" />
        Use this route
        <ArrowRight className="w-4 h-4" />
      </button>
    </li>
  )
}

export default function StartNewCareerRecommendationsView({
  result,
  onConfirmCareer,
  confirming,
}: Props) {
  return (
    <div className="space-y-4 max-w-xl">
      <section className="rounded-xl border border-cyan-500/25 bg-cyan-950/15 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Choose your new career route</h3>
        <p className="text-sm text-slate-300 leading-relaxed mt-2 line-clamp-3">
          {result.explorationSummary}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Short route cards — pick one to open your compact action plan.
        </p>
      </section>

      <ul className="space-y-4">
        {result.recommendations.map((rec, index) => (
          <CompactRecommendationCard
            key={rec.sectorId}
            rec={rec}
            index={index}
            confirming={confirming}
            onConfirm={() => onConfirmCareer(rec.sectorId)}
          />
        ))}
      </ul>
    </div>
  )
}
