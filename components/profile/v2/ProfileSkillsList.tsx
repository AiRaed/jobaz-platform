'use client'

import ProfileSection from './ProfileSection'

type Props = {
  skills: string[]
  editing: boolean
  draft: string
  onDraftChange: (v: string) => void
}

export default function ProfileSkillsList({ skills, editing, draft, onDraftChange }: Props) {
  return (
    <ProfileSection title="Skills" subtitle="Comma-separated in edit mode">
      {editing ? (
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="e.g. Customer service, Excel, Team leadership"
          className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
        />
      ) : skills.length === 0 ? (
        <p className="text-sm text-slate-500">No skills listed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </ProfileSection>
  )
}
