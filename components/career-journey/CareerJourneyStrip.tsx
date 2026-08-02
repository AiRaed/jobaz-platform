'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JOURNEY_STEPS } from '@/lib/career-journey/actionPlanTypes'

type Props = {
  currentStep: number
  /** When omitted, uses the default journey without a training phase. */
  steps?: readonly string[]
  className?: string
}

export default function CareerJourneyStrip({ currentStep, steps, className }: Props) {
  const journeySteps = steps ?? JOURNEY_STEPS
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-700/50 bg-slate-950/50 px-3 py-3 overflow-x-auto',
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Your journey</p>
      <ol className="flex items-center gap-1 min-w-max">
        {journeySteps.map((step, index) => {
          const done = index < currentStep
          const current = index === currentStep
          return (
            <li key={step} className="flex items-center">
              <div
                className={cn(
                  'flex flex-col items-center gap-1 px-2',
                  current && 'scale-105'
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border',
                    done && 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
                    current && !done && 'bg-violet-500/25 border-violet-400/50 text-violet-200',
                    !done && !current && 'bg-slate-900 border-slate-700 text-slate-500'
                  )}
                >
                  {done ? <Check className="w-3 h-3" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'text-[9px] font-medium whitespace-nowrap',
                    current ? 'text-violet-200' : done ? 'text-emerald-400/80' : 'text-slate-500'
                  )}
                >
                  {step}
                </span>
              </div>
              {index < journeySteps.length - 1 && (
                <span className={cn('text-slate-600 text-xs mx-0.5', done && 'text-emerald-600/60')}>↓</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
