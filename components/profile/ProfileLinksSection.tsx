'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Github, Globe, Languages, Link2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus } from '@/lib/profile/types'
import { AVAILABILITY_OPTIONS } from '@/lib/profile/storage'
import ProfileCard from './ProfileCard'
import {
  ProfileEditActions,
  ProfileEmptyState,
  ProfileSavedToast,
  formatLinkDisplay,
  normalizeUrl,
  useSectionEditor,
} from './profileSectionUx'

export type ProfileLinksData = {
  linkedinUrl: string
  portfolioUrl: string
  githubUrl: string
  languagesSpoken: string
  careerDirection: string
  availabilityStatus: AvailabilityStatus
}

type Props = {
  data: ProfileLinksData
  onSave: (data: ProfileLinksData) => void | Promise<void>
}

type LinkKey = 'linkedinUrl' | 'portfolioUrl' | 'githubUrl'

const LINK_META: Record<
  LinkKey,
  { label: string; icon: typeof Link2; emoji: string }
> = {
  linkedinUrl: { label: 'LinkedIn', icon: Link2, emoji: '🔗' },
  portfolioUrl: { label: 'Portfolio', icon: Globe, emoji: '💼' },
  githubUrl: { label: 'GitHub', icon: Github, emoji: '💻' },
}

function availabilityStyle(status: AvailabilityStatus) {
  if (status === 'Open to opportunities') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
  if (status === 'Interviewing') return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  if (status === 'Recruiter visible') return 'bg-violet-500/10 text-violet-300 border-violet-500/30'
  return 'bg-slate-700/40 text-slate-400 border-slate-600/50'
}

function LinkDisplayCard({
  linkKey,
  url,
  onEdit,
  onRemove,
}: {
  linkKey: LinkKey
  url: string
  onEdit: () => void
  onRemove: () => void
}) {
  const meta = LINK_META[linkKey]
  const href = normalizeUrl(url)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-900/30 p-4 hover:border-violet-500/25 transition-all duration-300 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>{meta.emoji}</span>
            {meta.label}
          </p>
          <p className="text-xs text-violet-300/90 mt-1 truncate">{formatLinkDisplay(url)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md text-slate-200 border border-slate-600/50 bg-slate-800/50 hover:border-violet-500/30 transition"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md text-slate-200 border border-slate-600/50 bg-slate-800/50 hover:border-violet-500/30 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md text-violet-300 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md text-rose-400/90 border border-rose-500/25 hover:bg-rose-500/10 transition"
        >
          Remove
        </button>
      </div>
    </article>
  )
}

export default function ProfileLinksSection({ data, onSave }: Props) {
  const editor = useSectionEditor(data, onSave)

  const hasLinks =
    data.linkedinUrl.trim() ||
    data.portfolioUrl.trim() ||
    data.githubUrl.trim() ||
    data.languagesSpoken.trim()

  const persistPartial = async (partial: Partial<ProfileLinksData>) => {
    await onSave({ ...data, ...partial })
  }

  const handleRemoveLink = async (key: LinkKey) => {
    await persistPartial({ [key]: '' })
  }

  return (
    <ProfileCard title="Professional Links" subtitle="Recruiter-ready links and contact signals.">
      <ProfileSavedToast show={editor.savedFlash} />

      {!editor.isEditing && !hasLinks && (
        <ProfileEmptyState
          message="No professional links added yet."
          primaryLabel="Add Links"
          onPrimary={() => editor.startEdit()}
        />
      )}

      {!editor.isEditing && hasLinks && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={() => editor.startEdit()}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md text-violet-300 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition"
            >
              Edit all
            </button>
          </div>

          {(Object.keys(LINK_META) as LinkKey[]).map((key) => {
            const url = data[key].trim()
            if (!url) return null
            return (
              <LinkDisplayCard
                key={key}
                linkKey={key}
                url={url}
                onEdit={() => editor.startEdit()}
                onRemove={() => void handleRemoveLink(key)}
              />
            )
          })}

          {data.languagesSpoken.trim() && (
            <article className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
              <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Languages className="w-4 h-4 text-violet-400" />
                Languages
              </p>
              <p className="text-xs text-slate-300 mt-1">{data.languagesSpoken}</p>
            </article>
          )}
        </div>
      )}

      {editor.isEditing && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
          <EditField
            icon={Link2}
            label="LinkedIn URL"
            value={editor.draft.linkedinUrl}
            onChange={(v) => editor.setDraft({ ...editor.draft, linkedinUrl: v })}
            placeholder="linkedin.com/in/yourname"
          />
          <EditField
            icon={Globe}
            label="Portfolio URL"
            value={editor.draft.portfolioUrl}
            onChange={(v) => editor.setDraft({ ...editor.draft, portfolioUrl: v })}
            placeholder="yourportfolio.com"
          />
          <EditField
            icon={Github}
            label="GitHub URL"
            value={editor.draft.githubUrl}
            onChange={(v) => editor.setDraft({ ...editor.draft, githubUrl: v })}
            placeholder="github.com/yourname"
          />
          <EditField
            icon={Languages}
            label="Languages spoken"
            value={editor.draft.languagesSpoken}
            onChange={(v) => editor.setDraft({ ...editor.draft, languagesSpoken: v })}
            placeholder="English, Arabic, French"
          />
          <EditField
            icon={Globe}
            label="Professional headline"
            value={editor.draft.careerDirection}
            onChange={(v) => editor.setDraft({ ...editor.draft, careerDirection: v })}
            placeholder="Senior Frontend Developer · Open to remote UK roles"
          />
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Availability</span>
            <select
              value={editor.draft.availabilityStatus}
              onChange={(e) =>
                editor.setDraft({
                  ...editor.draft,
                  availabilityStatus: e.target.value as AvailabilityStatus,
                })
              }
              className={cn(
                'w-full text-sm px-3 py-2 rounded-lg border bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                availabilityStyle(editor.draft.availabilityStatus)
              )}
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o} value={o} className="bg-slate-900 text-slate-200">
                  {o}
                </option>
              ))}
            </select>
          </label>
          <ProfileEditActions
            onSave={() => void editor.save()}
            onCancel={editor.cancel}
            saving={editor.saving}
          />
        </div>
      )}
    </ProfileCard>
  )
}

function EditField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof Link2
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/30 px-2.5 py-2 focus-within:border-violet-500/40 transition">
        <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-sm text-slate-300 placeholder-slate-600 focus:outline-none"
        />
      </div>
    </label>
  )
}
