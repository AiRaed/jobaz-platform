'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerRoadmap, RouteRequirement } from '@/lib/dashboard/careerOs/types'
import {
  completeTrainingRequirement,
  courseDetailHref,
  careerHubPathHref,
  startTrainingRequirement,
} from '@/lib/career-hub/myPlan'
import { syncTrainingProgressToSupabase } from '@/lib/career-hub/trainingProgressSync'
import {
  upsertActiveCvWithQualification,
  cvBuilderHrefForQualification,
} from '@/lib/cv-builder/addTrainingQualification'
import { notifyCareerPlanGenerated } from '@/hooks/useGeneratedCareerPlan'

type Props = {
  roadmap: CareerRoadmap
}

type PendingCompletion = {
  req: RouteRequirement
  taskLabel: string
}

function linkFor(req: RouteRequirement): string {
  return (
    req.courseHref ??
    (req.pathId ? courseDetailHref(req.pathId, req.slug) : careerHubPathHref(req.pathId ?? 'care-support'))
  )
}

export default function RoadmapTrainingPanel({ roadmap }: Props) {
  const [pending, setPending] = useState<PendingCompletion | null>(null)

  if (!roadmap.trainingDetails?.sections.length) return null

  const handleStart = async (req: RouteRequirement) => {
    const item = startTrainingRequirement(req)
    void syncTrainingProgressToSupabase(req, item)
    notifyCareerPlanGenerated()
  }

  const handleCompleteRequest = (req: RouteRequirement, taskLabel: string) => {
    setPending({ req, taskLabel })
  }

  const finishCompletion = async (addToCv: boolean) => {
    if (!pending) return
    const item = completeTrainingRequirement(pending.req)
    void syncTrainingProgressToSupabase(pending.req, item)
    if (addToCv) {
      const result = await upsertActiveCvWithQualification({
        name: pending.taskLabel,
        type: pending.req.type,
      })
      if (typeof window !== 'undefined' && result.message) {
        window.dispatchEvent(
          new CustomEvent('jobaz-toast', { detail: { type: 'success', message: result.message } })
        )
      }
    }
    setPending(null)
    notifyCareerPlanGenerated()
  }

  return (
    <>
      <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-cyan-400/80 flex items-center gap-1">
          <GraduationCap className="w-3 h-3" />
          Training / Qualification — actionable steps
        </p>

        {roadmap.trainingDetails.sections.map((section) => (
          <div key={section.tier} className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{section.label}</p>
            <div className="grid gap-2">
              {section.items.map((req) => {
                const task = roadmap.tasks.find((t) => t.requirement?.id === req.id)
                const status = req.status
                const isDone = status === 'completed'
                const isCurrent = task?.status === 'current'
                const actionLabel = req.actionLabel ?? 'View Course'

                return (
                  <div
                    key={req.id}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2',
                      isDone && 'border-emerald-500/25 bg-emerald-950/20',
                      isCurrent && !isDone && 'border-cyan-500/30 bg-cyan-950/15',
                      !isDone && !isCurrent && 'border-slate-800/60 bg-slate-900/30'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isDone && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        <p className={cn('text-sm font-medium truncate', isDone ? 'text-emerald-200' : 'text-slate-100')}>
                          {req.name}
                        </p>
                      </div>
                      {req.expectedImpact && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{req.expectedImpact}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {!isDone && (
                        <>
                          <Link
                            href={linkFor(req)}
                            onClick={() => {
                              if (status === 'not_started') void handleStart(req)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
                          >
                            {actionLabel}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          {status === 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => handleCompleteRequest(req, task?.label ?? req.name)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10 transition"
                            >
                              <Check className="w-3 h-3" />
                              Mark Complete
                            </button>
                          )}
                        </>
                      )}
                      {isDone && (
                        <Link
                          href={linkFor(req)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-600/40 text-slate-300 hover:bg-slate-800/40 transition"
                        >
                          View Course
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            role="dialog"
            aria-labelledby="training-complete-title"
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-xl"
          >
            <h4 id="training-complete-title" className="text-base font-semibold text-slate-50">
              Training completed
            </h4>
            <p className="text-sm text-slate-400 mt-2">
              Would you like to add <span className="text-slate-200">{pending.taskLabel}</span> to your CV?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              This updates Career Readiness and keeps your journey in sync.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => void finishCompletion(true)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
              >
                Yes, add to CV
              </button>
              <button
                type="button"
                onClick={() => void finishCompletion(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                Not now
              </button>
              <Link
                href={cvBuilderHrefForQualification(pending.taskLabel)}
                onClick={() => void finishCompletion(true)}
                className="ml-auto text-xs text-violet-300 hover:text-violet-200 self-center"
              >
                Open CV Builder
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
