'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Globe, Lock, Eye, Copy, ExternalLink, Check } from 'lucide-react'
import {
  VISIBILITY_OPTIONS,
  publicProfileUrl,
  type ProfileVisibility,
} from '@/lib/profile/storage'
import type { ProfilePrivacySettings, ProfileViewModel } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'

const ICONS = { private: Lock, public: Globe, recruiter: Eye } as const

type Props = {
  visibility: ProfileVisibility
  username: string
  privacy: ProfilePrivacySettings
  previewData: Pick<
    ProfileViewModel,
    'displayName' | 'careerDirection' | 'location' | 'careerDna' | 'extensions'
  >
  onVisibilityChange: (visibility: ProfileVisibility) => void
  onPrivacyChange: (privacy: Partial<ProfilePrivacySettings>) => void
  onUsernameChange: (username: string) => void
}

export default function ProfilePublicProfileSystem({
  visibility,
  username,
  privacy,
  previewData,
  onVisibilityChange,
  onPrivacyChange,
  onUsernameChange,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const publicUrl = publicProfileUrl(username)

  const copyLink = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(publicUrl)
    }
  }

  return (
    <ProfileCard title="Public identity" subtitle="Control visibility and sharing.">
      <div className="space-y-2 mb-4">
        {VISIBILITY_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.id]
          const active = visibility === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onVisibilityChange(opt.id)}
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
                  active ? 'border-violet-400 bg-violet-500/30' : 'border-slate-600'
                )}
              />
            </button>
          )
        })}
      </div>

      {(visibility === 'public' || visibility === 'recruiter') && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/60 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              placeholder="your-name"
            />
          </div>
          {publicUrl && (
            <div className="rounded-lg border border-dashed border-violet-500/30 bg-violet-950/20 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Public link</p>
              <p className="text-sm text-violet-300/90 mt-1 font-mono truncate">{publicUrl}</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-2">Live sharing coming soon — preview only.</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-slate-700/40">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Privacy controls</p>
        {(
          [
            ['hideEmail', 'Hide email'],
            ['hidePhone', 'Hide phone'],
            ['hideLocation', 'Hide location'],
            ['recruitersOnly', 'Show only to recruiters'],
            ['anonymousMode', 'Anonymous mode'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-2 py-1 cursor-pointer group">
            <span className="text-xs text-slate-400 group-hover:text-slate-300">{label}</span>
            <input
              type="checkbox"
              checked={privacy[key]}
              onChange={(e) => onPrivacyChange({ [key]: e.target.checked })}
              className="rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500/50"
            />
          </label>
        ))}
      </div>

      {showPreview && (
        <div className="mt-4 rounded-xl border border-slate-600/50 bg-slate-900/80 p-4">
          <p className="text-[10px] uppercase text-slate-500 mb-2">Public preview</p>
          <h3 className="text-lg font-bold text-white">
            {privacy.anonymousMode ? 'JobAZ Professional' : previewData.displayName}
          </h3>
          <p className="text-sm text-violet-300">{previewData.careerDirection}</p>
          {!privacy.hideLocation && (
            <p className="text-xs text-slate-400 mt-1">{previewData.location}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-3">
            {previewData.careerDna.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </ProfileCard>
  )
}
