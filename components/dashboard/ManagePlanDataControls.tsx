'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, Database, FileText, Route, X } from 'lucide-react'
import {
  clearActiveCareerPlanLocal,
  clearCareerTestData,
  clearLocalCvDrafts,
} from '@/lib/cv/clearCareerTestData'
import { cn } from '@/lib/utils'

type Mode = 'plan' | 'cv' | 'test' | null

type Props = {
  onCvCleared?: () => void
  onPlanCleared?: () => void
  showDevReset?: boolean
  /** Compact footer style vs prominent My Plan panel */
  variant?: 'footer' | 'panel'
  className?: string
}

export default function ManagePlanDataControls({
  onCvCleared,
  onPlanCleared,
  showDevReset = process.env.NODE_ENV === 'development',
  variant = 'footer',
  className,
}: Props) {
  const [open, setOpen] = useState(variant === 'panel')
  const [mode, setMode] = useState<Mode>(null)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setMode(null)
    setConfirmText('')
    setError(null)
    setBusy(false)
  }

  const runReset = async () => {
    if (!mode) return
    setBusy(true)
    setError(null)
    try {
      if (mode === 'plan') {
        const res = await fetch('/api/career-plan/reset', { method: 'DELETE' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Failed to reset career plan')
        }
        clearActiveCareerPlanLocal()
        onPlanCleared?.()
      } else if (mode === 'cv') {
        const res = await fetch('/api/cv/delete', { method: 'DELETE' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Failed to reset saved CV')
        }
        clearLocalCvDrafts()
        onCvCleared?.()
      } else if (mode === 'test') {
        if (confirmText.trim().toUpperCase() !== 'RESET') {
          setError('Type RESET to confirm.')
          setBusy(false)
          return
        }
        await fetch('/api/career-plan/reset', { method: 'DELETE' }).catch(() => null)
        clearCareerTestData()
        clearActiveCareerPlanLocal()
        onPlanCleared?.()
      }
      close()
      setOpen(false)
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reset failed')
      setBusy(false)
    }
  }

  const confirmCopy =
    mode === 'plan'
      ? 'This will remove your current career plan but keep your CV. Continue?'
      : mode === 'cv'
        ? 'This will remove your saved CV but keep your career plan. Continue?'
        : 'Clears temporary plan drafts, guest data, and education/engine local caches for this session. Type RESET to confirm.'

  return (
    <div className={cn(variant === 'footer' ? 'mt-4' : 'mt-6', className)}>
      {variant === 'panel' ? (
        <div className="jobaz-card rounded-xl border border-[var(--jaz-border)] dark:border-slate-700/70 bg-[var(--jaz-surface)] dark:bg-slate-950/70 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/60 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Database className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Manage plan data
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-500">
                  Reset Career Plan, saved CV, or test data — separately.
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-500 transition-transform shrink-0',
                open && 'rotate-180'
              )}
            />
          </button>
          {open && (
            <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Career Plan and Main CV are separate. Resetting one does not delete the other.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode('plan')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100 dark:hover:bg-amber-500/25"
                >
                  <Route className="w-3.5 h-3.5" />
                  Reset Career Plan
                </button>
                <button
                  type="button"
                  onClick={() => setMode('cv')}
                  className="jobaz-btn-danger"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Reset Saved CV
                </button>
                {showDevReset && (
                  <button
                    type="button"
                    onClick={() => setMode('test')}
                    className="jobaz-btn-ghost text-xs border border-slate-200 dark:border-slate-600"
                  >
                    Reset Test Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-slate-400 hover:text-slate-200 transition underline-offset-2 hover:underline"
          >
            Manage plan data
          </button>

          {open && (
            <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3 max-w-lg dark:border-slate-700/60 dark:bg-slate-950/80">
              <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400 leading-relaxed">
                Safe resets for testing. Career Plan and saved CV are separate — resetting one does
                not delete the other.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode('plan')}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/20"
                >
                  Reset Career Plan
                </button>
                <button
                  type="button"
                  onClick={() => setMode('cv')}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/20"
                >
                  Reset Saved CV
                </button>
                {showDevReset && (
                  <button
                    type="button"
                    onClick={() => setMode('test')}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
                  >
                    Reset Test Data
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  {mode === 'plan' && 'Reset Career Plan?'}
                  {mode === 'cv' && 'Reset Saved CV?'}
                  {mode === 'test' && 'Reset Test Data?'}
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{confirmCopy}</p>
                {mode === 'test' && (
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type RESET"
                    className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                )}
                {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runReset()}
                disabled={busy}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {busy ? 'Working…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
