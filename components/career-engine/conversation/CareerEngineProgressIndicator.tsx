'use client'

import { cn } from '@/lib/utils'

type Props = {
  progress: number
  label: string
  className?: string
}

export default function CareerEngineProgressIndicator({ progress, label, className }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)))
  const filled = Math.round(pct / 12.5)

  return (
    <div
      className={cn(
        'rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-3 backdrop-blur-sm',
        'shadow-[0_0_24px_rgba(139,92,246,0.08)]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-violet-300/90">Career Brain</p>
        <span className="text-[10px] tabular-nums font-semibold text-violet-200/80">{pct}%</span>
      </div>
      <p className="text-xs text-slate-400 mb-2.5">{label}</p>
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 flex-1 rounded-sm transition-all duration-700',
              i < filled
                ? 'bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                : 'bg-slate-800/80'
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function progressLabelForStep(step: number, total: number): string {
  const ratio = total > 0 ? step / total : 0
  if (ratio < 0.35) return 'Learning about your profile…'
  if (ratio < 0.75) return 'Analysing UK requirements…'
  return 'Building your roadmap…'
}
