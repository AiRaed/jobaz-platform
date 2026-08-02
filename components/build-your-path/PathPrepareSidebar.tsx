'use client'

import {
  FileText,
  Mail,
  Search,
  MessageSquare,
  Target,
  Bookmark,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  isLoggedIn: boolean
  isTracked: boolean
  onCreateCv: () => void
  onCoverLetter: () => void
  onUnlockJobs: () => void
  onPracticeInterview: () => void
  onTrackProgress: () => void
}

export default function PathPrepareSidebar({
  isLoggedIn,
  isTracked,
  onCreateCv,
  onCoverLetter,
  onUnlockJobs,
  onPracticeInterview,
  onTrackProgress,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20 p-5">
        <h2 className="text-lg font-bold text-slate-200 mb-1">Prepare with JobAZ</h2>
        <p className="text-xs text-slate-400 mb-4">
          Tools to turn this path into applications and interviews
        </p>
        <div className="space-y-2">
          <ToolBtn icon={FileText} title="Create a CV for this path" sub="CV Builder with path suggestions" onClick={onCreateCv} />
          <ToolBtn icon={Mail} title="Write a cover letter" sub="Cover Letter AI" onClick={onCoverLetter} />
          <ToolBtn icon={MessageSquare} title="Practice interview" sub="Interview Coach" onClick={onPracticeInterview} />
          <ToolBtn
            icon={Search}
            title="Unlock matching jobs"
            sub={isLoggedIn ? 'View real openings for this path' : 'Sign in to view openings'}
            onClick={onUnlockJobs}
            highlight
          />
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/15 to-slate-950/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Track my journey</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Save progress, courses, and next steps for this career path
        </p>
        <button
          type="button"
          onClick={onTrackProgress}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition',
            isTracked
              ? 'border border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white hover:opacity-90 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
          )}
        >
          {isTracked ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Path saved
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              Track my progress
            </>
          )}
        </button>
        {!isLoggedIn && (
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Free account: save path, courses, and unlock jobs
          </p>
        )}
      </div>
    </div>
  )
}

function ToolBtn({
  icon: Icon,
  title,
  sub,
  onClick,
  highlight,
}: {
  icon: typeof FileText
  title: string
  sub: string
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3.5 rounded-lg border text-left transition',
        highlight
          ? 'border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400/50'
          : 'border-violet-500/30 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10'
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0', highlight ? 'text-cyan-400' : 'text-violet-400')} />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-200">{title}</div>
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
    </button>
  )
}

