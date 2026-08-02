'use client'

import { cn } from '@/lib/utils'

type Props = {
  options: Array<{ value: string; label: string }>
  onSelect: (value: string, label: string) => void
  disabled?: boolean
  variant?: 'chips' | 'cards'
}

export default function CareerEngineOptionChips({
  options,
  onSelect,
  disabled,
  variant = 'chips',
}: Props) {
  if (variant === 'cards') {
    return (
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(opt.value, opt.label)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200',
              'border-slate-700/50 bg-slate-900/60 text-slate-200',
              'hover:border-violet-500/40 hover:bg-violet-950/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
              'disabled:opacity-40 disabled:pointer-events-none'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt.value, opt.label)}
          className={cn(
            'px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200',
            'border-slate-600/40 bg-slate-900/70 text-slate-200',
            'hover:border-violet-500/45 hover:bg-violet-950/40 hover:text-violet-100',
            'hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:-translate-y-0.5',
            'disabled:opacity-40 disabled:pointer-events-none disabled:hover:translate-y-0'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
