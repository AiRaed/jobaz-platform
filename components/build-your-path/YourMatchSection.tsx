'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PathMatch } from '@/lib/build-your-path/types'

type Props = {
  match: PathMatch
  pathTitle: string
}

export default function YourMatchSection({ match, pathTitle }: Props) {
  return (
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/25 via-slate-950/60 to-cyan-950/15 p-5 md:p-6 shadow-[0_0_28px_rgba(139,92,246,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-lg font-bold text-slate-100">Your Match</h2>
          </div>
          <p className="text-xs text-slate-400">
            {match.hasPersonalization
              ? `How ${pathTitle} fits your profile`
              : 'General fit analysis â€” complete Career Assistant for deeper personalization'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
            {match.score}%
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Match score</p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
          style={{ width: `${match.score}%` }}
        />
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Estimated readiness: <span className="text-violet-300 font-medium">{match.readinessRange}</span>
      </p>

      <ul className="grid gap-2 sm:grid-cols-2">
        {match.signals.map((signal, idx) => (
          <li
            key={idx}
            className={cn(
              'flex items-start gap-2 text-sm rounded-lg px-3 py-2 border',
              signal.type === 'positive' && 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200/90',
              signal.type === 'warning' && 'border-amber-500/20 bg-amber-950/15 text-amber-200/90',
              signal.type === 'neutral' && 'border-slate-700/40 bg-slate-900/30 text-slate-300'
            )}
          >
            <span className="shrink-0 text-base leading-none">
              {signal.type === 'positive' ? 'âœ…' : signal.type === 'warning' ? 'âš ï¸' : 'â€¢'}
            </span>
            <span>{signal.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}



