'use client'

import { ArrowRight, Compass, Sparkles } from 'lucide-react'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'

export default function CareerPlanEmptyState() {
  return (
    <section className="rounded-3xl border border-dashed border-violet-500/30 bg-slate-950/60 p-10 md:p-14 text-center">
      <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-slate-50 mb-3">Your career plan starts here</h2>
      <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
        Start the Career Assistant to build your personalised career plan.
      </p>
      <UkCareerAssistantLink
        href="/uk-career-assistant"
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition shadow-[0_0_24px_rgba(139,92,246,0.35)]"
      >
        <Compass className="w-4 h-4" />
        Start Career Assistant
        <ArrowRight className="w-4 h-4" />
      </UkCareerAssistantLink>
    </section>
  )
}
