'use client'

import Link from 'next/link'
import type { PathwayMatchSummary } from '@/lib/career-engine/pathway-knowledge'

const SAVE_KEY = 'jobaz.wie.saved_pathways.v1'

type MatchType =
  | 'best_immediate_route'
  | 'developing_match'
  | 'future_career_option'
  | 'needs_review_regulated'
  | 'not_recommended_now'

type Props = {
  match: PathwayMatchSummary
  matchType?: MatchType
}

function roleQuery(match: PathwayMatchSummary) {
  return encodeURIComponent(match.title)
}

export function PathwayActions({ match, matchType }: Props) {
  const savePathway = () => {
    try {
      const raw = window.sessionStorage.getItem(SAVE_KEY)
      const list: Array<{ pathway_id: string; title: string; saved_at: string }> = raw
        ? JSON.parse(raw)
        : []
      if (!list.some((x) => x.pathway_id === match.pathway_id)) {
        list.unshift({
          pathway_id: match.pathway_id,
          title: match.title,
          saved_at: new Date().toISOString(),
        })
        window.sessionStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 40)))
      }
    } catch {
      // ignore
    }
  }

  const btn =
    'inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/10'

  const pathwayHref = `/career-assistant/work-in-my-education/pathway/${encodeURIComponent(match.pathway_id)}`

  const actions: Array<{ href?: string; label: string; onClick?: () => void }> = []

  if (matchType === 'needs_review_regulated' || matchType === 'not_recommended_now') {
    actions.push({ href: pathwayHref, label: 'View requirements' })
    actions.push({ label: 'Save for review', onClick: savePathway })
    actions.push({ href: '/courses', label: 'View courses' })
  } else if (matchType === 'future_career_option') {
    actions.push({ href: pathwayHref, label: 'View pathway' })
    actions.push({ label: 'Save pathway', onClick: savePathway })
    actions.push({ href: pathwayHref, label: 'View required steps' })
  } else if (matchType === 'developing_match') {
    actions.push({ href: `/cv-builder-v2?role=${roleQuery(match)}`, label: 'Prepare my CV' })
    actions.push({ href: '/courses', label: 'View courses' })
    actions.push({ href: pathwayHref, label: 'Build experience' })
    actions.push({ label: 'Save pathway', onClick: savePathway })
  } else {
    // best_immediate_route (default)
    actions.push({ href: `/cv-builder-v2?role=${roleQuery(match)}`, label: 'Prepare my CV' })
    actions.push({ href: pathwayHref, label: 'View pathway' })
    actions.push({ label: 'Save pathway', onClick: savePathway })
    actions.push({ href: `/cover-letter?role=${roleQuery(match)}`, label: 'Create cover letter' })
    actions.push({ href: `/interview-coach?role=${roleQuery(match)}`, label: 'Interview coach' })
  }

  return (
    <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Next with JobAZ
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) =>
          a.href ? (
            <Link key={a.label} href={a.href} className={btn} onClick={a.onClick}>
              {a.label}
            </Link>
          ) : (
            <button key={a.label} type="button" onClick={a.onClick} className={btn}>
              {a.label}
            </button>
          )
        )}
      </div>
    </div>
  )
}
