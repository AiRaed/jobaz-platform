'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { CvHealthMetric } from '@/lib/cv-optimization'
import { Activity, ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  overallScore: number
  metrics: CvHealthMetric[]
  scoreDelta?: number | null
  /** Estimated readiness after recommended improvements */
  potentialScore?: number | null
  /** Shared readiness missing checklist (Documents-aligned) */
  missingItems?: string[]
  statusLabel?: string | null
}

function toneClasses(tone: CvHealthMetric['tone']) {
  if (tone === 'good')
    return {
      text: 'text-emerald-400',
      bar: 'from-emerald-500 to-cyan-400',
      glow: 'border-emerald-500/30',
    }
  if (tone === 'medium')
    return {
      text: 'text-amber-400',
      bar: 'from-amber-500 to-orange-400',
      glow: 'border-amber-500/30',
    }
  if (tone === 'low')
    return {
      text: 'text-rose-400',
      bar: 'from-rose-500 to-red-400',
      glow: 'border-rose-500/30',
    }
  return {
    text: 'text-slate-300',
    bar: 'from-slate-500 to-slate-400',
    glow: 'border-slate-600/40',
  }
}

function MetricCard({ metric }: { metric: CvHealthMetric }) {
  const tone = toneClasses(metric.tone)
  const hasProgress = typeof metric.progress === 'number'

  return (
    <div
      title={metric.tooltip}
      className={cn(
        'rounded-md border bg-slate-900/60 px-2 py-1.5',
        tone.glow
      )}
    >
      <p className="text-[9px] uppercase tracking-wider text-slate-500 truncate">{metric.label}</p>
      <p className={cn('text-xs font-bold tabular-nums mt-0.5 truncate', tone.text)}>{metric.display}</p>
      {hasProgress && (
        <div className="mt-1 h-0.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={cn('h-full bg-gradient-to-r transition-all duration-700 ease-out', tone.bar)}
            style={{ width: `${metric.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

/** Dense CV Readiness card — Current + Potential on one row, compact metrics. */
export default function CvHealthPanel({
  overallScore,
  metrics,
  scoreDelta,
  potentialScore,
  missingItems = [],
  statusLabel,
}: Props) {
  const [missingOpen, setMissingOpen] = useState(false)
  const scoreTone =
    overallScore >= 70 ? 'text-emerald-400' : overallScore >= 45 ? 'text-amber-400' : 'text-rose-400'

  const compactMetrics = metrics.filter((m) => m.id !== 'score' && m.id !== 'missing')
  const showPotential =
    typeof potentialScore === 'number' &&
    potentialScore > overallScore &&
    potentialScore - overallScore >= 2

  const visibleMissing = missingOpen ? missingItems.slice(0, 6) : missingItems.slice(0, 2)
  const hasMoreMissing = missingItems.length > 2

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/70 shadow-[0_8px_24px_rgba(15,23,42,0.55)] backdrop-blur overflow-hidden">
      <div className="px-2.5 py-2 border-b border-slate-700/40 bg-gradient-to-r from-violet-950/30 to-slate-950/80 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-semibold text-slate-200 leading-none">CV Readiness</h3>
          <p className="text-[9px] text-slate-500 mt-0.5 truncate">
            {statusLabel || 'Same score as Documents'}
          </p>
        </div>
        <div className="flex items-baseline gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-wider text-slate-500 leading-none">Current</p>
            <p className={cn('text-lg font-bold tabular-nums leading-none mt-0.5', scoreTone)}>
              {overallScore}%
            </p>
            {scoreDelta !== null && scoreDelta !== undefined && scoreDelta !== 0 && (
              <p
                className={cn(
                  'text-[9px] font-semibold',
                  scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {scoreDelta > 0 ? '+' : ''}
                {scoreDelta}
              </p>
            )}
          </div>
          {showPotential && (
            <div className="text-right border-l border-slate-700/60 pl-3">
              <p className="text-[8px] uppercase tracking-wider text-emerald-400/80 leading-none">
                Potential
              </p>
              <p className="text-lg font-bold text-emerald-300 tabular-nums leading-none mt-0.5">
                {potentialScore}%
              </p>
            </div>
          )}
        </div>
      </div>

      {missingItems.length > 0 && (
        <div className="px-2.5 py-1.5 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setMissingOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <p className="text-[9px] uppercase tracking-wider text-slate-500">
              Missing ({missingItems.length})
            </p>
            {hasMoreMissing &&
              (missingOpen ? (
                <ChevronUp className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              ))}
          </button>
          <ul className="mt-1 space-y-0.5">
            {visibleMissing.map((item) => (
              <li
                key={item}
                className="text-[10px] text-slate-400 flex items-start gap-1 before:content-['•'] before:text-amber-400/80"
              >
                <span className="truncate">{item}</span>
              </li>
            ))}
          </ul>
          {!missingOpen && hasMoreMissing && (
            <p className="text-[9px] text-slate-600 mt-0.5">+{missingItems.length - 2} more</p>
          )}
        </div>
      )}

      <div className="p-2 grid grid-cols-3 gap-1.5">
        {compactMetrics.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
    </section>
  )
}
