'use client'

import { RotateCcw, History } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  onContinue: () => void
  onStartFresh: () => void
  loading?: boolean
  className?: string
}

/** Optional previous-assessment controls — never auto-hydrates old analysis. */
export default function UkCareerPreviousAssessmentBanner({
  onContinue,
  onStartFresh,
  loading,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'mb-4 rounded-xl border border-slate-600/40 bg-slate-900/50 px-3.5 py-3 uk-ca-panel',
        'flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
        You have a previous Career Assistant assessment. Continue it, or start fresh — starting
        fresh only clears this assistant draft, not My Plan or your CV.
      </p>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button
          type="button"
          disabled={loading}
          onClick={onContinue}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-100 hover:bg-violet-500/20 disabled:opacity-50"
        >
          <History className="w-3.5 h-3.5" />
          Continue previous assessment
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onStartFresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start fresh
        </button>
      </div>
    </div>
  )
}
