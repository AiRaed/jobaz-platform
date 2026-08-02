'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  items: string[]
  onAdd: (item: string) => void
  alreadyHas?: (item: string) => boolean
  className?: string
}

/** Compact chip list for plan-aware CV field suggestions. */
export default function CvPlanSuggestionChips({
  title,
  items,
  onAdd,
  alreadyHas,
  className,
}: Props) {
  if (!items.length) return null

  return (
    <div className={cn('rounded-lg border border-slate-700/50 bg-slate-950/30 p-3 space-y-2', className)}>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const exists = alreadyHas?.(item) ?? false
          return (
            <button
              key={item}
              type="button"
              disabled={exists}
              onClick={() => onAdd(item)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition',
                exists
                  ? 'border-emerald-500/30 text-emerald-400/80 cursor-default'
                  : 'border-slate-600/60 text-slate-300 hover:border-violet-400/50 hover:text-violet-200'
              )}
            >
              {!exists && <Plus className="w-3 h-3" />}
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}
