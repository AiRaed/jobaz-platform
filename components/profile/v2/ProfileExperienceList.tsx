'use client'

import type { DbProfileExperience } from '@/lib/identity-profile/types'
import ProfileSection from './ProfileSection'

type Props = {
  items: DbProfileExperience[]
  editing: boolean
  draft: { company: string; role: string; start_date: string; end_date: string }[]
  onDraftChange: (rows: Props['draft']) => void
}

export default function ProfileExperienceList({ items, editing, draft, onDraftChange }: Props) {
  if (editing) {
    return (
      <ProfileSection title="Experience" subtitle="Roles and companies">
        <div className="space-y-3">
          {draft.map((row, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input
                value={row.role}
                onChange={(e) => {
                  const next = [...draft]
                  next[i] = { ...next[i], role: e.target.value }
                  onDraftChange(next)
                }}
                placeholder="Job title"
                className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
              />
              <input
                value={row.company}
                onChange={(e) => {
                  const next = [...draft]
                  next[i] = { ...next[i], company: e.target.value }
                  onDraftChange(next)
                }}
                placeholder="Company"
                className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onDraftChange([...draft, { company: '', role: '', start_date: '', end_date: '' }])}
            className="text-xs text-violet-300 hover:text-violet-200 cursor-pointer"
          >
            + Add role
          </button>
        </div>
      </ProfileSection>
    )
  }

  return (
    <ProfileSection title="Experience" subtitle="Roles and companies">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No experience added yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((exp) => (
            <li key={exp.id} className="border-l-2 border-violet-500/40 pl-3">
              <p className="text-sm font-medium text-slate-100">{exp.role}</p>
              <p className="text-xs text-slate-400">{exp.company}</p>
              {exp.description && <p className="text-xs text-slate-500 mt-1">{exp.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </ProfileSection>
  )
}
