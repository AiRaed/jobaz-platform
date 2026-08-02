'use client'

import type { WritingReviewReport } from '@/lib/proofreading/types'

type Props = {
  report: WritingReviewReport
}

export default function ReviewStrengthsPanel({ report }: Props) {
  if (!report.strengths.length && !report.areasToImprove.length) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {report.strengths.length > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300 mb-2">Strengths</p>
          <ul className="space-y-1.5">
            {report.strengths.map((s) => (
              <li key={s} className="text-xs text-slate-300 flex gap-2">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {report.areasToImprove.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-300 mb-2">Areas to improve</p>
          <ul className="space-y-1.5">
            {report.areasToImprove.map((a) => (
              <li key={a} className="text-xs text-slate-300 flex gap-2">
                <span className="text-amber-400 flex-shrink-0">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
