'use client'

import { useState } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResolvedCvSuggestions, CvSummarySuggestionId } from '@/lib/cv-builder/suggestions'

type Props = {
  suggestions: ResolvedCvSuggestions
  onInsert: (summary: string) => void
}

/** Compact segmented AI Summary Assistant — Work Now / After Training / General. */
export default function CvSummaryAssistant({ suggestions, onInsert }: Props) {
  const [selectedSummaryType, setSelectedSummaryType] = useState<CvSummarySuggestionId | null>(null)
  const [pendingWarning, setPendingWarning] = useState<{
    selected: CvSummarySuggestionId
    warning: string
    summary: string
  } | null>(null)

  const recommendedId: CvSummarySuggestionId =
    suggestions.recommendedStage === 'after_upgrade' ? 'after_upgrade' : 'work_now'

  const defaultAfterWarning =
    suggestions.afterTrainingWarning ||
    'Use this version only after you complete the recommended training upgrade.'

  const selectedItem =
    suggestions.summarySuggestions.find((s) => s.id === selectedSummaryType) ?? null

  const applySummary = (selected: CvSummarySuggestionId, summary: string) => {
    setSelectedSummaryType(selected)
    onInsert(summary)
    setPendingWarning(null)
  }

  const handleClick = (id: CvSummarySuggestionId) => {
    const item = suggestions.summarySuggestions.find((s) => s.id === id)
    if (!item) return

    setSelectedSummaryType(id)

    const summary = item.buildSummary({
      trainingStatus: suggestions.trainingStatus,
      currentTarget: suggestions.currentTarget,
      nextUpgrade: suggestions.nextUpgrade,
    })

    const needsWarn =
      Boolean(item.requiresCompletedUpgrade) && suggestions.trainingStatus !== 'completed'

    if (needsWarn) {
      setPendingWarning({
        selected: id,
        warning: item.warning || defaultAfterWarning,
        summary,
      })
      return
    }

    applySummary(id, summary)
  }

  const shortLabel = (id: CvSummarySuggestionId, full: string) => {
    if (id === 'work_now') return 'Work Now'
    if (id === 'after_upgrade') return 'After Training'
    if (id === 'general') return 'General'
    return full.replace(/^Write\s+/i, '').replace(/\s+Summary$/i, '')
  }

  return (
    <div className="rounded-lg border border-cyan-500/25 bg-cyan-950/15 p-2.5 mb-3 space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-100 leading-none">AI Summary Assistant</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
            {suggestions.routeTitle}
          </p>
        </div>
      </div>

      <div
        className="flex rounded-lg border border-slate-700/70 bg-slate-950/50 p-0.5 gap-0.5"
        role="group"
        aria-label="Summary stage"
      >
        {suggestions.summarySuggestions.map((item) => {
          const isSelected = selectedSummaryType === item.id
          const isRecommended = item.id === recommendedId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              aria-pressed={isSelected}
              title={item.helperText}
              className={cn(
                'flex-1 min-w-0 rounded-md px-2 py-1.5 text-[11px] font-semibold transition text-center',
                isSelected
                  ? 'bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <span className="block truncate">{shortLabel(item.id, item.buttonLabel)}</span>
              {isRecommended && !isSelected && (
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                  Rec
                </span>
              )}
              {isSelected && (
                <span className="block text-[8px] uppercase tracking-wider text-violet-300/90 font-medium mt-0.5">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedItem && (
        <p className="text-[10px] text-slate-500 leading-snug px-0.5">{selectedItem.helperText}</p>
      )}

      {pendingWarning && selectedSummaryType === pendingWarning.selected && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 space-y-1.5">
          <p className="text-[11px] text-amber-100 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            {pendingWarning.warning}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applySummary(pendingWarning.selected, pendingWarning.summary)}
              className="inline-flex items-center rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-500"
            >
              Insert anyway
            </button>
            <button
              type="button"
              onClick={() => setPendingWarning(null)}
              className="inline-flex items-center rounded-md border border-slate-600 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-500/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
