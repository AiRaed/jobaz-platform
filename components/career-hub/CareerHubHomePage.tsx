'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Sparkles } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { PlatformToolShell } from '@/components/dashboard/platform'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import { useTrainingRoutes } from '@/hooks/useTrainingRoutes'
import {
  CAREER_HUB_CATEGORIES,
  getCategoryById,
  getCategoryForPathId,
  getPrimaryPathIdForCategory,
  searchCategories,
} from '@/lib/career-hub/routeCategories'
import { buildCareerHubExplorerUrl } from '@/lib/career-hub/explorerUrl'
import CareerHubRoutePanel from '@/components/career-hub/CareerHubRoutePanel'

export default function CareerHubHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [caSessionId, setCaSessionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const { routes: recommendedRoutes } = useTrainingRoutes()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const from = searchParams.get('from')
    const sessionParam = searchParams.get('ca_session')
    const load = (id: string) => {
      try {
        const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
        if (snapshot && JSON.parse(snapshot).sessionId === id) setCaSessionId(id)
      } catch {
        /* ignore */
      }
    }
    if ((from === 'career_assistant' || sessionParam) && sessionParam) load(sessionParam)
    else {
      try {
        const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
        if (snapshot) {
          const id = JSON.parse(snapshot).sessionId
          if (id) setCaSessionId(id)
        }
      } catch {
        /* ignore */
      }
    }
  }, [searchParams])

  useEffect(() => {
    void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitSkillPathViewed }) => emitSkillPathViewed())
  }, [])

  useEffect(() => {
    const routeParam = searchParams.get('route')
    const categoryParam = searchParams.get('category')
    const tagParam = searchParams.get('tag')

    let categoryId: string | null = null
    let pathId: string | null = null

    if (routeParam) {
      const cat = getCategoryForPathId(routeParam)
      pathId = routeParam
      categoryId = cat?.id ?? categoryParam
    } else if (categoryParam) {
      categoryId = categoryParam
      pathId = getPrimaryPathIdForCategory(categoryParam)
    } else if (tagParam) {
      const normalizedTag = tagParam.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-').trim()
      const cat = CAREER_HUB_CATEGORIES.find(
        (c) =>
          c.id === normalizedTag ||
          c.pathIds.some((id) => id.includes(normalizedTag) || normalizedTag.includes(id))
      )
      if (cat) {
        categoryId = cat.id
        pathId = cat.pathIds[0] ?? null
      }
    } else if (recommendedRoutes[0]) {
      const cat = getCategoryForPathId(recommendedRoutes[0].pathId)
      categoryId = cat?.id ?? null
      pathId = recommendedRoutes[0].pathId
    } else {
      const first = CAREER_HUB_CATEGORIES[0]
      if (first) {
        categoryId = first.id
        pathId = first.pathIds[0] ?? null
      }
    }

    setSelectedCategoryId(categoryId)
    setSelectedPathId(pathId)

    if (pathId && categoryId && !routeParam && !categoryParam) {
      router.replace(
        buildCareerHubExplorerUrl({
          route: pathId,
          category: categoryId,
          from: caSessionId ? 'career_assistant' : undefined,
          ca_session: caSessionId ?? undefined,
        }),
        { scroll: false }
      )
    }
  }, [searchParams, recommendedRoutes, caSessionId, router])

  const filteredCategories = useMemo(() => searchCategories(searchQuery), [searchQuery])

  const activeRecommendedRoute = useMemo(() => {
    if (!selectedPathId) return null
    return recommendedRoutes.find((r) => r.pathId === selectedPathId) ?? null
  }, [recommendedRoutes, selectedPathId])

  const updateSelection = useCallback(
    (categoryId: string, pathId?: string | null) => {
      const cat = getCategoryById(categoryId)
      const resolvedPath = pathId ?? cat?.pathIds[0] ?? null
      setSelectedCategoryId(categoryId)
      setSelectedPathId(resolvedPath)

      const url = buildCareerHubExplorerUrl({
        route: resolvedPath ?? undefined,
        category: categoryId,
        from: caSessionId ? 'career_assistant' : undefined,
        ca_session: caSessionId ?? undefined,
      })
      router.replace(url, { scroll: false })

      if (resolvedPath) {
        void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitSkillGoalSelected }) =>
          emitSkillGoalSelected({
            pathId: resolvedPath,
            pathName: cat?.label ?? resolvedPath,
            goalType: 'path',
          })
        )
      }
    },
    [caSessionId, router]
  )

  const primaryRecommended = recommendedRoutes[0]

  return (
    <AppShell wide platform>
      <PlatformToolShell>
      <PageHeader
        title="Career Hub"
        subtitle="Browse career routes, compare courses and licences, and save training to your plan — all in one place."
        showBackToDashboard={false}
        showBackToCareerAssistant={!!caSessionId}
        caSessionId={caSessionId}
      />

      {primaryRecommended && caSessionId && (
        <section className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1">Recommended for you</p>
              <p className="text-sm text-slate-200">
                <span className="font-semibold">{primaryRecommended.categoryLabel}</span>
                <span className="text-emerald-300 ml-2">{primaryRecommended.readinessPercent}% match</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Based on your profile, this is a realistic route into UK employment. Courses are shown below.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <aside className="lg:w-64 xl:w-72 shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search careers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-950/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
              aria-label="Search career routes"
            />
          </div>

          <div className="lg:hidden -mx-1">
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateSelection(cat.id)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition',
                    selectedCategoryId === cat.id
                      ? 'border-violet-500/50 bg-violet-500/15 text-violet-100'
                      : 'border-slate-700/60 bg-slate-950/50 text-slate-400 hover:border-slate-600'
                  )}
                >
                  <span aria-hidden>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <nav className="hidden lg:block rounded-2xl border border-slate-700/60 bg-slate-950/50 p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 px-3 py-2">Career routes</p>
            <ul className="space-y-0.5">
              {filteredCategories.map((cat) => {
                const isActive = selectedCategoryId === cat.id
                const isRecommended = recommendedRoutes.some((r) => cat.pathIds.includes(r.pathId))
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => updateSelection(cat.id)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-start gap-2.5',
                        isActive
                          ? 'bg-violet-500/15 border border-violet-500/35 text-violet-100'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                      )}
                    >
                      <span className="text-lg leading-none shrink-0" aria-hidden>
                        {cat.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium block leading-snug">{cat.label}</span>
                        {isRecommended && (
                          <span className="text-[10px] text-emerald-400/90 mt-0.5 block">Recommended</span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {filteredCategories.length === 0 && (
              <p className="text-xs text-slate-500 px-3 py-4">No routes found — try security, care, driving…</p>
            )}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {selectedPathId ? (
            <CareerHubRoutePanel
              pathId={selectedPathId}
              caSessionId={caSessionId}
              recommendedRoute={activeRecommendedRoute}
            />
          ) : (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-8 text-center">
              <p className="text-slate-400">Select a career route to view courses and training options.</p>
            </div>
          )}
        </main>
      </div>

      <p className="text-xs text-slate-500 text-center mt-10">
        JobAZ provides career guidance and preparation tools. Provider listings and referral links coming in a future update.
      </p>
      </PlatformToolShell>
    </AppShell>
  )
}
