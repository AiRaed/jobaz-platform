'use client'

import { cn } from '@/lib/utils'
import { PROFILE_TYPE_OPTIONS, type ProfileType } from '@/lib/identity-profile/types'
import ProfileSection from './ProfileSection'

type Props = {
  value: ProfileType
  disabled?: boolean
  onChange: (type: ProfileType) => void
}

export default function ProfileTypeToggle({ value, disabled, onChange }: Props) {
  return (
    <ProfileSection title="Identity type" subtitle="Personal career or small business presence">
      <div className="grid gap-2 sm:grid-cols-2">
        {PROFILE_TYPE_OPTIONS.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition cursor-pointer disabled:opacity-50',
                active
                  ? 'border-violet-500/50 bg-violet-500/10 text-slate-100'
                  : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600'
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs mt-1 opacity-80">{opt.description}</p>
            </button>
          )
        })}
      </div>
    </ProfileSection>
  )
}
