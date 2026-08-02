'use client'

import { cn } from '@/lib/utils'
import type { CvPlanStageId } from '@/lib/cv-builder/suggestions'

type Props = {
  activeStage: CvPlanStageId
  recommendedStage: CvPlanStageId
  stageLabel: string
  onChange: (stage: CvPlanStageId) => void
  showAfterWarning?: boolean
  workNowButtonLabel?: string
  afterTrainingButtonLabel?: string
  afterTrainingWarning?: string | null
}

/** Inline compact stage switcher for the CV Builder header. */
export default function CvPlanStageSwitcher({
  activeStage,
  recommendedStage,
  stageLabel,
  onChange,
  showAfterWarning,
  workNowButtonLabel = 'Work Now CV',
  afterTrainingButtonLabel = 'After Training CV',
  afterTrainingWarning,
}: Props) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-violet-200/80 truncate">{stageLabel}</p>
      <div className="inline-flex rounded-md border border-slate-700/70 bg-slate-950/40 p-0.5 gap-0.5">
        <button
          type="button"
          onClick={() => onChange('work_now')}
          className={cn(
            'rounded px-2 py-1 text-[10px] font-semibold transition whitespace-nowrap',
            activeStage === 'work_now'
              ? 'bg-violet-500/25 text-violet-100'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          {workNowButtonLabel}
          {recommendedStage === 'work_now' ? ' · rec' : ''}
        </button>
        <button
          type="button"
          onClick={() => onChange('after_upgrade')}
          className={cn(
            'rounded px-2 py-1 text-[10px] font-semibold transition whitespace-nowrap',
            activeStage === 'after_upgrade'
              ? 'bg-cyan-500/20 text-cyan-100'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          {afterTrainingButtonLabel}
          {recommendedStage === 'after_upgrade' ? ' · rec' : ''}
        </button>
      </div>
      {showAfterWarning && activeStage === 'after_upgrade' && afterTrainingWarning && (
        <p className="text-[10px] text-amber-200/80 leading-snug line-clamp-2">{afterTrainingWarning}</p>
      )}
    </div>
  )
}
