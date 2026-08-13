'use client'

import type { PathwayDetailMatchExplanation } from '@/lib/career-engine/pathway-knowledge'
import { cn } from '@/lib/utils'

type Props = {
  match: PathwayDetailMatchExplanation | null
  regulated: boolean
}

export function PathwayEligibilitySummary({ match, regulated }: Props) {
  if (!match) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Your position on this path</h2>
        <p className="mt-2 text-sm text-slate-400">
          Open this pathway from your assessment results to see a personalised eligibility summary.
          Library requirements below still apply.
        </p>
        {regulated ? (
          <p className="mt-3 text-sm text-amber-200/90">
            This may be a regulated pathway. Confirm requirements with the relevant professional body
            before applying.
          </p>
        ) : null}
      </section>
    )
  }

  const positives = match.why.filter((w) => w.kind === 'positive')
  const accessible = match.assessment_says_accessible_now

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">Your position on this path</h2>

      <p
        className={cn(
          'rounded-xl px-3 py-2 text-sm font-medium',
          accessible
            ? 'bg-emerald-500/15 text-emerald-100'
            : match.match_status === 'Needs review' ||
                match.match_status === 'Requirements still needed'
              ? 'bg-amber-500/15 text-amber-100'
              : 'bg-sky-500/15 text-sky-100'
        )}
      >
        {accessible
          ? 'Based on your assessment answers, this role looks accessible now — still check professional requirements below.'
          : match.match_status === 'Future career option'
            ? 'This is a longer-term progression option, not an immediate apply-now match.'
            : match.match_status === 'Needs review'
              ? 'This pathway needs review before it can be treated as eligible.'
              : match.match_status === 'Requirements still needed'
                ? 'Additional requirements still need to be met before this role is accessible.'
                : 'This is a next-step or conditional option — not unrestricted eligibility.'}
      </p>

      {positives.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            What already matches
          </h3>
          <ul className="mt-2 space-y-1.5">
            {positives.map((p) => (
              <li key={p.text} className="flex gap-2 text-sm text-slate-300">
                <span aria-hidden>✔️</span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {match.blockers.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
            What is still required
          </h3>
          <ul className="mt-2 space-y-1.5">
            {match.blockers.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-amber-100/90">
                <span aria-hidden>•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {match.warnings.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-300/90">
            Warnings to note
          </h3>
          <ul className="mt-2 space-y-1.5">
            {match.warnings.map((w) => (
              <li key={w} className="flex gap-2 text-sm text-orange-100/90">
                <span aria-hidden>⚠️</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {match.next_step ? (
        <p className="text-sm text-slate-300">
          <span className="font-medium text-slate-200">Suggested next step: </span>
          {match.next_step}
        </p>
      ) : null}

      {regulated ? (
        <p className="border-t border-white/10 pt-3 text-sm text-amber-200/90">
          Regulated pathway: confirm registration, licensing, or recognition with the relevant
          professional body. JobAZ guidance is not a substitute for official confirmation.
        </p>
      ) : null}
    </section>
  )
}
