'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PathwayMatchSummary } from '@/lib/career-engine/pathway-knowledge'
import { savePathwayMatchContext } from '@/lib/career-engine/work-in-education/wizard/session'
import { cn } from '@/lib/utils'
import { PathwayActions } from './PathwayActions'

type Props = {
  match: PathwayMatchSummary
  className?: string
  /** Global match-safety type — drives CTA priority */
  matchType?:
    | 'best_immediate_route'
    | 'developing_match'
    | 'future_career_option'
    | 'needs_review_regulated'
    | 'not_recommended_now'
}

function scorePercent(score: number): number {
  // Scoring v2 uses 0–100. Legacy 0–1 values still supported.
  if (!Number.isFinite(score) || score < 0) return 0
  if (score <= 1) return Math.round(score * 100)
  return Math.round(Math.min(100, score))
}

function statusTone(label: string) {
  const l = label.toLowerCase()
  if (l.includes('eligible now')) return 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30'
  if (l.includes('developing')) return 'bg-sky-500/20 text-sky-100 border-sky-500/30'
  if (l.includes('future') || l.includes('academic'))
    return 'bg-violet-500/20 text-violet-100 border-violet-500/30'
  if (l.includes('requirements') || l.includes('long-term'))
    return 'bg-amber-500/20 text-amber-100 border-amber-500/30'
  if (l.includes('review')) return 'bg-orange-500/20 text-orange-100 border-orange-500/30'
  return 'bg-slate-500/20 text-slate-100 border-slate-500/30'
}

/**
 * Career pathway result card.
 * Shows one primary status badge + score from Scoring v2 (0–100).
 */
export function CareerPathwayCard({ match, className, matchType }: Props) {
  const pathwayHref = `/career-assistant/work-in-my-education/pathway/${encodeURIComponent(match.pathway_id)}`
  const percent = scorePercent(match.match_score)
  // Prefer eligibility status as the single main badge; fall back to category
  const mainBadge = match.eligibility_label || match.category

  const openPathway = () => {
    savePathwayMatchContext({
      role_id: match.pathway_id,
      title: match.title,
      field_name: match.field_name,
      specialism_name: match.specialism_name,
      stage_label: match.stage_label,
      category: match.category,
      eligibility_label: match.eligibility_label,
      match_score: match.match_score,
      lead_in: match.lead_in,
      why: match.why,
      requirements: match.requirements,
      next_step: match.next_step,
      saved_at: new Date().toISOString(),
    })
  }

  return (
    <article
      className={cn(
        'rounded-2xl border border-slate-800/90 bg-slate-900/50 p-4 sm:p-5',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-50">{match.title}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {match.field_name}
            <span className="mx-1.5 text-slate-600">·</span>
            {match.specialism_name}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
            statusTone(mainBadge)
          )}
        >
          {mainBadge}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
        {match.stage_label ? (
          <span className="rounded-md border border-slate-700/80 px-2 py-0.5">
            Stage: {match.stage_label}
          </span>
        ) : null}
        <span className="rounded-md border border-slate-700/80 px-2 py-0.5">
          Score {percent}%
        </span>
        {match.category &&
        match.category.toLowerCase() !== mainBadge.toLowerCase() &&
        !mainBadge.toLowerCase().includes(match.category.toLowerCase()) ? (
          <span className="rounded-md border border-slate-700/80 px-2 py-0.5 text-slate-500">
            {match.category}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Why this role matches
        </p>
        <p className="mt-1 text-[11px] text-slate-500">{match.lead_in}</p>
        <ul className="mt-2 space-y-1.5">
          {match.why
            .filter((item) => {
              const text = item.text?.trim() || ''
              if (!text) return false
              // Never render raw debug payloads on public cards
              if (/^\s*[\{\[]/.test(text) || /\"match_type\"|\"blockers\"|plan_source\s*:/i.test(text))
                return false
              return true
            })
            .filter((item, index, arr) => {
              const key = item.text.trim().toLowerCase()
              return arr.findIndex((x) => x.text.trim().toLowerCase() === key) === index
            })
            .map((item) => (
            <li key={item.kind + item.text} className="flex gap-2 text-sm text-slate-300">
              <span aria-hidden className="mt-0.5 shrink-0">
                {item.kind === 'positive' ? '✔️' : item.kind === 'gap' ? '•' : '⚠️'}
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {(() => {
        const reqs = match.requirements.filter((r, i, arr) => {
          const key = r.trim().toLowerCase()
          if (!key) return false
          if (arr.findIndex((x) => x.trim().toLowerCase() === key) !== i) return false
          return !match.why.some((w) => w.text.trim().toLowerCase() === key)
        })
        if (reqs.length === 0) return null
        return (
          <div className="mt-3 border-t border-slate-800 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Requirements still to consider
            </p>
            <ul className="mt-1.5 space-y-1">
              {reqs.map((r) => (
                <li key={r} className="text-sm text-slate-400">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      <Link
        href={pathwayHref}
        onClick={openPathway}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-cyan-700/50 bg-cyan-950/30 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-950/50 sm:w-auto"
      >
        View pathway
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>

      <PathwayActions match={match} matchType={matchType} />
    </article>
  )
}
