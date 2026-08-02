'use client'

import { cn } from '@/lib/utils'
import type { ProfileVisibility } from '@/lib/identity-profile/types'
import ProfileSection from './ProfileSection'

const OPTIONS: { id: ProfileVisibility; label: string; description: string }[] = [
  { id: 'private', label: 'Private', description: 'Only you can see your full profile.' },
  { id: 'recruiter', label: 'Recruiters', description: 'Visible to recruiters when you opt in.' },
  { id: 'public', label: 'Public', description: 'Shareable public profile link.' },
]

type Props = {
  value: ProfileVisibility
  disabled?: boolean
  onChange: (v: ProfileVisibility) => void
}

export default function ProfileVisibilityPanel({ value, disabled, onChange }: Props) {
  return (
    <ProfileSection title="Public visibility" subtitle="Who can discover your identity">
      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-left transition cursor-pointer disabled:opacity-50',
                active
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-slate-100'
                  : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600'
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs mt-0.5 opacity-80">{opt.description}</p>
            </button>
          )
        })}
      </div>
    </ProfileSection>
  )
}
