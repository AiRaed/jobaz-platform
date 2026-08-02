'use client'

import { useState, useRef, useEffect } from 'react'
import { Target, MoreHorizontal, Bookmark, FileText, GraduationCap } from 'lucide-react'
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
}

export default function RecommendedJobCard({
  job,
  isSaved,
  onView,
  onSave,
  onTailorCv,
  onTrainInterview,
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
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
            match >= 70
              ? 'bg-emerald-500/20 text-emerald-300'
              : match >= 50
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-700/50 text-slate-400'
          )}
        >
          <Target className="w-3 h-3" />
          {match}% Match
        </span>
        <span
          className={cn(
            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
            job.isTraining ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
          )}
        >
          {job.isTraining ? 'Training' : 'Job'}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-50 mb-1 line-clamp-2">{job.title}</h3>
      <p className="text-sm text-violet-300 font-medium mb-0.5">{job.company}</p>
      <p className="text-xs text-slate-400 mb-3">{job.location}</p>

      {job.description && (
        <p className="text-xs text-slate-300 leading-snug mb-4 line-clamp-2 flex-1">{job.description}</p>
      )}

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-full bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.6)]"
        >
          View Job
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600/70 bg-slate-800/80 text-slate-300 hover:border-violet-400/60 hover:text-violet-200 transition"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-20 min-w-[160px] rounded-xl border border-slate-700/60 bg-slate-950/95 py-1 shadow-xl backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  onSave()
                  setMenuOpen(false)
                }}
                disabled={isSaved}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-violet-500/10 disabled:opacity-50"
              >
                <Bookmark className="h-3.5 w-3.5" />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onTailorCv()
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-violet-500/10"
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
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-violet-500/10"
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
