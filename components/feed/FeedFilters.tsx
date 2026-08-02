'use client'

import { cn } from '@/lib/utils'
import type { FeedFilter } from '@/lib/feed/types'

/** Phase 1 public tabs — post_type filters only (no following / circles). */
const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All Pulse' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'projects', label: 'Projects' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'help', label: 'Help' },
  { id: 'career_tips', label: 'Career Tips' },
  { id: 'courses', label: 'Courses' },
  { id: 'success_stories', label: 'Success Stories' },
]

type Props = {
  active: FeedFilter
  onChange: (f: FeedFilter) => void
}

export default function FeedFilters({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
            active === f.id
              ? 'bg-violet-600/90 text-white border border-violet-400/50 shadow-[0_0_12px_rgba(139,92,246,0.35)]'
              : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:border-violet-500/30 hover:text-slate-200'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
