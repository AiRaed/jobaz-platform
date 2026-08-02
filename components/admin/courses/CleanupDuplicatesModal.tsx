'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CleanupDuplicatesPlan } from '@/lib/admin/opportunities/cleanupDuplicates'

type Props = {
  isOpen: boolean
  saving: boolean
  loadingPreview: boolean
  preview: CleanupDuplicatesPlan | null
  previewMessage: string | null
  onConfirm: () => void
  onCancel: () => void
}

export default function CleanupDuplicatesModal({
  isOpen,
  saving,
  loadingPreview,
  preview,
  previewMessage,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onCancel()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel, saving])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const hasWork = Boolean(preview?.operations.length)
  const linkedGroups = preview?.groups.filter((g) => g.kind === 'linked-published') ?? []
  const nameRouteGroups = preview?.groups.filter((g) => g.kind === 'name-route') ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-100" />

      <div
        className={cn(
          'relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto',
          'rounded-xl border border-slate-700/60 bg-slate-950/95 backdrop-blur-xl',
          'shadow-[0_18px_50px_rgba(76,29,149,0.65)] p-6'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-xl font-heading font-bold mb-2 text-slate-50">
          Clean duplicate opportunities?
        </h2>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          Linked published duplicates are merged first (one keeper per published course). Then
          same-name duplicates on the same main route are merged. Published courses in the courses
          table are never deleted — only redundant opportunity rows are removed.
        </p>

        {loadingPreview ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysing duplicates…
          </div>
        ) : (
          <>
            {previewMessage && (
              <p className="text-sm text-amber-200/90 mb-4 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2">
                {previewMessage}
                {preview && preview.remainingDuplicatePublishedLinksAfterCleanup === 0 && hasWork && (
                  <span className="block mt-1 text-emerald-200/90">
                    All duplicate published links will be resolved.
                  </span>
                )}
                {preview && preview.remainingDuplicatePublishedLinksAfterCleanup > 0 && (
                  <span className="block mt-1 text-amber-200/70">
                    {preview.remainingDuplicatePublishedLinksAfterCleanup} duplicate published link
                    group(s) will still remain after cleanup.
                  </span>
                )}
              </p>
            )}

            {!hasWork ? (
              <p className="text-sm text-emerald-200/90 mb-6 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2">
                No duplicate opportunities found. Nothing will be changed.
              </p>
            ) : (
              <div className="space-y-4 mb-6">
                {linkedGroups.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-amber-200 mb-2">
                      Linked published duplicates ({linkedGroups.length})
                    </h3>
                    <ul className="space-y-3">
                      {linkedGroups.map((group) => (
                        <li
                          key={group.publishedCourseId ?? group.keeper.id}
                          className="rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2 text-xs text-amber-100/90"
                        >
                          <p className="font-medium text-amber-100">
                            {group.publishedCourseTitle ?? 'Published course'}
                          </p>
                          <p className="mt-1 text-amber-200/70">
                            Duplicate rows:{' '}
                            {group.duplicateRows.map((row) => `${row.courseName} (${row.id.slice(0, 8)}…)`).join(', ')}
                          </p>
                          <p className="mt-1 text-emerald-200/80">
                            Keeper: {group.keeper.courseName} ({group.keeper.id.slice(0, 8)}…)
                          </p>
                          <p className="mt-1 text-red-200/80">
                            Will merge/delete:{' '}
                            {group.rowsToDelete.map((row) => `${row.courseName} (${row.id.slice(0, 8)}…)`).join(', ')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {nameRouteGroups.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-violet-200 mb-2">
                      Same name + route duplicates ({nameRouteGroups.length})
                    </h3>
                    <ul className="space-y-3">
                      {nameRouteGroups.map((group) => (
                        <li
                          key={`${group.keeper.id}-${group.duplicateRows.map((r) => r.id).join('-')}`}
                          className="rounded-lg border border-violet-500/20 bg-violet-950/15 px-3 py-2 text-xs text-violet-100/90"
                        >
                          {group.publishedCourseTitle && (
                            <p className="font-medium text-violet-100">{group.publishedCourseTitle}</p>
                          )}
                          <p className="mt-1 text-violet-200/70">
                            Duplicate rows:{' '}
                            {group.duplicateRows.map((row) => `${row.courseName} (${row.id.slice(0, 8)}…)`).join(', ')}
                          </p>
                          <p className="mt-1 text-emerald-200/80">
                            Keeper: {group.keeper.courseName} ({group.keeper.id.slice(0, 8)}…)
                          </p>
                          <p className="mt-1 text-red-200/80">
                            Will merge/delete:{' '}
                            {group.rowsToDelete.map((row) => `${row.courseName} (${row.id.slice(0, 8)}…)`).join(', ')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800/80 text-slate-200 border border-slate-600/70 hover:bg-slate-700/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || loadingPreview || !hasWork}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium text-white',
              'bg-gradient-to-r from-violet-600 to-fuchsia-600',
              'hover:from-violet-500 hover:to-fuchsia-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saving ? 'Cleaning…' : hasWork ? 'Clean duplicates' : 'Nothing to clean'}
          </button>
        </div>
      </div>
    </div>
  )
}
