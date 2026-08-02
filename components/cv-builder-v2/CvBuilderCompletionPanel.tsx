'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import type { CvJourneyNextStep } from '@/lib/cv-builder/cvCareerReadiness'

type Props = {
  cvScore: number
  nextStep: CvJourneyNextStep
  onDismiss?: () => void
  onScrollToTailor?: () => void
}

export default function CvBuilderCompletionPanel({
  cvScore,
  nextStep,
  onDismiss,
  onScrollToTailor,
}: Props) {
  return (
    <section className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-950/90 to-slate-950/80 p-4 shadow-[0_0_40px_rgba(16,185,129,0.12)]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-100">Great work!</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Your CV is now ready {cvScore >= 70 ? '(strong quality)' : '(good progress)'}.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-500 hover:text-slate-300"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="rounded-lg border border-emerald-500/20 bg-slate-900/50 px-3 py-3">
        <p className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-semibold mb-1">
          Next recommended step
        </p>
        <p className="text-sm font-medium text-slate-100">{nextStep.title}</p>
        <p className="text-xs text-slate-400 mt-1">{nextStep.description}</p>

        {nextStep.href ? (
          <Link
            href={nextStep.href}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : nextStep.action === 'scroll-jd' ? (
          <button
            type="button"
            onClick={onScrollToTailor}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Tailor CV now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    </section>
  )
}
