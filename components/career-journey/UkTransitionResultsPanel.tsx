'use client'

import type { ReactNode } from 'react'
import type { UkTransitionGrowthOutput } from '@/lib/career-brain/ukTransition/ukTransitionTypes'

type Props = {
  growth: UkTransitionGrowthOutput
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40">
      <p className="text-[10px] uppercase tracking-wider font-medium text-sky-300/90 mb-2">{title}</p>
      {children}
    </div>
  )
}

export default function UkTransitionResultsPanel({ growth }: Props) {
  const r = growth.finalReport

  return (
    <div className="p-4 rounded-xl border border-sky-500/25 bg-sky-950/10 space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-wider font-medium text-sky-300">New to the UK — Career Path</p>
        <p className="text-sm text-slate-200 mt-2 leading-relaxed">{r.transitionSummary}</p>
        <p className="text-xs text-slate-500 mt-2">
          {r.recommendedRouteLabel}
          {r.pathLetter ? (
            <>
              {' '}
              · <span className="text-sky-200">{r.categoryLabel}</span>
            </>
          ) : null}
        </p>
      </div>

      <Section title="Why this path">
        <p className="text-sm text-slate-300 leading-relaxed">{r.whyRecommended}</p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{r.categoryExplanation}</p>
      </Section>

      {r.whatYouBring.length > 0 && (
        <Section title="What you bring">
          <ul className="text-sm text-slate-300 space-y-1">
            {r.whatYouBring.map((s) => (
              <li key={s} className="border-l border-emerald-500/40 pl-3">
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(r.recommendedCertifications.length > 0 || r.recommendedCourses.length > 0) && (
        <Section title="Recommended courses & licences">
          <ul className="text-sm text-slate-300 space-y-1">
            {[...r.recommendedCertifications, ...r.recommendedCourses].map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-2">Training is optional — job options below work without courses too.</p>
        </Section>
      )}

      {r.recommendedJobs.length > 0 && (
        <Section title="Suggested jobs">
          <ul className="space-y-2">
            {r.recommendedJobs.map((j) => (
              <li key={j.title} className="text-sm border-l border-violet-500/40 pl-3">
                <p className="font-medium text-slate-100">{j.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{j.why}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Recommended JobAZ tools">
        <ul className="space-y-3">
          {growth.recommendedJobAZActions.map((a) => (
            <li key={a.action} className="text-sm">
              {a.href ? (
                <a href={a.href} className="text-sky-300 hover:text-sky-200 font-medium underline underline-offset-2">
                  {a.label}
                </a>
              ) : (
                <p className="font-medium text-slate-100">{a.label}</p>
              )}
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{a.why}</p>
            </li>
          ))}
        </ul>
      </Section>

      <div className="p-4 rounded-lg border border-emerald-500/25 bg-emerald-950/15">
        <p className="text-[10px] uppercase tracking-wider text-emerald-300 mb-1">Next step</p>
        <p className="text-sm text-slate-100 leading-relaxed">{r.bestNextAction}</p>
      </div>
    </div>
  )
}
