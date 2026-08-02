'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProfileEmptyState({
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  message: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-600/50 bg-slate-900/30 px-4 py-8 text-center">
      <p className="text-sm text-slate-400">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600/90 text-white border border-violet-400/50 hover:bg-violet-500 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export function ProfileEditActions({
  onSave,
  onCancel,
  saving,
  saveLabel = 'Save',
}: {
  onSave: () => void
  onCancel: () => void
  saving?: boolean
  saveLabel?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-700/40 mt-4">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600/90 text-white border border-emerald-400/50 hover:bg-emerald-500 disabled:opacity-50 transition"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 border border-slate-600/50 hover:text-slate-200 hover:border-slate-500 transition"
      >
        Cancel
      </button>
    </div>
  )
}

export function ProfileDisplayActions({
  onEdit,
  onDelete,
  onAiImprove,
  aiLoading,
}: {
  onEdit: () => void
  onDelete?: () => void
  onAiImprove?: () => void
  aiLoading?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className="text-[11px] font-medium px-2.5 py-1 rounded-md text-violet-300 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition"
      >
        Edit
      </button>
      {onAiImprove && (
        <button
          type="button"
          onClick={onAiImprove}
          disabled={aiLoading}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md text-violet-300 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition disabled:opacity-50"
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Improve
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md text-rose-400/90 border border-rose-500/25 hover:bg-rose-500/10 transition"
        >
          Delete
        </button>
      )}
    </div>
  )
}

export function ProfileSavedToast({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium text-emerald-300 mb-3 px-3 py-1.5 rounded-lg',
        'bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.15)]',
        'animate-in fade-in slide-in-from-top-1 duration-300'
      )}
    >
      <Check className="w-3.5 h-3.5" />
      Saved successfully
    </div>
  )
}

export function useSectionEditor<T>(savedValue: T, onPersist: (value: T) => void | Promise<void>) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(savedValue)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (!isEditing) setDraft(savedValue)
  }, [savedValue, isEditing])

  const startEdit = useCallback(
    (initial?: T) => {
      setDraft(initial ?? savedValue)
      setIsEditing(true)
    },
    [savedValue]
  )

  const cancel = useCallback(() => {
    setDraft(savedValue)
    setIsEditing(false)
  }, [savedValue])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await onPersist(draft)
      setIsEditing(false)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2800)
    } finally {
      setSaving(false)
    }
  }, [draft, onPersist])

  return {
    isEditing,
    draft,
    setDraft,
    saving,
    savedFlash,
    startEdit,
    cancel,
    save,
  }
}

export function aboutToDisplayBullets(text: string): string[] {
  const lines = text.split(/\n+/).map((l) => l.replace(/^[\*\-•]\s*/, '').trim()).filter(Boolean)
  if (lines.length > 1) return lines
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 8)
  return sentences.length > 0 ? sentences : lines
}

export function formatLinkDisplay(url: string): string {
  try {
    const u = url.startsWith('http') ? url : `https://${url}`
    const host = new URL(u).hostname.replace(/^www\./, '')
    const path = new URL(u).pathname.replace(/^\//, '')
    return path ? `${host}/${path}` : host
  } catch {
    return url.replace(/^https?:\/\//, '')
  }
}

export function normalizeUrl(url: string): string {
  const t = url.trim()
  if (!t) return ''
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  return `https://${t}`
}
