'use client'

import { useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyzeAboutTone } from '@/lib/profile'
import type { AboutToneAnalysis } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'
import {
  ProfileDisplayActions,
  ProfileEditActions,
  ProfileEmptyState,
  ProfileSavedToast,
  aboutToDisplayBullets,
  useSectionEditor,
} from './profileSectionUx'

type Props = {
  value: string
  onSave: (value: string) => void | Promise<void>
}

const AI_ACTIONS = [
  { id: 'enhance', label: 'AI Improve', mode: 'enhance', instruction: undefined },
  { id: 'executive', label: 'More Professional', mode: 'executive', instruction: undefined },
  { id: 'confident', label: 'More Confident', mode: 'executive', instruction: undefined },
  { id: 'simple', label: 'Beginner Friendly', mode: 'simple', instruction: undefined },
  { id: 'ats', label: 'ATS Optimized', mode: 'enhance', instruction: 'Rewrite for ATS keyword clarity and UK job applications.' },
  { id: 'recruiter', label: 'Recruiter Friendly', mode: 'executive', instruction: 'Rewrite so a UK recruiter would shortlist this candidate.' },
  { id: 'shorten', label: 'Shorten', mode: 'shorten', instruction: undefined },
  { id: 'uk', label: 'UK jobs tone', mode: 'enhance', instruction: 'Rewrite for UK job market tone and spelling.' },
]

async function rewriteAbout(text: string, mode: string, instruction?: string): Promise<string> {
  if (mode === 'shorten' && text.trim()) {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
    return sentences.slice(0, 2).join(' ') || text.slice(0, 280)
  }
  const prefix =
    mode === 'simple'
      ? 'Rewrite in simple, clear English for job seekers with beginner-level English. Short sentences.\n\n'
      : instruction
        ? `${instruction}\n\n`
        : ''

  const response = await fetch('/api/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `${prefix}${text}`,
      mode: mode === 'simple' ? 'enhance' : mode === 'shorten' ? 'enhance' : mode,
    }),
  })
  const data = await response.json()
  if (!data.ok) throw new Error(data.error || 'Rewrite failed')
  return data.content?.trim() || text
}

function TonePanel({ analysis }: { analysis: AboutToneAnalysis }) {
  return (
    <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/20 p-3">
      <p className="text-xs font-semibold text-violet-300 mb-2">AI Writing Tone Analysis</p>
      <p className="text-[11px] text-slate-400 mb-2">{analysis.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {analysis.signals.map((s) => (
          <span
            key={s.label}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full border',
              s.tone === 'good' && 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
              s.tone === 'neutral' && 'bg-slate-700/40 text-slate-300 border-slate-600/40',
              s.tone === 'weak' && 'bg-amber-500/10 text-amber-300/90 border-amber-500/30'
            )}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ProfileAboutSection({ value, onSave }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const editor = useSectionEditor(value, onSave)
  const toneAnalysis = useMemo(() => analyzeAboutTone(editor.draft), [editor.draft])
  const hasContent = value.trim().length > 0
  const bullets = aboutToDisplayBullets(value)

  const runAction = async (actionId: string, mode: string, instruction?: string) => {
    const source = editor.draft.trim() || 'Professional job seeker looking for new opportunities in the UK.'
    setLoading(actionId)
    try {
      const result = await rewriteAbout(source, mode, instruction)
      editor.setDraft(result)
      if (!editor.isEditing) editor.startEdit(result)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'AI improve failed')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerate = async () => {
    editor.startEdit('')
    setLoading('generate')
    try {
      const result = await rewriteAbout(
        'Write a professional summary for my JobAZ profile.',
        'enhance',
        'Write a concise professional about-me summary (3-4 bullet points) for a UK job seeker profile. Use clear, recruiter-friendly language.'
      )
      editor.setDraft(result)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Generate failed')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Remove your professional summary?')) return
    await onSave('')
  }

  return (
    <ProfileCard title="About Me" subtitle="Your professional story — AI-powered for recruiters.">
      <ProfileSavedToast show={editor.savedFlash} />

      {!editor.isEditing && !hasContent && (
        <ProfileEmptyState
          message="No professional summary added yet."
          primaryLabel="Add About Me"
          onPrimary={() => editor.startEdit()}
          secondaryLabel="Generate with AI"
          onSecondary={() => void handleGenerate()}
        />
      )}

      {!editor.isEditing && hasContent && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Professional Summary</p>
            <ProfileDisplayActions
              onEdit={() => editor.startEdit()}
              onDelete={() => void handleDelete()}
              onAiImprove={() => {
                editor.startEdit()
                void runAction('enhance', 'enhance')
              }}
              aiLoading={loading === 'enhance'}
            />
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-violet-950/20 p-4 shadow-[0_0_20px_rgba(139,92,246,0.06)]">
            <ul className="space-y-2">
              {bullets.map((line, i) => (
                <li key={i} className="text-sm text-slate-200 flex gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {editor.isEditing && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
          <textarea
            value={editor.draft}
            onChange={(e) => editor.setDraft(e.target.value)}
            rows={6}
            placeholder="Tell recruiters who you are, what you do best, and what you're looking for next..."
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm resize-y transition"
            autoFocus
          />
          <TonePanel analysis={toneAnalysis} />
          <div className="flex flex-wrap gap-2 mt-3">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={loading !== null}
                onClick={() => runAction(action.id, action.mode, action.instruction)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg',
                  'bg-violet-600/20 text-violet-300 border border-violet-500/30',
                  'hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50'
                )}
              >
                {loading === action.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {action.label}
              </button>
            ))}
          </div>
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
