'use client'

import { confidenceLabel } from '@/lib/career-engine/work-in-education/wizard'
import { cn } from '@/lib/utils'

type Props = {
  headline: string
  matchedLabel: string
  confidence: number
  needsClarification: boolean
  summaryLines?: string[]
}

export function ResultHeader({
  headline,
  matchedLabel,
  confidence,
  needsClarification,
  summaryLines = [],
}: Props) {
  const conf = confidenceLabel({
    needs_clarification: needsClarification,
    confidence,
  })

  return (
    <header className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-7">
      <p className="text-xs font-medium uppercase tracking-wider text-cyan-300/80">
        Your qualification matches
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
        {matchedLabel || 'Your pathway'}
      </h1>
      <p className="mt-2 text-sm text-slate-400">{headline}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            conf === 'High' && 'bg-emerald-900/50 text-emerald-200',
            conf === 'Medium' && 'bg-sky-900/50 text-sky-200',
            conf === 'Needs clarification' && 'bg-amber-900/50 text-amber-100'
          )}
        >
          Confidence: {conf}
        </span>
      </div>
      {summaryLines.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {summaryLines.map((line) => (
            <li key={line} className="text-sm text-slate-300">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  )
}
