'use client'

import { Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROFILE_TYPE_OPTIONS, type ProfileType } from '@/lib/identity-profile/types'

type Props = {
  value: ProfileType
  disabled?: boolean
  onChange: (type: ProfileType) => void
}

export default function ProfileTypeSelector({ value, disabled, onChange }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {PROFILE_TYPE_OPTIONS.map((opt) => {
        const active = value === opt.id
        const Icon = opt.id === 'business' ? Building2 : User
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              'text-left rounded-2xl border p-4 transition-all duration-300',
              active
                ? 'border-violet-400/50 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.15)]'
                : 'border-slate-700/50 bg-slate-950/40 hover:border-slate-600/60',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-5 h-5', active ? 'text-violet-300' : 'text-slate-500')} />
              <span className={cn('font-semibold text-sm', active ? 'text-violet-100' : 'text-slate-300')}>
                {opt.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{opt.description}</p>
          </button>
        )
      })}
    </div>
  )
}
