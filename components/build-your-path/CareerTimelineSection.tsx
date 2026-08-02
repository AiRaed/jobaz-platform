'use client'

import { MapPin } from 'lucide-react'
import type { TimelineStep } from '@/lib/build-your-path/types'

type Props = { steps: TimelineStep[] }

export default function CareerTimelineSection({ steps }: Props) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
      <h2 className="text-lg font-bold text-slate-200 mb-1">Your Estimated Journey</h2>
      <p className="text-xs text-slate-500 mb-5">A realistic roadmap â€” adjust based on your pace and funding</p>
      <ol className="relative space-y-0 pl-1">
        {steps.map((step, idx) => (
          <li key={idx} className="relative flex gap-4 pb-6 last:pb-0">
            {idx < steps.length - 1 && (
              <span className="absolute left-[7px] top-4 bottom-0 w-px bg-gradient-to-b from-violet-500/50 to-transparent" />
            )}
            <span className="relative z-10 mt-0.5 w-4 h-4 rounded-full border-2 border-violet-400 bg-violet-950 shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
            <div className="min-w-0 flex-1 -mt-0.5">
              <p className="text-xs font-semibold text-violet-300 uppercase tracking-wide">{step.period}</p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">{step.milestone}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}



