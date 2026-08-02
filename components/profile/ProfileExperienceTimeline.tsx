'use client'

import { Building2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CvSectionExperience } from '@/app/cv-builder-v2/page'
import type { ExperienceRoleInsight } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'
import {
  ProfileDisplayActions,
  ProfileEditActions,
  ProfileEmptyState,
  ProfileSavedToast,
  useSectionEditor,
} from './profileSectionUx'

type Props = {
  experience: CvSectionExperience[]
  insights: ExperienceRoleInsight[]
  onSave: (experience: CvSectionExperience[]) => void | Promise<void>
}

function formatYears(exp: CvSectionExperience) {
  const start = exp.startDate?.trim()
  const end = exp.isCurrent ? 'Present' : exp.endDate?.trim()
  if (start && end) return `${start} – ${end}`
  if (start) return start
  return ''
}

function scoreColor(n: number) {
  if (n >= 70) return 'text-emerald-400'
  if (n >= 45) return 'text-amber-400'
  return 'text-slate-400'
}

function emptyRole(): CvSectionExperience {
  return {
    id: crypto.randomUUID(),
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    bullets: [''],
  }
}

export default function ProfileExperienceTimeline({ experience, insights, onSave }: Props) {
  const editor = useSectionEditor(experience, onSave)
  const insightMap = new Map(insights.map((i) => [i.id, i]))
  const hasContent = experience.length > 0

  const updateRole = (id: string, patch: Partial<CvSectionExperience>) => {
    editor.setDraft(editor.draft.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRole = (id: string) => {
    editor.setDraft(editor.draft.filter((r) => r.id !== id))
  }

  return (
    <ProfileCard title="Experience" subtitle="Professional timeline with AI recruiter signals.">
      <ProfileSavedToast show={editor.savedFlash} />

      {!editor.isEditing && !hasContent && (
        <ProfileEmptyState
          message="No experience added yet."
          primaryLabel="Add Experience"
          onPrimary={() => editor.startEdit([emptyRole()])}
        />
      )}

      {!editor.isEditing && hasContent && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-end mb-3">
            <ProfileDisplayActions onEdit={() => editor.startEdit()} />
          </div>
          <ul className="relative ml-3 space-y-4 border-l border-violet-500/25 pl-6">
            {experience.map((exp) => {
              const insight = insightMap.get(exp.id)
              return (
                <li key={exp.id} className="relative">
                  <span className="absolute -left-[1.65rem] top-3 h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  <article className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 hover:border-violet-500/25 hover:shadow-[0_0_16px_rgba(139,92,246,0.08)] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-100">{exp.jobTitle || 'Role title'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {exp.company}
                          {exp.location ? ` · ${exp.location}` : ''}
                          {formatYears(exp) ? ` · ${formatYears(exp)}` : ''}
                        </p>

                        {insight && (
                          <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
                            <span className={scoreColor(insight.atsStrength)}>ATS {insight.atsStrength}%</span>
                            <span className={scoreColor(insight.recruiterImpact)}>
                              Impact {insight.recruiterImpact}%
                            </span>
                          </div>
                        )}

                        {(exp.bullets ?? []).filter(Boolean).length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {exp.bullets.filter(Boolean).slice(0, 3).map((b, i) => (
                              <li key={i} className="text-xs text-slate-400 flex gap-2">
                                <span className="text-violet-400/80">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {insight && insight.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {insight.badges.map((b) => (
                              <span
                                key={b}
                                className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        )}

                        {insight && (
                          <div className="mt-2 pt-2 border-t border-slate-700/40">
                            <p className="text-[10px] text-violet-400/90 flex items-center gap-1 mb-1">
                              <Sparkles className="w-3 h-3" />
                              AI detected strengths from this role
                            </p>
                            <ul className="space-y-0.5">
                              {insight.detectedStrengths.map((s) => (
                                <li key={s} className="text-[10px] text-slate-500">
                                  · {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {editor.isEditing && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
          {editor.draft.map((exp) => (
            <div
              key={exp.id}
              className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 space-y-2"
            >
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-slate-400">Role</p>
                <button
                  type="button"
                  onClick={() => removeRole(exp.id)}
                  className="text-rose-400/80 hover:text-rose-300 p-1"
                  aria-label="Remove role"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                value={exp.jobTitle}
                onChange={(e) => updateRole(exp.id, { jobTitle: e.target.value })}
                placeholder="Job title"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={exp.company}
                  onChange={(e) => updateRole(exp.id, { company: e.target.value })}
                  placeholder="Company"
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <input
                  value={exp.location ?? ''}
                  onChange={(e) => updateRole(exp.id, { location: e.target.value })}
                  placeholder="Location"
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={exp.startDate ?? ''}
                  onChange={(e) => updateRole(exp.id, { startDate: e.target.value })}
                  placeholder="Start date"
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <input
                  value={exp.endDate ?? ''}
                  onChange={(e) => updateRole(exp.id, { endDate: e.target.value })}
                  placeholder="End date"
                  disabled={exp.isCurrent}
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={Boolean(exp.isCurrent)}
                  onChange={(e) => updateRole(exp.id, { isCurrent: e.target.checked })}
                  className="rounded border-slate-600"
                />
                Currently working here
              </label>
              <textarea
                value={(exp.bullets ?? []).join('\n')}
                onChange={(e) =>
                  updateRole(exp.id, {
                    bullets: e.target.value.split('\n').map((l) => l.replace(/^[\*\-•]\s*/, '')),
                  })
                }
                rows={3}
                placeholder="Key achievements (one per line)"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => editor.setDraft([...editor.draft, emptyRole()])}
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
          >
            <Plus className="w-3.5 h-3.5" />
            Add another role
          </button>
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
