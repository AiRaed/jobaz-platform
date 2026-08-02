'use client'

import type { CourseInterestRecord } from '@/lib/cv-builder/courseInterest'

type Props = {
  interest: CourseInterestRecord
  onBooked: () => void
  onCompleted: () => void
  onNotYet: () => void
  onDontAsk: () => void
}

/**
 * Course click / view follow-up — never claims the qualification is completed.
 */
export default function CvCourseActionPrompt({
  interest,
  onBooked,
  onCompleted,
  onNotYet,
  onDontAsk,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        role="dialog"
        aria-labelledby="cv-course-action-title"
        className="w-full max-w-md rounded-xl border border-cyan-500/30 bg-[var(--jaz-surface,#0b1220)] dark:bg-slate-950 p-5 shadow-xl"
      >
        <h4
          id="cv-course-action-title"
          className="text-base font-semibold text-[var(--jaz-text,#f8fafc)] dark:text-slate-50"
        >
          Course action detected
        </h4>
        <p className="text-sm text-[var(--jaz-muted,#94a3b8)] dark:text-slate-400 mt-2 leading-relaxed">
          You recently viewed or clicked the{' '}
          <span className="font-medium text-cyan-700 dark:text-cyan-200">{interest.title}</span>{' '}
          course. Have you booked or completed it?
        </p>
        <p className="text-xs text-[var(--jaz-muted,#64748b)] dark:text-slate-500 mt-2">
          Updating this helps JobAZ improve your CV readiness, plan and job recommendations.
        </p>

        <div className="flex flex-col gap-2 mt-4">
          <button
            type="button"
            onClick={onBooked}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition border border-violet-500/40"
          >
            I booked this course
          </button>
          <button
            type="button"
            onClick={onCompleted}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-emerald-500/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25 transition"
          >
            I completed this course
          </button>
          <button
            type="button"
            onClick={onNotYet}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-400/50 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-500/10 transition"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onDontAsk}
            className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-500/10 transition border border-transparent"
          >
            Don&apos;t ask again
          </button>
        </div>
      </div>
    </div>
  )
}
