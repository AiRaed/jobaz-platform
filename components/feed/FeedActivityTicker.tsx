'use client'

import { Activity, Radio } from 'lucide-react'

const ACTIVITY = [
  'Ahmed just got a warehouse interview',
  'Maya passed Google IT Support cert',
  '12 new members joined today',
  'Free course in Manchester — interpreting',
  'Sara asked about Newcastle jobs',
]

export default function FeedActivityTicker() {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 px-3 py-2 overflow-hidden">
      <div className="flex items-center gap-2 mb-1.5">
        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-cyan-400/90 font-medium">
          JobAZ Career Team
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-none text-[11px] text-slate-400 whitespace-nowrap">
        {ACTIVITY.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 shrink-0">
            <Activity className="w-3 h-3 text-violet-400/60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
