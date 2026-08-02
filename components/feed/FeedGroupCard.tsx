'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { FeedGroup } from '@/lib/feed/types'

type Props = {
  group: FeedGroup
  onJoin: (id: string) => void | Promise<boolean | null>
  compact?: boolean
  joining?: boolean
}

export default function FeedGroupCard({ group, onJoin, compact, joining }: Props) {
  const activityColor =
    group.activityLevel === 'Very high' || group.activityLevel === 'Active now'
      ? 'text-emerald-400'
      : group.activityLevel === 'High'
        ? 'text-cyan-400'
        : 'text-slate-500'

  return (
    <li
      className={cn(
        'rounded-xl border border-slate-700/30 bg-slate-900/40 overflow-hidden',
        'hover:border-violet-500/25 hover:shadow-[0_0_16px_rgba(139,92,246,0.08)] transition-all'
      )}
    >
      {!compact && (
        <Link
          href={`/hubs/${group.slug}`}
          className="h-14 bg-gradient-to-r from-violet-950/50 via-slate-900 to-cyan-950/40 border-b border-slate-800/40 flex items-center px-3 gap-2 hover:from-violet-900/40 transition"
        >
          <span className="text-2xl">{group.icon}</span>
          <span className="text-[10px] text-slate-500">{group.category}</span>
        </Link>
      )}
      <div className={cn('p-3', compact && 'flex gap-3 items-start')}>
        {compact && (
          <Link href={`/hubs/${group.slug}`} className="text-xl shrink-0">
            {group.icon}
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/hubs/${group.slug}`} className="text-xs font-semibold text-slate-100 hover:text-violet-200">
            {group.name}
          </Link>
          {!compact && (
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{group.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[10px]">
            <span className="text-slate-600">{group.memberCount.toLocaleString()} members</span>
            <span className={cn('font-medium', activityColor)}>
              {group.activityLevel === 'Active now' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
              )}
              {group.activityLevel}
            </span>
            <span className="text-slate-700">· {group.postsToday} posts today</span>
          </div>
        </div>
        <button
          type="button"
          disabled={joining}
          onClick={() => void onJoin(group.id)}
          title={group.joined ? 'Click to leave circle' : undefined}
          className={cn(
            'text-[10px] px-2.5 py-1 rounded-md font-medium shrink-0 transition disabled:opacity-50',
            group.joined
              ? 'text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
              : 'text-violet-300 border border-violet-500/30 hover:bg-violet-500/10 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]'
          )}
        >
          {joining ? '…' : group.joined ? 'Joined' : 'Join Circle'}
        </button>
      </div>
    </li>
  )
}
