'use client'

import { Compass, TrendingUp } from 'lucide-react'
import type { CareerFocusItem } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'

type Props = { items: CareerFocusItem[] }

export default function ProfileCareerFocus({ items }: Props) {
  return (
    <ProfileCard
      title="Current Focus"
      subtitle="AI-generated priorities with estimated impact."
      action={<Compass className="w-4 h-4 text-cyan-400" />}
    >
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-start justify-between gap-2 text-sm rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2.5 hover:border-violet-500/25 transition"
          >
            <span className="text-slate-300 flex gap-2 min-w-0">
              <span className="text-violet-400 shrink-0">•</span>
              <span>{item.label}</span>
            </span>
            <span className="text-[10px] font-medium text-emerald-400/90 shrink-0 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {item.impact}
            </span>
          </li>
        ))}
      </ul>
    </ProfileCard>
  )
}
