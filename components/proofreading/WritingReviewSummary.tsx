'use client'

import { cn } from '@/lib/utils'
import type { WritingReviewReport } from '@/lib/proofreading/types'

type Props = {
  report: WritingReviewReport
  className?: string
}

export default function WritingReviewSummary({ report, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-cyan-950/20 p-4 space-y-3',
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-violet-300 font-medium">Writing Review Summary</p>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{report.scoreLabel}</p>
          <p className="text-3xl font-semibold text-slate-50 tabular-nums">
            {report.score}
            <span className="text-lg text-slate-500 font-normal">/100</span>
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>After fixes</p>
          <p className="text-emerald-300 font-semibold text-lg tabular-nums">{report.estimatedScoreAfterFixes}/100</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-900/60 border border-slate-700/40 py-2">
          <p className="text-[10px] text-slate-500 uppercase">Issues</p>
          <p className="text-sm font-semibold text-slate-100">{report.issueCounts.total}</p>
        </div>
        <div className="rounded-lg bg-rose-950/30 border border-rose-500/20 py-2">
          <p className="text-[10px] text-rose-300/80 uppercase">Critical</p>
          <p className="text-sm font-semibold text-rose-200">{report.issueCounts.critical}</p>
        </div>
        <div className="rounded-lg bg-amber-950/20 border border-amber-500/20 py-2">
          <p className="text-[10px] text-amber-300/80 uppercase">Important</p>
          <p className="text-sm font-semibold text-amber-200">{report.issueCounts.important}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 text-center">Minor: {report.issueCounts.minor}</p>
    </div>
  )
}
