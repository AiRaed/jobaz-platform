'use client'

import { cn } from '@/lib/utils'
import { Globe, Lock, Eye } from 'lucide-react'
import {
  VISIBILITY_OPTIONS,
  publicProfileUrl,
  type ProfileVisibility,
} from '@/lib/profile/storage'
import ProfileCard from './ProfileCard'

const ICONS = {
  private: Lock,
  public: Globe,
  recruiter: Eye,
} as const

type Props = {
  visibility: ProfileVisibility
  username: string
  onChange: (visibility: ProfileVisibility) => void
}

export default function ProfileVisibilitySettings({ visibility, username, onChange }: Props) {
  const publicUrl = publicProfileUrl(username)

  return (
    <ProfileCard title="Identity visibility" subtitle="Choose who can view your professional identity.">
      <div className="space-y-2">
        {VISIBILITY_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.id]
          const active = visibility === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                'w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition',
                active
                  ? 'border-violet-500/50 bg-violet-500/10 shadow-[0_0_16px_rgba(139,92,246,0.15)]'
                  : 'border-slate-700/50 bg-slate-900/30 hover:border-slate-600/60'
              )}
            >
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', active ? 'text-violet-400' : 'text-slate-500')} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', active ? 'text-slate-100' : 'text-slate-300')}>
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
              </div>
              <span
                className={cn(
                  'h-4 w-4 rounded-full border shrink-0 mt-0.5',
                  active ? 'border-violet-400 bg-violet-500/30 shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'border-slate-600'
                )}
              />
            </button>
          )
        })}
      </div>

      {visibility === 'public' && publicUrl && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-600/60 bg-slate-900/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Future public URL</p>
          <p className="text-sm text-violet-300/90 mt-1 font-mono">{publicUrl}</p>
          <p className="text-[11px] text-slate-500 mt-1">Sharing will be enabled in a future update.</p>
        </div>
      )}
    </ProfileCard>
  )
}
