'use client'

import { cn } from '@/lib/utils'
import type { CvWorkflowStep } from '@/lib/cv-optimization'
import {
  CheckCircle2,
  Circle,
  Lock,
  Sparkles,
  FileText,
  Target,
  Zap,
  Mail,
  MessageSquare,
} from 'lucide-react'

type Props = {
  steps: CvWorkflowStep[]
  subtitle?: string
  title?: string
}

const STEP_ICONS: Record<CvWorkflowStep['id'], typeof FileText> = {
  build: FileText,
  ats: Target,
  impact: Zap,
  cover: Mail,
  interview: MessageSquare,
}

function stepIcon(status: CvWorkflowStep['status']) {
  if (status === 'complete') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
  if (status === 'locked') return <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
  if (status === 'recommended') return <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
  return <Circle className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20 shrink-0" />
}

export default function CvAiWorkflowStrip({ steps, subtitle, title }: Props) {
  const activeProgress = Math.round(
    steps.reduce((sum, s) => sum + s.progress, 0) / Math.max(steps.length, 1)
  )

  return (
    <section className="rounded-lg border border-slate-700/50 bg-slate-950/50 overflow-hidden">
      <div className="px-2.5 py-1.5 border-b border-slate-700/40 bg-gradient-to-r from-violet-950/40 to-slate-950/80">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold text-slate-100 truncate">{title ?? 'AI Optimization Mission'}</h2>
            <p className="text-[9px] text-slate-500 mt-0.5 truncate">
              {subtitle ?? 'Guided workflow to interview-ready'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Progress</p>
            <p className="text-xs font-bold text-violet-300 tabular-nums">{activeProgress}%</p>
          </div>
        </div>
        <div className="mt-1.5 h-0.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700 ease-out"
            style={{ width: `${activeProgress}%` }}
          />
        </div>
      </div>

      <div className="p-1.5 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {steps.map((step) => {
            const Icon = STEP_ICONS[step.id]
            const unlocked = step.status !== 'locked'

            return (
              <div
                key={step.id}
                title={step.hint}
                className={cn(
                  'relative flex flex-col w-[96px] rounded-md border px-1.5 py-1.5 transition-all',
                  step.status === 'active' &&
                    'border-violet-500/40 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.25)]',
                  step.status === 'complete' && 'border-emerald-500/30 bg-emerald-500/5',
                  step.status === 'recommended' && 'border-violet-500/25 bg-violet-500/5',
                  step.status === 'locked' && 'border-slate-700/50 bg-slate-900/30 opacity-60'
                )}
              >
                <div className="flex items-center gap-1 mb-1">
                  {stepIcon(step.status)}
                  <Icon className={cn('w-3 h-3', unlocked ? 'text-slate-400' : 'text-slate-600')} />
                </div>
                <p className="text-[10px] font-medium text-slate-200 leading-tight">{step.label}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 tabular-nums">{step.progress}%</p>
                {unlocked && (
                  <div className="mt-1 h-0.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        step.status === 'complete'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-violet-500 to-cyan-400'
                      )}
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
