'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, Compass, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  extractGenericCourseRecommendations,
  extractUkTransitionRecommendations,
  medalForPriority,
  type RecommendedCourseStep,
} from '@/lib/career-hub/recommendations'
import { saveRecommendationsToPlan, courseDetailHref } from '@/lib/career-hub/myPlan'
import { careerHubRouteUrl } from '@/lib/career-hub/explorerUrl'
import type { UkTransitionGrowthOutput } from '@/lib/career-brain/ukTransition/ukTransitionTypes'

type Props = {
  ukGrowth?: UkTransitionGrowthOutput | null
  genericCourses?: string[]
  defaultPathId?: string
  caSessionId?: string | null
  className?: string
}

export default function RecommendedNextStepsPanel({
  ukGrowth,
  genericCourses,
  defaultPathId,
  caSessionId,
  className,
}: Props) {
  const steps: RecommendedCourseStep[] = ukGrowth
    ? extractUkTransitionRecommendations(ukGrowth)
    : extractGenericCourseRecommendations(genericCourses, defaultPathId)

  const [saved, setSaved] = useState(false)

  if (!steps.length) return null

  const hubHref = steps[0]?.pathId
    ? careerHubRouteUrl(steps[0].pathId, { caSessionId })
    : `/career-hub${caSessionId ? `?from=career_assistant&ca_session=${encodeURIComponent(caSessionId)}` : ''}`

  const handleSave = () => {
    saveRecommendationsToPlan(
      steps.map((s) => ({
        courseName: s.courseName,
        pathId: s.pathId,
        routeLabel: s.routeLabel,
        priority: s.priority,
      })),
      { markSaved: true }
    )
    setSaved(true)
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 via-slate-950/80 to-violet-950/20 p-6 space-y-5',
        className
      )}
    >
      <div>
        <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1">Your recommended next steps</p>
        <p className="text-sm text-slate-400">
          JobAZ picked the most relevant courses and licences for you — save them to your plan or explore in Career Hub.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.courseSlug}>
            <Link
              href={courseDetailHref(step.pathId, step.courseSlug)}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-900/50 hover:border-violet-500/35 transition group"
            >
              <span className="text-xl shrink-0" aria-hidden>
                {medalForPriority(step.priority)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-100 group-hover:text-violet-200 transition">
                  {step.icon} {step.courseName}
                </p>
                {step.routeLabel && (
                  <p className="text-xs text-slate-500 mt-0.5">{step.routeLabel}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition',
            saved
              ? 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          {saved ? 'Saved to My Plan' : 'Save To My Plan'}
        </button>
        <Link
          href={hubHref}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 transition"
        >
          <Compass className="w-4 h-4" />
          Open Career Hub
        </Link>
      </div>
    </section>
  )
}
