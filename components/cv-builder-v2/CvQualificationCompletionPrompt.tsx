'use client'

import type { CvTrainingQualification } from '@/lib/cv-builder/trainingQualifications'
import {
  dismissQualificationPermanently,
  sectionLabel,
  resolveCvSectionForQualification,
} from '@/lib/cv-builder/trainingQualifications'

type Props = {
  qualification: CvTrainingQualification
  onAdd: () => void
  onDismiss: () => void
  onNeverAsk: () => void
}

/** Shown only after the user has explicitly confirmed completion. */
export default function CvQualificationCompletionPrompt({
  qualification,
  onAdd,
  onDismiss,
  onNeverAsk,
}: Props) {
  const section = sectionLabel(resolveCvSectionForQualification(qualification))

  const handleNeverAsk = () => {
    dismissQualificationPermanently(qualification.slug)
    onNeverAsk()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        role="dialog"
        aria-labelledby="cv-qual-complete-title"
        className="w-full max-w-md rounded-xl border border-emerald-500/30 bg-[var(--jaz-surface,#0b1220)] dark:bg-slate-950 p-5 shadow-xl"
      >
        <h4
          id="cv-qual-complete-title"
          className="text-base font-semibold text-[var(--jaz-text,#f8fafc)] dark:text-slate-50"
        >
          Add completed qualification?
        </h4>
        <p className="text-sm text-[var(--jaz-muted,#94a3b8)] dark:text-slate-400 mt-2">
          You marked{' '}
          <span className="font-medium text-emerald-700 dark:text-emerald-200">{qualification.name}</span>{' '}
          as completed. Add it to your <span className="text-violet-700 dark:text-violet-200">{section}</span>{' '}
          section?
        </p>
        <p className="text-xs text-[var(--jaz-muted,#64748b)] dark:text-slate-500 mt-1">
          Career Readiness and CV strength can update after you add it.
        </p>
        <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition border border-violet-500/40"
          >
            Add to CV
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-400/60 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-500/10 transition"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleNeverAsk}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-500/10 transition border border-transparent"
          >
            Don&apos;t ask again
          </button>
        </div>
      </div>
    </div>
  )
}
