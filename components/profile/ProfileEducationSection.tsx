'use client'

import { Award, GraduationCap, Sparkles } from 'lucide-react'
import type { CvData } from '@/app/cv-builder-v2/page'
import type { SuggestedCertification } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'
import {
  ProfileDisplayActions,
  ProfileEditActions,
  ProfileEmptyState,
  ProfileSavedToast,
  useSectionEditor,
} from './profileSectionUx'

type EducationEntry = CvData['education'][number]

type EducationDraft = {
  education: EducationEntry[]
  certifications: string[]
}

type Props = {
  education: EducationEntry[]
  certifications?: string[]
  suggestedCertifications: SuggestedCertification[]
  onSave: (data: { education: EducationEntry[]; certifications: string[] }) => void | Promise<void>
}

function emptyEducation(): EducationEntry {
  return { degree: '', school: '', year: '', details: '' }
}

export default function ProfileEducationSection({
  education,
  certifications = [],
  suggestedCertifications,
  onSave,
}: Props) {
  const saved: EducationDraft = { education, certifications }
  const editor = useSectionEditor(saved, onSave)
  const hasContent = education.length > 0 || certifications.length > 0

  const updateEdu = (index: number, patch: Partial<EducationEntry>) => {
    const next = [...editor.draft.education]
    next[index] = { ...next[index], ...patch }
    editor.setDraft({ ...editor.draft, education: next })
  }

  return (
    <ProfileCard title="Education & Certifications" subtitle="Qualifications, licenses, and courses.">
      <ProfileSavedToast show={editor.savedFlash} />

      {!editor.isEditing && !hasContent && (
        <ProfileEmptyState
          message="No education or certifications added yet."
          primaryLabel="Add Education"
          onPrimary={() => editor.startEdit({ education: [emptyEducation()], certifications: [] })}
        />
      )}

      {!editor.isEditing && hasContent && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex justify-end">
            <ProfileDisplayActions onEdit={() => editor.startEdit()} />
          </div>
          {education.map((edu, i) => (
            <article
              key={i}
              className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 flex gap-3 hover:border-violet-500/20 transition"
            >
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{edu.degree || 'Qualification'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {edu.school}
                  {edu.year ? ` · ${edu.year}` : ''}
                </p>
                {edu.details && <p className="text-xs text-slate-500 mt-1">{edu.details}</p>}
              </div>
            </article>
          ))}
          {certifications.map((cert, i) => (
            <article
              key={`cert-${i}`}
              className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 flex gap-3"
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{cert}</h3>
                <p className="text-xs text-slate-500">Certification</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {editor.isEditing && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
          <p className="text-xs font-medium text-slate-400">Education</p>
          {editor.draft.education.map((edu, i) => (
            <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 space-y-2">
              <input
                value={edu.degree}
                onChange={(e) => updateEdu(i, { degree: e.target.value })}
                placeholder="Degree / qualification"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={edu.school}
                  onChange={(e) => updateEdu(i, { school: e.target.value })}
                  placeholder="School / institution"
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <input
                  value={edu.year ?? ''}
                  onChange={(e) => updateEdu(i, { year: e.target.value })}
                  placeholder="Year"
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <input
                value={edu.details ?? ''}
                onChange={(e) => updateEdu(i, { details: e.target.value })}
                placeholder="Details (optional)"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              editor.setDraft({
                ...editor.draft,
                education: [...editor.draft.education, emptyEducation()],
              })
            }
            className="text-xs text-violet-400 hover:text-violet-300"
          >
            + Add education entry
          </button>

          <label className="block pt-2">
            <span className="text-xs font-medium text-slate-400 mb-1 block">Certifications (one per line)</span>
            <textarea
              value={editor.draft.certifications.join('\n')}
              onChange={(e) =>
                editor.setDraft({
                  ...editor.draft,
                  certifications: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                })
              }
              rows={3}
              placeholder="AWS Certified Developer&#10;PRINCE2 Foundation"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y"
            />
          </label>

          <ProfileEditActions
            onSave={() => void editor.save()}
            onCancel={editor.cancel}
            saving={editor.saving}
          />
        </div>
      )}

      {suggestedCertifications.length > 0 && !editor.isEditing && (
        <div className="mt-4 rounded-xl border border-dashed border-violet-500/25 bg-violet-950/15 p-3">
          <p className="text-xs font-medium text-violet-300 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Suggested certifications for your target role
          </p>
          <ul className="space-y-2">
            {suggestedCertifications.map((c) => (
              <li key={c.name} className="text-xs">
                <span className="text-slate-200 font-medium">{c.name}</span>
                <span className="text-slate-500"> — {c.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProfileCard>
  )
}
