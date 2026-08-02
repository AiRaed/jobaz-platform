'use client'

import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HorizontalProgressBar, PremiumCard } from './shared'

const STEPS = [
  { id: 'writing', label: 'Writing' },
  { id: 'voice', label: 'Voice' },
  { id: 'hard', label: 'Hard Mode' },
  { id: 'interviewSimulation', label: 'Simulation' },
] as const

type StepId = (typeof STEPS)[number]['id']

type Props = {
  activeTab: StepId
  progress: { writing: number; voice: number; hard: number; full: number }
  overallReadiness: number
  onTabChange: (tab: StepId) => void
}

function stepProgress(id: StepId, progress: Props['progress']): number {
  if (id === 'writing') return progress.writing
  if (id === 'voice') return progress.voice
  if (id === 'hard') return progress.hard
  return progress.full
}

export default function InterviewJourneyProgress({
  activeTab,
  progress,
  overallReadiness,
  onTabChange,
}: Props) {
  return (
    <PremiumCard className="mb-4 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-violet-950/30 to-slate-950/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">
            Career Journey · Interview Prep
          </p>
          <p className="text-sm font-medium text-slate-200">Overall Interview Readiness</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-violet-300 tabular-nums">{overallReadiness}%</p>
        </div>
      </div>

      <div className="px-4 py-3">
        <HorizontalProgressBar value={overallReadiness} className="mb-4" />
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {STEPS.map((step, index) => {
            const pct = stepProgress(step.id, progress)
            const done = pct >= 100
            const current = activeTab === step.id
            return (
              <li key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onTabChange(step.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
                    done && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                    current && !done && 'border-violet-500/40 bg-violet-500/15 text-violet-100',
                    !done && !current && 'border-slate-700/40 text-slate-500 hover:text-slate-300'
                  )}
                >
                  {done ? (
                    <Check className="w-3 h-3 shrink-0" />
                  ) : current ? (
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  ) : null}
                  {step.label}
                  {done && <span className="text-[9px] opacity-80">✓</span>}
                  {current && !done && <span className="text-[9px] text-violet-300/80">(now)</span>}
                </button>
                {index < STEPS.length - 1 && (
                  <span className="text-slate-600 mx-0.5 hidden sm:inline">→</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </PremiumCard>
  )
}
