'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark, GraduationCap } from 'lucide-react'
import RecommendationCourseCard from '@/components/recommendations/RecommendationCourseCard'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import type { PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import { loadCareerPlanItems } from '@/lib/career-hub/myPlan'
import { loadSavedCourses } from '@/lib/career-hub/marketplace/savedPlan'
import {
  filterPlanItemsForCurrentRoute,
  filterSavedMarketForRoute,
  titlesMatchLoose,
} from '@/lib/dashboard/careerOs/myPlanDisplayFilter'
import { cn } from '@/lib/utils'

type Props = {
  ladder: PathPlanLadder | null | undefined
  /** Fallback training titles from roadmap requirements when ladder missing */
  fallbackTitles?: string[]
}

/**
 * Recommended Training inside My Plan — real resolved Coach data + filtered saved items only.
 */
export default function MyPlanRecommendedTrainingSection({ ladder, fallbackTitles = [] }: Props) {
  const [cards, setCards] = useState<RecommendationCourseCardData[]>(
    () => ladder?.structuredCards ?? []
  )
  const [loading, setLoading] = useState(false)

  const titles = useMemo(() => {
    const fromLadder = ladder?.trainingTitles ?? []
    const merged = fromLadder.length > 0 ? fromLadder : fallbackTitles
    const seen = new Set<string>()
    return merged.filter((t) => {
      const key = t.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [ladder?.trainingTitles, fallbackTitles])

  useEffect(() => {
    if (ladder?.structuredCards?.length) {
      setCards(ladder.structuredCards)
      // Still resolve if train-next missing from structured set
      const needResolve = titles.some(
        (t) => !ladder.structuredCards.some((c) => titlesMatchLoose(c.title, t))
      )
      if (!needResolve) return
    }
    if (titles.length === 0) {
      setCards([])
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const res = await fetch('/api/recommendations/resolve-courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titles, limit: 4 }),
        })
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { cards?: RecommendationCourseCardData[] }
        if (!cancelled) setCards(body.cards ?? [])
      } catch {
        if (!cancelled) setCards([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [ladder?.structuredCards, titles])

  const savedPlan = filterPlanItemsForCurrentRoute(loadCareerPlanItems(), ladder)
  const savedMarket = filterSavedMarketForRoute(loadSavedCourses(), ladder).slice(0, 4)

  if (!loading && cards.length === 0 && savedPlan.length === 0 && savedMarket.length === 0) {
    return (
      <section
        id="recommended-training"
        className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/40 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Recommended Training</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          No Coach-matched training yet. Complete Career Coach to unlock real course cards for your
          route.
        </p>
        <Link
          href="/uk-career-assistant"
          className="text-xs font-semibold text-violet-300 hover:text-violet-200"
        >
          Open Career Coach →
        </Link>
      </section>
    )
  }

  return (
    <section
      id="recommended-training"
      className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-100">Recommended Training</h3>
      </div>
      <p className="text-xs text-slate-500">
        Matched from your Career Coach plan — partner Apply Now links where available.
      </p>

      {loading && cards.length === 0 && (
        <p className="text-xs text-slate-500 py-4">Resolving courses…</p>
      )}

      <div className="space-y-3">
        {cards.map((card) => (
          <RecommendationCourseCard key={card.id} card={card} source="career_coach_result" />
        ))}
      </div>

      {(savedPlan.length > 0 || savedMarket.length > 0) && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Saved / on your roadmap
            </p>
          </div>
          <ul className="space-y-1.5">
            {savedPlan.slice(0, 6).map((item) => (
              <li
                key={item.id}
                className={cn(
                  'rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-sm text-slate-200'
                )}
              >
                {item.courseName}
                <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">
                  {item.status.replace('_', ' ')}
                </span>
              </li>
            ))}
            {savedMarket.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-sm text-slate-200"
              >
                {item.courseTitle}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
