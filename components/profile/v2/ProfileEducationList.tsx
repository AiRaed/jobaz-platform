'use client'

import type { DbProfileEducation } from '@/lib/identity-profile/types'
import ProfileSection from './ProfileSection'

type Props = {
  items: DbProfileEducation[]
  editing: boolean
  draft: { school: string; degree: string }[]
  onDraftChange: (rows: Props['draft']) => void
}

export default function ProfileEducationList({ items, editing, draft, onDraftChange }: Props) {
  if (editing) {
    return (
      <ProfileSection title="Education" subtitle="Schools and qualifications">
        <div className="space-y-3">
          {draft.map((row, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input
                value={row.school}
                onChange={(e) => {
                  const next = [...draft]
                  next[i] = { ...next[i], school: e.target.value }
                  onDraftChange(next)
                }}
                placeholder="School / university"
                className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
              />
              <input
                value={row.degree}
                onChange={(e) => {
                  const next = [...draft]
                  next[i] = { ...next[i], degree: e.target.value }
                  onDraftChange(next)
                }}
                placeholder="Degree / qualification"
                className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onDraftChange([...draft, { school: '', degree: '' }])}
            className="text-xs text-violet-300 hover:text-violet-200 cursor-pointer"
          >
            + Add education
          </button>
        </div>
      </ProfileSection>
    )
  }

  return (
    <ProfileSection title="Education" subtitle="Schools and qualifications">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No education added yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((edu) => (
            <li key={edu.id}>
              <p className="text-sm font-medium text-slate-100">{edu.school}</p>
              {edu.degree && <p className="text-xs text-slate-400">{edu.degree}</p>}
            </li>
          ))}
        </ul>
      )}
    </ProfileSection>
  )
}
