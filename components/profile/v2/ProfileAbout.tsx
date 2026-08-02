'use client'

import ProfileSection from './ProfileSection'

type Props = {
  bio: string | null
  editing: boolean
  draft: string
  onDraftChange: (v: string) => void
}

export default function ProfileAbout({ bio, editing, draft, onDraftChange }: Props) {
  return (
    <ProfileSection title="About" subtitle="Tell people what you do and what you are looking for">
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={4}
          placeholder="Write a short bio…"
          className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {bio?.trim() || 'No bio yet. Click Edit Identity to add one.'}
        </p>
      )}
    </ProfileSection>
  )
}
