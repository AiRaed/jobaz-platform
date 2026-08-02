'use client'

import { Loader2, Check, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIssueTypeLabel, getSeverityLabel, severityBadgeClass, typeBadgeClass } from '@/lib/proofreading/issueDisplay'

export type IssueCardIssue = {
  id: string
  type: string
  severity: 'low' | 'moderate' | 'high'
  message: string
  original_text: string
  suggestion_text?: string
  start_index?: number
  end_index?: number
  action?: 'replace' | 'delete' | 'insert'
  status: 'open' | 'applied' | 'rejected'
}

type Props = {
  issue: IssueCardIssue
  fallbackOriginal?: string
  onApply: () => void
  onReject: () => void
  onFocus?: () => void
  applying?: boolean
  applyDisabled?: boolean
  selected?: boolean
}

export default function IssueCard({
  issue,
  fallbackOriginal,
  onApply,
  onReject,
  onFocus,
  applying,
  applyDisabled,
  selected,
}: Props) {
  const canApply =
    Boolean(issue.suggestion_text?.trim()) ||
    issue.type === 'repetition' ||
    issue.action === 'delete'
  const original =
    issue.original_text ||
    (fallbackOriginal && issue.start_index != null && issue.end_index != null
      ? fallbackOriginal.substring(issue.start_index, issue.end_index)
      : '')

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFocus?.()
        }
      }}
      className={cn(
        'rounded-xl border p-3 transition-all duration-200 cursor-pointer',
        selected && issue.status === 'open'
          ? 'ring-2 ring-violet-400/60 border-violet-400/50'
          : '',
        issue.status === 'applied'
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : issue.status === 'rejected'
            ? 'bg-slate-900/40 border-slate-700/40 opacity-75'
            : 'bg-slate-900/60 border-slate-700/50 hover:border-violet-500/30'
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', typeBadgeClass(issue.type))}>
          {getIssueTypeLabel(issue.type)}
        </span>
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', severityBadgeClass(issue.severity))}>
          {getSeverityLabel(issue.severity)}
        </span>
        {issue.status === 'applied' && (
          <span className="text-[10px] text-emerald-400 font-medium">Applied</span>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <p className="text-[10px] uppercase text-slate-500 mb-1">Original</p>
          <p className="font-mono text-slate-200 bg-slate-950/60 rounded px-2 py-1.5 break-words">{original || '—'}</p>
        </div>
        {issue.suggestion_text ? (
          <div>
            <p className="text-[10px] uppercase text-slate-500 mb-1">Suggested revision</p>
            <p className="font-mono text-emerald-300 bg-emerald-950/20 rounded px-2 py-1.5 break-words border border-emerald-500/20">
              {issue.suggestion_text}
            </p>
          </div>
        ) : issue.type === 'repetition' || issue.action === 'delete' ? (
          <p className="text-slate-400 italic">Suggested revision: remove duplicate text.</p>
        ) : (
          <p className="text-amber-300/90 italic">Review manually — no automatic replacement.</p>
        )}
        <div>
          <p className="text-[10px] uppercase text-slate-500 mb-1">Explanation</p>
          <p className="text-slate-400 leading-relaxed">{issue.message}</p>
        </div>
      </div>

      {issue.status === 'open' && (
        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onApply}
            disabled={applyDisabled || !canApply || applying}
            className={cn(
              'flex-1 px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition',
              canApply && !applyDisabled && !applying
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Apply fix
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={applying}
            className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1 transition"
          >
            <XCircle className="w-3 h-3" />
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
