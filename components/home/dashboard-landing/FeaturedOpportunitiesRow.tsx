'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Briefcase } from 'lucide-react'
import ContentScrollRow from './ContentScrollRow'
import type { PublicOpportunity } from '@/lib/opportunities/types'

export default function FeaturedOpportunitiesRow() {
  const [items, setItems] = useState<PublicOpportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/opportunities', { cache: 'no-store' })
        const body = (await res.json()) as { opportunities?: PublicOpportunity[] }
        if (!cancelled) setItems((body.opportunities ?? []).slice(0, 6))
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <ContentScrollRow title="Local Opportunities" viewAllHref="/opportunities">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="jobaz-card snap-start shrink-0 w-[200px] h-[140px] rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] animate-pulse dark:border-slate-700/50 dark:bg-slate-900/50"
          />
        ))}
      </ContentScrollRow>
    )
  }

  if (items.length === 0) {
    return (
      <ContentScrollRow title="Local Opportunities" viewAllHref="/opportunities">
        <Link
          href="/opportunities"
          className="jobaz-card snap-start shrink-0 w-[260px] rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] px-4 py-4 hover:border-violet-300 transition dark:border-slate-700/60 dark:bg-slate-950/50 dark:hover:border-violet-500/50"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] dark:border-violet-500/30 dark:bg-violet-950/30">
            <Briefcase className="h-4 w-4 text-violet-600 dark:text-violet-300" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-50 mb-1">
            No local opportunities yet
          </p>
          <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-400 leading-relaxed mb-2">
            Check back soon — JobAZ is adding practical work opportunities.
          </p>
          <p className="text-[10px] text-[var(--jaz-muted)] dark:text-slate-500 mb-2">
            Phase 1: approved local opportunities only.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
            Open Opportunities <ArrowUpRight className="w-3 h-3" />
          </span>
        </Link>
      </ContentScrollRow>
    )
  }

  return (
    <ContentScrollRow title="Local Opportunities" viewAllHref="/opportunities">
      {items.map((opp) => (
        <Link
          key={opp.id}
          href="/opportunities"
          className="jobaz-card snap-start shrink-0 w-[200px] rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] px-4 py-3.5 hover:border-violet-300 transition group dark:border-slate-700/60 dark:bg-slate-950/50 dark:hover:border-violet-500/50"
        >
          {opp.category && (
            <p className="text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-300 mb-1 truncate">
              {opp.category}
            </p>
          )}
          {opp.created_by_admin && (
            <p className="text-[10px] font-semibold text-blue-700 dark:text-cyan-300 mb-1">
              Posted by JobAZ
            </p>
          )}
          <p className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-50 line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-200 transition mb-1">
            {opp.title}
          </p>
          <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-400 truncate mb-2">
            {opp.location || 'UK'}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
            View <ArrowUpRight className="w-3 h-3" />
          </span>
        </Link>
      ))}
    </ContentScrollRow>
  )
}
