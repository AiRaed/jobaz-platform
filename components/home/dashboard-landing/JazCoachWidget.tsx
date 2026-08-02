'use client'

import { ArrowRight } from 'lucide-react'
import JazEyeIcon from '@/components/ui/JazEyeIcon'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'

/** Visual-only capability chips — not clickable CTAs on landing. */
const GOAL_CHIPS = [
  'Education',
  'Experience',
  'New career',
  'Growth',
  'Extra income',
  'Business',
] as const

export default function JazCoachWidget() {
  return (
    <section className="w-full" aria-label="AI Career Coach assessment">
      <div className="jaz-coach-panel jobaz-hero jobaz-keep-light relative w-full rounded-2xl border border-slate-400/20 overflow-hidden">
        <div className="jaz-coach-panel__glow" aria-hidden />
        <div className="jaz-coach-panel__scan" aria-hidden />

        <div className="relative px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="jaz-coach-icon-shell shrink-0 mt-0.5">
                <JazEyeIcon variant="header" glow className="shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold text-slate-50 leading-tight">
                    JAZ · AI Career Coach
                  </p>
                  <p className="text-[10px] text-emerald-300/95 inline-flex items-center gap-1">
                    <span className="jaz-coach-status-dot h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                    Ready to guide you
                  </p>
                </div>
                <p className="jaz-coach-greeting text-sm text-slate-100 leading-snug mt-1 max-w-xl">
                  Find your fastest practical route to work in the UK.
                </p>
                <p className="text-[11px] text-slate-300/90 mt-0.5 leading-snug max-w-xl">
                  JAZ understands your goal, skills, experience and next step.
                </p>
              </div>
            </div>

            <div className="lg:max-w-xs xl:max-w-sm shrink-0">
              <p className="text-[9px] uppercase tracking-widest text-slate-400/90 mb-1.5">
                Understands
              </p>
              <ul className="flex flex-wrap gap-1" aria-label="Goals JAZ understands">
                {GOAL_CHIPS.map((chip) => (
                  <li
                    key={chip}
                    className="jaz-coach-chip inline-flex items-center rounded-full border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-slate-200/95 select-none pointer-events-none"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 border-t border-white/10 pt-2.5">
            <UkCareerAssistantLink className="jobaz-btn-primary jobaz-btn-primary-sm jaz-coach-cta group w-full sm:w-auto">
              Start Career Assistant
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </UkCareerAssistantLink>
            <p className="text-[10px] text-slate-300/90">Free assessment · No account needed</p>
          </div>
        </div>
      </div>
    </section>
  )
}
