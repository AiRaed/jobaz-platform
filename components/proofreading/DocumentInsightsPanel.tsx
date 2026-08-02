'use client'

import type { DocumentInsight } from '@/lib/proofreading/types'

type Props = {
  insights: DocumentInsight[]
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 65) return 'bg-cyan-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

export default function DocumentInsightsPanel({ insights }: Props) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-cyan-300 font-medium">Document insights</p>
      {insights.map((insight) => (
        <div key={insight.id}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300">{insight.label}</span>
            <span className="text-slate-400 tabular-nums">{insight.score}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor(insight.score)}`}
              style={{ width: `${insight.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
