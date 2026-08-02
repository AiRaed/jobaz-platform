'use client'

import { cn } from '@/lib/utils'
import type { WorkflowStep } from '@/lib/job-application/types'
import {
  CheckCircle2,
  Circle,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

type Props = {
  steps: WorkflowStep[]
  applicationStrength: number
  dimensions: {
    cvQuality: number
    atsMatch: number
    coverLetter: number | null
    interviewReadiness: number
  }
}

function stepIcon(status: WorkflowStep['status']) {
  if (status === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (status === 'locked') return <Lock className="w-4 h-4 text-slate-600" />
  if (status === 'recommended') return <Sparkles className="w-4 h-4 text-violet-400" />
  return <Circle className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
}

export default function ApplicationWorkflowPanel({ steps, applicationStrength, dimensions }: Props) {
  return (
    <section className="rounded-xl border border-slate-700/50 bg-slate-950/50 shadow-[0_12px_32px_rgba(15,23,42,0.6)] overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/40 bg-gradient-to-r from-violet-950/40 to-slate-950/80">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Application mission</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Guided prep workflow</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Strength</p>
            <p className="text-lg font-bold text-violet-300 tabular-nums">{applicationStrength}%</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700 ease-out"
            style={{ width: `${applicationStrength}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
          <Metric label="CV Quality" value={dimensions.cvQuality} />
          <Metric label="ATS Match" value={dimensions.atsMatch} />
          <Metric
            label="Cover Letter"
            value={dimensions.coverLetter ?? 0}
            muted={dimensions.coverLetter === null}
            missing={dimensions.coverLetter === null}
          />
          <Metric label="Interview" value={dimensions.interviewReadiness} />
        </div>
      </div>

      <div className="p-3 space-y-0">
        {steps.map((step, i) => (
          <div key={step.id} className="relative flex gap-3">
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'absolute left-[11px] top-7 w-px h-[calc(100%-4px)]',
                  step.status === 'complete' ? 'bg-emerald-500/40' : 'bg-slate-700/60'
                )}
              />
            )}
            <div className="relative z-10 mt-2 shrink-0">{stepIcon(step.status)}</div>
            <div
              className={cn(
                'flex-1 py-2.5 px-2.5 rounded-lg mb-1 transition-colors',
                step.status === 'active' && 'bg-violet-500/10 border border-violet-500/25',
                step.status === 'recommended' && 'bg-violet-500/5 border border-violet-500/15',
                step.status === 'complete' && 'opacity-90',
                step.status === 'locked' && 'opacity-50'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-200">{step.label}</p>
                {step.status === 'recommended' && (
                  <span className="text-[9px] uppercase tracking-wide text-violet-400">Next</span>
                )}
                {step.status === 'active' && (
                  <ChevronRight className="w-3 h-3 text-violet-400" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{step.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  muted,
  missing,
}: {
  label: string
  value: number
  muted?: boolean
  missing?: boolean
}) {
  return (
    <div className="rounded-md bg-slate-900/60 px-2 py-1.5 border border-slate-800/80">
      <p className="text-slate-500 truncate">{label}</p>
      <p className={cn('font-semibold tabular-nums', muted ? 'text-slate-600' : 'text-slate-300')}>
        {missing ? 'Missing' : `${value}%`}
      </p>
    </div>
  )
}
