'use client'

import { Brain, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LiveIntelligence } from '@/lib/uk-career-assistant/liveIntelligence'

const TONE_BAR: Record<string, string> = {
  violet: 'from-violet-500 to-purple-400',
  cyan: 'from-cyan-500 to-blue-400',
  emerald: 'from-emerald-500 to-teal-400',
  amber: 'from-amber-500 to-orange-400',
  blue: 'from-blue-500 to-indigo-400',
  rose: 'from-rose-500 to-pink-400',
}

type Props = {
  intelligence: LiveIntelligence
  employabilityScore?: number | null
  className?: string
}

/** Collapsed-by-default technical detail — not part of the main MVP result. */
export default function UkCareerExtraCoachDetail({
  intelligence,
  employabilityScore,
  className,
}: Props) {
  const metrics = intelligence.metrics.slice(0, 5)

  return (
    <div className={cn('space-y-4 pt-1', className)}>
      {employabilityScore != null && employabilityScore > 0 && (
        <div className="uk-ca-panel rounded-xl border border-violet-500/25 bg-violet-950/20 px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-wider text-violet-300/80 flex items-center gap-1.5">
            <Brain className="w-3 h-3" />
            Employability score
          </p>
          <p className="text-xl font-semibold text-violet-100 tabular-nums mt-1">
            {employabilityScore}
            <span className="text-sm text-slate-500 font-normal"> / 100</span>
          </p>
        </div>
      )}

      {metrics.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Readiness bars</p>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div
                key={m.id}
                className="uk-ca-panel rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{m.label}</span>
                  <span className="text-[10px] font-medium text-slate-300">{m.display}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={cn('h-full bg-gradient-to-r', TONE_BAR[m.tone] ?? TONE_BAR.violet)}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {intelligence.detectedStrengths.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
            Detected strengths
          </p>
          <ul className="space-y-1">
            {intelligence.detectedStrengths.map((s) => (
              <li key={s} className="text-[11px] text-emerald-300/90 flex gap-1.5">
                <TrendingUp className="w-3 h-3 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {intelligence.improvements.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Focus areas</p>
          <div className="flex flex-wrap gap-1.5">
            {intelligence.improvements.map((imp) => (
              <span
                key={imp}
                className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200/90"
              >
                {imp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
