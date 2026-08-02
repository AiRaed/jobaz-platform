'use client'

import type { ProfileCompletion } from '@/lib/identity-profile/types'
import ProfileSection from './ProfileSection'

type Props = { completion: ProfileCompletion }

export default function ProfileStrength({ completion }: Props) {
  return (
    <ProfileSection title="Career identity strength" subtitle={completion.nextStep}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-3xl font-bold text-cyan-300">{completion.percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
        {completion.items.slice(0, 6).map((item) => (
          <li key={item.id} className={item.done ? 'line-through opacity-60' : ''}>
            {item.done ? '✓' : '○'} {item.label}
          </li>
        ))}
      </ul>
    </ProfileSection>
  )
}
