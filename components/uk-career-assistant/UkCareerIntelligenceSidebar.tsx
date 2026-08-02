'use client'

import Link from 'next/link'
import { ArrowRight, Brain, Sparkles, TrendingUp, Zap } from 'lucide-react'
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
  compact?: boolean
  employabilityScore?: number | null
  profileCompleteness?: number | null
  /**
   * When false, hide premature scores/pathways and show a learning placeholder.
   * Set true after enough answers or when a result exists.
   */
  intelligenceReady?: boolean
  /** Optional post-result summary chips */
  routeSummary?: {
    currentFocus?: string
    nextUpgrade?: string
    readinessScore?: number
  } | null
}

export default function UkCareerIntelligenceSidebar({
  intelligence,
  compact,
  employabilityScore,
  profileCompleteness,
  intelligenceReady = false,
  routeSummary = null,
}: Props) {
  const visibleMetrics = compact ? intelligence.metrics.slice(0, 5) : intelligence.metrics

  return (
    <aside
      className={cn(
        'uk-ca-panel rounded-2xl border border-violet-500/20 bg-slate-950/70 backdrop-blur-xl',
        'shadow-[0_0_40px_rgba(139,92,246,0.1)] overflow-hidden',
        compact ? 'p-4' : 'p-5 lg:sticky lg:top-6'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Brain className="w-4 h-4 text-violet-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Career Intelligence</h2>
          <p className="text-[10px] text-slate-500">
            {intelligenceReady ? 'Live guidance from your answers' : 'Listening while you answer'}
          </p>
        </div>
      </div>

      {!intelligenceReady ? (
        <div className="rounded-xl border border-dashed border-violet-500/25 bg-violet-950/15 px-3.5 py-4 space-y-2">
          <p className="text-xs font-medium text-violet-100/90">JAZ is learning your situation</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your score and suggested routes will appear after the assessment — nothing is invented
            early.
          </p>
          <div className="pt-1">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Session progress</span>
              <span className="text-violet-300/80 tabular-nums">{Math.min(intelligence.progress, 25)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500/70 to-cyan-400/70 transition-all duration-700"
                style={{ width: `${Math.min(intelligence.progress, 25)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {employabilityScore != null && employabilityScore > 0 && (
            <div className="mb-3 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-violet-300/80">
                JAZ employability
              </p>
              <p className="text-lg font-semibold text-violet-100 tabular-nums">
                {employabilityScore}/100
              </p>
              {profileCompleteness != null && (
                <p className="text-[10px] text-slate-500">Profile {profileCompleteness}% mapped</p>
              )}
            </div>
          )}

          {routeSummary && (
            <div className="mb-3 grid grid-cols-1 gap-2">
              {routeSummary.readinessScore != null && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-cyan-400/80">Readiness</p>
                  <p className="text-sm font-semibold text-cyan-100 tabular-nums">
                    {routeSummary.readinessScore}%
                  </p>
                </div>
              )}
              {routeSummary.currentFocus && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Current focus</p>
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {routeSummary.currentFocus}
                  </p>
                </div>
              )}
              {routeSummary.nextUpgrade && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Next upgrade</p>
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {routeSummary.nextUpgrade}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Session progress</span>
              <span className="text-violet-300 tabular-nums">{intelligence.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700 ease-out"
                style={{ width: `${intelligence.progress}%` }}
              />
            </div>
          </div>

          <div className="mb-4 p-3 rounded-xl border border-cyan-500/25 bg-cyan-950/20">
            <p className="text-[10px] uppercase tracking-wider text-cyan-400/80 mb-2">
              Suggested pathways
            </p>
            <div className="flex flex-wrap gap-1.5">
              {intelligence.potentialPaths.length > 0 ? (
                intelligence.potentialPaths.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-2 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-100/90"
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Building from your answers…</span>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto pr-1">
            {visibleMetrics.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-700/40 bg-slate-900/50 px-3 py-2.5 hover:border-violet-500/25 transition-colors duration-300"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{m.label}</span>
                  <span className="text-[10px] font-medium text-slate-200 text-right">{m.display}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={cn('h-full bg-gradient-to-r transition-all duration-700', TONE_BAR[m.tone])}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-950/20 mb-4">
            <p className="text-[10px] uppercase tracking-wider text-violet-400/90 flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3" />
              JAZ understanding
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">{intelligence.insightLine}</p>
          </div>

          <div className="p-3 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-900/50 mb-4">
            <p className="text-[10px] uppercase tracking-wider text-violet-300/90 flex items-center gap-1 mb-2">
              <Zap className="w-3 h-3" />
              Next smart move
            </p>
            <p className="text-sm font-medium text-slate-100">{intelligence.nextSmartMove.title}</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {intelligence.nextSmartMove.description}
            </p>
            {intelligence.nextSmartMove.href.startsWith('/') && (
              <Link
                href={intelligence.nextSmartMove.href}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200"
              >
                Go now <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {intelligence.detectedStrengths.length > 0 && (
            <div className="mb-4">
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
            <div className="mb-4">
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

          <p className="text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-800/80 pt-3">
            {intelligence.guidanceNote}
          </p>
        </>
      )}
    </aside>
  )
}
