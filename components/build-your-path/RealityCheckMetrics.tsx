'use client'

import { AlertTriangle, Clock, Globe, Gauge, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RealityMetric } from '@/lib/build-your-path/types'

const ICONS: Record<string, typeof Gauge> = {
  difficulty: Gauge,
  english: Globe,
  fast: Zap,
  flex: Clock,
  stress: AlertTriangle,
}

type Props = {
  metrics: RealityMetric[]
  challenges: string[]
  commonMistakes: string[]
  timeToReady: string
}

function pillStyle(level: RealityMetric['level']) {
  if (level === 'high' || level === 'yes') return 'border-rose-500/30 bg-rose-950/25 text-rose-300'
  if (level === 'medium') return 'border-amber-500/30 bg-amber-950/20 text-amber-300'
  if (level === 'low' || level === 'no') return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
  return 'border-slate-600/40 bg-slate-900/40 text-slate-300'
}

export default function RealityCheckMetrics({ metrics, challenges, commonMistakes, timeToReady }: Props) {
  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-bold text-slate-200">Reality Check</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {metrics.map((m) => {
          const Icon = ICONS[m.id] ?? Gauge
          return (
            <div
              key={m.id}
              className={cn('inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium', pillStyle(m.level))}
            >
              <Icon className="w-3.5 h-3.5 opacity-80" />
              <span className="text-slate-400">{m.label}</span>
              <span>{m.display}</span>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Challenges</h3>
          <ul className="space-y-1.5">
            {challenges.map((c, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2">
                <span className="text-amber-400">â€¢</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Common mistakes</h3>
          <ul className="space-y-1.5">
            {commonMistakes.map((m, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2">
                <span className="text-amber-400">â€¢</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-violet-500/20 bg-violet-950/15 px-4 py-3">
        <p className="text-xs text-slate-500">Time to become job-ready</p>
        <p className="text-sm font-semibold text-violet-200 mt-0.5">{timeToReady}</p>
      </div>
    </section>
  )
}


