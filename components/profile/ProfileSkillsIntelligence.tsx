'use client'

import { Sparkles, Target } from 'lucide-react'
import type { SkillsIntelligence } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'
import {
  ProfileDisplayActions,
  ProfileEditActions,
  ProfileEmptyState,
  ProfileSavedToast,
  useSectionEditor,
} from './profileSectionUx'

type Props = {
  skills: string[]
  intelligence: SkillsIntelligence
  onSaveSkills: (skills: string[]) => void | Promise<void>
}

export default function ProfileSkillsIntelligence({ skills, intelligence, onSaveSkills }: Props) {
  const editor = useSectionEditor(skills, onSaveSkills)
  const { verified, missing, scanFirst, atsKeywordStrength, suggestions, roleRelevance } = intelligence
  const hasSkills = skills.length > 0

  return (
    <ProfileCard title="Skills Intelligence" subtitle="AI-powered skill matching for recruiters and ATS.">
      <ProfileSavedToast show={editor.savedFlash} />

      {!editor.isEditing && !hasSkills && (
        <ProfileEmptyState
          message="No skills added yet."
          primaryLabel="Add Skills"
          onPrimary={() => editor.startEdit([])}
        />
      )}

      {!editor.isEditing && hasSkills && (
        <div className="mb-4 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Your skills</p>
            <ProfileDisplayActions onEdit={() => editor.startEdit()} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-700/50 bg-slate-900/40 text-slate-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {editor.isEditing && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">
              Skills (comma-separated)
            </span>
            <textarea
              value={editor.draft.join(', ')}
              onChange={(e) =>
                editor.setDraft(
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              rows={3}
              placeholder="React, TypeScript, UI/UX, Accessibility, Agile"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-700/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y"
              autoFocus
            />
          </label>
          <ProfileEditActions
            onSave={() => void editor.save()}
            onCancel={editor.cancel}
            saving={editor.saving}
          />
        </div>
      )}

      <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-950/20 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">ATS keyword strength</p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-lg font-bold text-blue-300 tabular-nums">{atsKeywordStrength}%</p>
          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${atsKeywordStrength}%` }}
            />
          </div>
        </div>
      </div>

      {scanFirst.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Target className="w-3 h-3 text-violet-400" />
            Skills recruiters scan first
          </p>
          <div className="flex flex-wrap gap-1.5">
            {scanFirst.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {verified.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Verified skills</p>
          <div className="flex flex-wrap gap-2">
            {roleRelevance.map(({ skill, relevance }) => (
              <span
                key={skill}
                className="inline-flex flex-col px-2.5 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/40 text-xs"
              >
                <span className="text-slate-200 font-medium">{skill}</span>
                <span className="text-[9px] text-emerald-400/90 mt-0.5">{relevance}% role relevance</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
            Missing recruiter-demanded skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300"
              >
                + {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-xl border border-dashed border-violet-500/25 bg-violet-950/20 p-3">
          <p className="text-xs font-medium text-violet-300 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggestions
          </p>
          <ul className="space-y-1">
            {suggestions.map((s) => (
              <li key={s} className="text-[11px] text-slate-400 flex gap-1.5">
                <span className="text-violet-400">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProfileCard>
  )
}
