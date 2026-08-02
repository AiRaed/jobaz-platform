'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Briefcase, Plus, Search, MapPin } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  PlatformContent,
  PlatformPageHeader,
  PlatformShell,
} from '@/components/dashboard/platform'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import { supabase } from '@/lib/supabase'
import { buildAuthLoginUrl } from '@/lib/auth/redirect'
import { OPPORTUNITY_CATEGORIES, type PublicOpportunity } from '@/lib/opportunities/types'

export default function OpportunitiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [opportunities, setOpportunities] = useState<PublicOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (location.trim()) params.set('location', location.trim())
    if (category !== 'all') params.set('category', category)

    try {
      const res = await fetch(`/api/opportunities?${params.toString()}`, { cache: 'no-store' })
      const body = (await res.json()) as {
        opportunities?: PublicOpportunity[]
        error?: string
      }
      if (!res.ok) throw new Error(body.error || 'Failed to load opportunities')
      setOpportunities(body.opportunities ?? [])
    } catch (err) {
      setOpportunities([])
      setError(err instanceof Error ? err.message : 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }, [search, location, category])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [load])

  const handlePost = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      router.push(buildAuthLoginUrl('/opportunities/post'))
      return
    }
    router.push('/opportunities/post')
  }

  return (
    <AppShell wide platform>
      <PlatformShell
        pageHeader={
          <PlatformPageHeader
            title="Opportunities"
            description="Small practical local work — one-day shifts, delivery, cleaning, and side gigs."
            dotColor="violet"
            badges={
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200">
                Phase 1: approved local opportunities only
              </span>
            }
          />
        }
      >
        <PlatformContent withAmbient>
          <section className="jobaz-hero jobaz-keep-light mb-5 rounded-2xl border border-slate-400/20 p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-lg md:text-xl font-bold text-slate-50 tracking-tight">
                  Short local tasks & shifts
                </h2>
                <p className="text-sm text-slate-300/95 mt-2 leading-relaxed">
                  Barber help, cleaning, moving, delivery shifts, warehouse cover, and other practical
                  one-off work — reviewed before they go live.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handlePost()}
                className="jobaz-btn-primary shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Post an Opportunity
              </button>
            </div>
          </section>

          <div className="jobaz-card mb-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 dark:border-slate-700/50 dark:bg-slate-950/40">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cleaning, warehouse, barber…"
                  className="jobaz-input pl-10"
                  aria-label="Search opportunities"
                />
              </div>
              <div className="relative sm:w-52">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location / area"
                  className="jobaz-input pl-10"
                  aria-label="Filter by location"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="jobaz-input sm:w-48"
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {OPPORTUNITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="jobaz-card h-44 animate-pulse rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] dark:border-slate-700/50 dark:bg-slate-900/40"
                />
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <EmptyState onPost={() => void handlePost()} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </PlatformContent>
      </PlatformShell>
    </AppShell>
  )
}

function EmptyState({ onPost }: { onPost: () => void }) {
  return (
    <div className="jobaz-card mx-auto max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-10 text-center dark:border-slate-700/50 dark:bg-slate-950/40">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] dark:border-violet-500/30 dark:bg-violet-950/30">
        <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-300" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-[var(--jaz-text)] dark:text-slate-50 mb-2">
        No local opportunities yet
      </h2>
      <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-400 leading-relaxed mb-2">
        Check back soon — JobAZ is adding practical work opportunities.
      </p>
      <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 mb-5">
        Phase 1: approved local opportunities only.
      </p>
      <button type="button" onClick={onPost} className="jobaz-btn-primary">
        <Plus className="h-4 w-4" aria-hidden />
        Post an Opportunity
      </button>
      <p className="mt-4 text-[11px] text-[var(--jaz-muted)] dark:text-slate-500">
        Looking for full-time roles?{' '}
        <Link href="/job-finder" className="text-violet-600 hover:underline dark:text-violet-300">
          Browse jobs
        </Link>
      </p>
    </div>
  )
}
