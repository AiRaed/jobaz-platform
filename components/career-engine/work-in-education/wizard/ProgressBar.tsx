'use client'

import { cn } from '@/lib/utils'

type Props = {
  steps: Array<{ id: string; label: string }>
  currentIndex: number
  className?: string
}

export function ProgressBar({ steps, currentIndex, className }: Props) {
  const total = Math.max(steps.length, 1)
  const pct = Math.round(((currentIndex + 1) / total) * 100)

  return (
    <div className={cn('space-y-3', className)} aria-label="Assessment progress">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>
          Step {Math.min(currentIndex + 1, total)} of {total}
        </span>
        <span className="font-medium text-slate-300">{steps[currentIndex]?.label}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${steps[currentIndex]?.label ?? 'Progress'}, ${pct}%`}
      >
        <div
          className="h-full rounded-full bg-cyan-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="hidden gap-1 sm:flex" aria-hidden="true">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              i <= currentIndex ? 'bg-cyan-500/80' : 'bg-slate-800'
            )}
          />
        ))}
      </ol>
    </div>
  )
}
