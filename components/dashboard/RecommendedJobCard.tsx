'use client'

import { useState, useRef, useEffect } from 'react'
import { Target, MoreHorizontal, Bookmark, FileText, GraduationCap, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RecommendedJobCardJob = {
  id: string
  title: string
  company: string
  location: string
  description?: string
  matchPercentage?: number
  isTraining?: boolean
}

type Props = {
  job: RecommendedJobCardJob
  isSaved: boolean
  onView: () => void
  onSave: () => void
  onTailorCv: () => void
  onTrainInterview: () => void
  onMarkApplied?: () => void
  isApplied?: boolean
}

export default function RecommendedJobCard({
  job,
  isSaved,
  onView,
  onSave,
  onTailorCv,
  onTrainInterview,
  onMarkApplied,
  isApplied = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const match = job.matchPercentage ?? 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-blue-300/70 hover:shadow-md transition flex flex-col dark:border-slate-700/60 dark:bg-slate-950/50 dark:shadow-[0_18px_40px_rgba(15,23,42,0.85)] dark:hover:border-violet-500/50 dark:hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
            match >= 70
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-transparent'
              : match >= 50
                ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent'
                : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-transparent'
          )}
        >
          <Target className="w-3 h-3" />
          {match}% Match
        </span>
        <span
          className={cn(
            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
            job.isTraining
              ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-transparent'
          )}
        >
          {job.isTraining ? 'Training' : 'Job'}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-2 dark:text-slate-50">{job.title}</h3>
      <p className="text-sm text-blue-700 font-medium mb-0.5 dark:text-violet-300">{job.company}</p>
      <p className="text-xs text-slate-600 mb-3 dark:text-slate-400">{job.location}</p>

      {job.description && (
        <p className="text-xs text-slate-700 leading-snug mb-4 line-clamp-2 flex-1 dark:text-slate-300">{job.description}</p>
      )}

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm dark:bg-violet-600 dark:hover:bg-violet-500 dark:shadow-[0_0_18px_rgba(139,92,246,0.6)]"
        >
          View Job
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-800 transition dark:border-slate-600/70 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-violet-400/60 dark:hover:text-violet-200"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-20 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg backdrop-blur dark:border-slate-700/60 dark:bg-slate-950/95 dark:shadow-xl">
              <button
                type="button"
                onClick={() => {
                  onSave()
                  setMenuOpen(false)
                }}
                disabled={isSaved}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-800 hover:bg-blue-50 disabled:opacity-55 dark:text-slate-200 dark:hover:bg-violet-500/10"
              >
                <Bookmark className="h-3.5 w-3.5" />
                {isSaved ? 'Saved' : 'Save Job'}
              </button>
              {onMarkApplied && (
                <button
                  type="button"
                  onClick={() => {
                    onMarkApplied()
                    setMenuOpen(false)
                  }}
                  disabled={isApplied}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-800 hover:bg-blue-50 disabled:opacity-55 dark:text-slate-200 dark:hover:bg-violet-500/10"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isApplied ? 'Applied' : 'Mark as Applied'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onTailorCv()
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-800 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-violet-500/10"
              >
                <FileText className="h-3.5 w-3.5" />
                Tailor CV
              </button>
              <button
                type="button"
                onClick={() => {
                  onTrainInterview()
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-800 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-violet-500/10"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Train Interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
