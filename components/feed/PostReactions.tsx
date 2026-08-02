'use client'

import { cn } from '@/lib/utils'
import { REACTION_META } from '@/lib/feed/reactions/constants'
import { REACTION_TYPES, totalReactions, type PostReactionCounts, type PostUserReactions, type ReactionType } from '@/lib/feed/reactions/types'

type Props = {
  counts: PostReactionCounts
  userReactions: PostUserReactions
  onToggle: (type: ReactionType) => void
  compact?: boolean
  disabled?: boolean
}

export default function PostReactions({ counts, userReactions, onToggle, compact, disabled }: Props) {
  const total = totalReactions(counts)

  return (
    <div className="space-y-2">
      {total > 0 && !compact && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
          {REACTION_TYPES.map((type) => {
            const n = counts[type]
            if (n === 0) return null
            const meta = REACTION_META[type]
            return (
              <span key={type} className="inline-flex items-center gap-1">
                <span>{meta.emoji}</span>
                <span className="text-slate-400">{n}</span>
                <span>{meta.shortLabel}</span>
              </span>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {REACTION_TYPES.map((type) => {
          const meta = REACTION_META[type]
          const count = counts[type]
          const active = userReactions[type]

          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(type)}
              title={meta.label}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                active
                  ? cn(meta.active, meta.glow, 'scale-[1.02]')
                  : 'border-slate-700/50 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200 hover:scale-[1.02]'
              )}
            >
              <span className="text-sm leading-none">{meta.emoji}</span>
              {count > 0 && <span className="tabular-nums">{count}</span>}
              {!compact && <span className="hidden sm:inline">{meta.shortLabel}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
