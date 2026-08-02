'use client'

import Link from 'next/link'
import { Compass, ArrowRight, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/trackEvent'

export default function AiCareerPathCta() {
  return (
    <section className="mb-10 max-w-3xl mx-auto px-1">
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-slate-900/40 p-6 md:p-8 shadow-[0_0_48px_rgba(37,99,235,0.18)] backdrop-blur-xl transition hover:border-blue-400/35 hover:shadow-[0_0_56px_rgba(37,99,235,0.28)]">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="relative flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            Free · No sign-up required
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-white leading-snug">
            Discover your UK career path with AI
          </h2>
          <p className="text-sm md:text-base text-slate-300/90 max-w-xl">
            Answer 5 quick questions and get a personalised starting plan — CV, jobs, skills, and
            interview prep tailored to your situation.
          </p>
          <Link
            href="/ai-career-path"
            onClick={() => {
              trackEvent('homepage_ai_path_cta_clicked', { destination: '/ai-career-path' }).catch(
                () => {}
              )
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:scale-[1.02] hover:shadow-blue-900/55"
          >
            <Compass className="h-4 w-4" />
            Start Free AI Assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
