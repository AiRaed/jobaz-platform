'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { PlatformToolShell } from '@/components/dashboard/platform'
import PageHeader from '@/components/PageHeader'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'
import CareerHubCourseCard from '@/components/career-hub/CareerHubCourseCard'
import { cn } from '@/lib/utils'
import { CAREER_HUB_CATEGORIES } from '@/lib/career-hub/routeCategories'
import type { CareerHubCourseListing } from '@/lib/career-hub/types'
import { COURSE_DELIVERY_MODES } from '@/lib/admin/courses/types'
import { devTime } from '@/lib/perf/devTiming'

export default function CoursesMarketplacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [courses, setCourses] = useState<CareerHubCourseListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all')
  const [provider, setProvider] = useState(searchParams.get('provider') ?? 'all')
  const [delivery, setDelivery] = useState(searchParams.get('delivery') ?? 'all')
  const [showFilters, setShowFilters] = useState(false)

  const loadCourses = useCallback(async () => {
    const done = devTime('career-hub/courses fetch')
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (category !== 'all') params.set('category', category)
    if (provider !== 'all') params.set('provider', provider)
    if (delivery !== 'all') params.set('delivery', delivery)

    try {
      const res = await fetch(`/api/career-hub/courses?${params.toString()}`, { cache: 'no-store' })
      const body = (await res.json()) as { courses?: CareerHubCourseListing[]; error?: string }
      if (!res.ok) throw new Error(body.error || 'Failed to load courses')
      setCourses(body.courses ?? [])
    } catch (err) {
      setCourses([])
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
      done()
    }
  }, [search, category, provider, delivery])

  useEffect(() => {
    const timer = setTimeout(() => void loadCourses(), 350)
    return () => clearTimeout(timer)
  }, [loadCourses])

  useEffect(() => {
    const route = searchParams.get('route')
    if (route) {
      router.replace(`/career-path/${encodeURIComponent(route)}`)
    }
  }, [searchParams, router])

  const providers = useMemo(() => {
    const set = new Set<string>()
    for (const c of courses) {
      const p = c.providerPlaceholder ?? c.marketplace?.providerName
      if (p) set.add(p)
    }
    return [...set].sort()
  }, [courses])

  return (
    <AppShell wide platform>
      <PlatformToolShell>
        <PageHeader
          title="Courses & Licences"
          subtitle="Browse real UK training options linked to practical career routes."
          showBackToDashboard={false}
          compact
        />

        <p className="mb-2.5 text-[11px] md:text-xs text-slate-600 dark:text-slate-400 leading-snug">
          Not sure which course fits you? Get a personal route with the{' '}
          <UkCareerAssistantLink className="font-medium text-violet-700 hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200 underline-offset-2 hover:underline">
            Career Assistant →
          </UkCareerAssistantLink>
        </p>

        <div className="jobaz-card mb-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:border-slate-700/50 dark:bg-slate-950/40 p-3 md:p-3.5">
          <div className="flex flex-col lg:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SIA, CSCS, Care, Forklift, English, First Aid..."
                className="jobaz-input pl-10"
                aria-label="Search courses"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                'jobaz-btn-secondary shrink-0',
                showFilters &&
                  'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-500/50 dark:bg-violet-500/10 dark:text-violet-100'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] dark:border-slate-700/50 dark:bg-slate-950/40 p-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">
                  Category / Route
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="jobaz-input mt-1"
                >
                  <option value="all">All categories</option>
                  {CAREER_HUB_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Provider</span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="jobaz-input mt-1"
                >
                <option value="all">All providers</option>
                {providers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Delivery</span>
              <select
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="jobaz-input mt-1"
              >
                <option value="all">All formats</option>
                {COURSE_DELIVERY_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse border border-slate-200 dark:border-slate-800/60"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-amber-700 dark:text-amber-400/90 text-center py-12">{error}</p>
        ) : courses.length === 0 ? (
          <div className="jobaz-card rounded-2xl border border-dashed border-[var(--jaz-border)] dark:border-slate-700/60 bg-[var(--jaz-surface)] dark:bg-slate-950/40 px-6 py-12 text-center">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              No published courses match your filters yet.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Try clearing filters or search for SIA, CSCS or Care.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3.5">
              {courses.length} course{courses.length === 1 ? '' : 's'} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CareerHubCourseCard
                  key={course.adminCourseId ?? course.slug}
                  course={course}
                  featured={course.isFeatured}
                  applySource="courses_marketplace"
                  saveLabel="Save to Plan"
                />
              ))}
            </div>
          </>
        )}
      </PlatformToolShell>
    </AppShell>
  )
}
