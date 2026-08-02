'use client'

import type { ProfileActivityItem } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'

const TYPE_GLOW: Record<ProfileActivityItem['type'], string> = {
  cv: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]',
  job: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
  application: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  interview: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
  assessment: 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.6)]',
  profile: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]',
  general: 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]',
}

type Props = { items: ProfileActivityItem[] }

export default function ProfileActivityTimeline({ items }: Props) {
  return (
    <ProfileCard title="Career Journey" subtitle="Your progression inside JobAZ.">
      <ul className="relative ml-2 space-y-4 border-l border-gradient-to-b from-violet-500/30 to-cyan-500/20 pl-6 border-violet-500/25">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="relative animate-in fade-in duration-300"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span
              className={`absolute -left-[1.65rem] top-1 h-2.5 w-2.5 rounded-full ${TYPE_GLOW[item.type]}`}
            />
            <p className="text-sm text-slate-200">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.when}</p>
          </li>
        ))}
      </ul>
    </ProfileCard>
  )
}
