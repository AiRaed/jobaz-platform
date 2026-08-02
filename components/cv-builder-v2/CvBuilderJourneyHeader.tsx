'use client'

import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const CV_JOURNEY_STEPS = [
  { id: 'assessment', label: 'Assessment' },
  { id: 'build', label: 'Build CV' },
  { id: 'tailor', label: 'Tailor CV' },
  { id: 'jobs', label: 'Find Jobs' },
  { id: 'interview', label: 'Interview Prep' },
  { id: 'apply', label: 'Apply' },
] as const

type Props = {
  currentStepIndex?: number
  className?: string
}

/** Compact non-dominant journey strip for CV Builder. */
export default function CvBuilderJourneyHeader({
  currentStepIndex = 1,
  className,
}: Props) {
  return (
    <nav
      aria-label="Career journey"
      className={cn(
        'rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2',
        className
      )}
    >
      <ol className="flex flex-wrap items-center gap-x-0.5 gap-y-1.5">
        {CV_JOURNEY_STEPS.map((step, index) => {
          const done = index < currentStepIndex
          const current = index === currentStepIndex
          return (
            <li key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                  done && 'text-emerald-400/90',
                  current && 'text-violet-200 bg-violet-500/10',
                  !done && !current && 'text-slate-500'
                )}
              >
                {done ? (
                  <Check className="w-2.5 h-2.5 shrink-0" />
                ) : current ? (
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                ) : null}
                {step.label}
              </div>
              {index < CV_JOURNEY_STEPS.length - 1 && (
                <span className="text-slate-700 mx-0.5 text-[10px] hidden sm:inline">→</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
