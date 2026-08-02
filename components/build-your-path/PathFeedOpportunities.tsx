'use client'

import { BookOpen, Calendar, Megaphone, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedOpportunity } from '@/lib/build-your-path/types'

const TYPE_CONFIG = {
  course: { icon: BookOpen, label: 'Course', style: 'text-cyan-400 border-cyan-500/25 bg-cyan-950/20' },
  event: { icon: Calendar, label: 'Event', style: 'text-violet-400 border-violet-500/25 bg-violet-950/20' },
  story: { icon: Sparkles, label: 'Story', style: 'text-emerald-400 border-emerald-500/25 bg-emerald-950/20' },
  funding: { icon: Megaphone, label: 'Funding', style: 'text-amber-400 border-amber-500/25 bg-amber-950/20' },
}

type Props = { items: FeedOpportunity[] }

/** Mock Pulse items — structured for future JobAZ Pulse API */
export default function PathFeedOpportunities({ items }: Props) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
      <h2 className="text-lg font-bold text-slate-200 mb-1">Latest opportunities & stories</h2>
      <p className="text-xs text-slate-500 mb-4">
        Community updates — will connect to JobAZ Pulse
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const config = TYPE_CONFIG[item.type]
          const Icon = config.icon
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-slate-800/50 bg-slate-900/30 p-3 hover:border-violet-500/20 transition cursor-default"
            >
              <span className={cn('shrink-0 p-1.5 rounded-lg border', config.style)}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className={cn('text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded border', config.style)}>
                    {config.label}
                  </span>
                  {item.timeAgo && <span className="text-[10px] text-slate-600">{item.timeAgo}</span>}
                </div>
                <p className="text-sm text-slate-200 font-medium">{item.title}</p>
                {item.location && <p className="text-[11px] text-slate-500 mt-0.5">{item.location}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

