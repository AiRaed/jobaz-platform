'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCareerPlan } from '@/hooks/useCareerPlan'
import {
  courseDetailHref,
  careerHubPathHref,
} from '@/lib/career-hub/myPlan'
import { CAREER_HUB_HOME } from '@/lib/career-hub/paths'
import {
  loadTrainingRoutes,
  TRAINING_ROUTES_UPDATED_EVENT,
  type RecommendedTrainingRoute,
} from '@/lib/career-hub/trainingPlan'
import { getCareerPathById } from '@/lib/career-paths'

export default function MyCareerJourneyWidget() {
  const { items } = useCareerPlan()
  const [routes, setRoutes] = useState<RecommendedTrainingRoute[]>([])

  useEffect(() => {
    const refresh = () => setRoutes(loadTrainingRoutes())
    refresh()
    window.addEventListener(TRAINING_ROUTES_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(TRAINING_ROUTES_UPDATED_EVENT, refresh)
  }, [])

  const activeRoute = routes[0]
  const activePath = activeRoute ? getCareerPathById(activeRoute.pathId) : null
  const savedCourses = items.filter((i) => i.status === 'saved' || i.status === 'in_progress')
  const recommendedCourses = items.filter((i) => i.status === 'recommended')

  const nextStepText = activeRoute
    ? `Complete ${activeRoute.nextStepLabel} and begin applications`
    : savedCourses[0]
      ? `Continue with ${savedCourses[0].courseName}`
      : null

  if (!routes.length && !items.length) {
    return (
      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
        <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-2">My Career Journey</p>
        <p className="text-sm text-slate-400 mb-4">Start building your career journey</p>
        <Link
          href={CAREER_HUB_HOME}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 transition"
        >
          <Compass className="w-4 h-4" />
          Explore Career Routes
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/20 via-slate-950/90 to-slate-900/50 p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-violet-300">My Career Journey</p>

      {activeRoute && (
        <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-950/20">
          <Link
            href={careerHubPathHref(activeRoute.pathId)}
            className="font-semibold text-slate-100 hover:text-violet-200 transition flex items-center gap-2"
          >
            <span>{activeRoute.icon}</span>
            {activeRoute.categoryLabel}
          </Link>
          <p className="text-xs text-emerald-300/90 mt-1">Status: Active Route</p>
          {activePath && (
            <p className="text-xs text-slate-500 mt-0.5">{activePath.description}</p>
          )}
        </div>
      )}

      {savedCourses.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Saved courses</p>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {savedCourses.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <Link
                  href={c.pathId ? courseDetailHref(c.pathId, c.courseSlug) : CAREER_HUB_HOME}
                  className="hover:text-violet-200 transition truncate"
                >
                  {c.courseName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendedCourses.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Recommended</p>
          <ul className="space-y-1.5 text-sm text-slate-400">
            {recommendedCourses.slice(0, 3).map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="text-amber-400">*</span>
                <Link
                  href={c.pathId ? courseDetailHref(c.pathId, c.courseSlug) : CAREER_HUB_HOME}
                  className="hover:text-violet-200 transition truncate"
                >
                  {c.courseName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nextStepText && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1">Next step</p>
          <p className="text-sm text-slate-300 mb-3">{nextStepText}</p>
          <Link
            href={
              activeRoute
                ? careerHubPathHref(activeRoute.pathId)
                : savedCourses[0]?.pathId
                  ? courseDetailHref(savedCourses[0].pathId, savedCourses[0].courseSlug)
                  : CAREER_HUB_HOME
            }
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold',
              'bg-emerald-600 hover:bg-emerald-500 text-white transition'
            )}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <Link href={CAREER_HUB_HOME} className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-violet-300">
        Open Career Hub
        <ArrowRight className="w-3 h-3" />
      </Link>
    </section>
  )
}
