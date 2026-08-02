'use client'

import { ArrowRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NextJourneyStep = {
  step: string
  title: string
  description: string
  action: () => void
  actionText: string
}

type Props = {
  nextStep: NextJourneyStep
}

export default function NextSmartMoveCard({ nextStep }: Props) {
  return (
    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-900/50 px-4 py-4 md:px-5 md:py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 border border-violet-500/40">
          <Zap className="h-5 w-5 text-violet-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-violet-300/90 mb-1">Next Smart Move</p>
          <h3 className="text-base font-semibold text-slate-50">{nextStep.title}</h3>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{nextStep.description}</p>
          <button
            type="button"
            onClick={nextStep.action}
            className={cn(
              'mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition',
              'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
              'shadow-[0_0_18px_rgba(139,92,246,0.5)]'
            )}
          >
            {nextStep.actionText}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
