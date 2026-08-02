'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Check, ChevronDown, ClipboardList, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerRoadmapTrainingDetails, RouteRequirement } from '@/lib/dashboard/careerOs/types'
import {
  upsertCareerPlanItem,
  updateCareerPlanStatus,
  courseDetailHref,
  careerHubPathHref,
} from '@/lib/career-hub/myPlan'

type Props = {
  training: CareerRoadmapTrainingDetails
  onUpdate?: () => void
}

function linkFor(req: RouteRequirement) {
  return req.courseHref ?? (req.pathId ? courseDetailHref(req.pathId, req.slug) : careerHubPathHref(req.pathId ?? 'care-support'))
}

function RequirementGroup({
  title,
  icon: Icon,
  items,
  onUpdate,
}: {
  title: string
  icon: typeof ShieldCheck
  items: RouteRequirement[]
  onUpdate?: () => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  if (!items.length) return null

  const handleStart = (req: RouteRequirement) => {
    upsertCareerPlanItem({
      courseName: req.name,
      courseSlug: req.slug,
      pathId: req.pathId,
      status: 'in_progress',
      source: 'career_hub',
    })
    onUpdate?.()
  }

  const handleMarkComplete = (req: RouteRequirement) => {
    const id = `${req.slug}-${req.pathId ?? 'general'}`
    const updated = updateCareerPlanStatus(id, 'completed')
    if (!updated) {
      upsertCareerPlanItem({
        courseName: req.name,
        courseSlug: req.slug,
        pathId: req.pathId,
        status: 'completed',
        source: 'manual',
      })
    }
    onUpdate?.()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-cyan-400" />
        <h4 className="text-xs font-semibold text-slate-200">{title}</h4>
        <span className="text-[10px] text-slate-500 ml-auto">
          {items.filter((r) => r.status === 'completed').length}/{items.length}
        </span>
      </div>

      <div className="divide-y divide-slate-800/60 border border-slate-800/60 rounded-lg overflow-hidden">
        {items.map((req) => {
          const isOpen = openId === req.id
          const isDone = req.status === 'completed'

          return (
            <div key={req.id} className="bg-slate-900/30">
              <button
                type="button"
                onClick={() => setOpenId((prev) => (prev === req.id ? null : req.id))}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-800/30 transition"
              >
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
                <span className={cn('text-sm font-medium flex-1 truncate', isDone ? 'text-emerald-300' : 'text-slate-200')}>
                  {req.name}
                </span>
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-cyan-500/25 text-cyan-300 shrink-0">
                    Unlock step
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 pt-0 pl-9 space-y-3">
                  <p className="text-[11px] text-slate-400 leading-snug">{req.expectedImpact}</p>
                  <dl className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <dt className="text-slate-500 uppercase tracking-wide mb-0.5">Duration</dt>
                      <dd className="text-slate-200">{req.estimatedTime}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 uppercase tracking-wide mb-0.5">Cost</dt>
                      <dd className="text-slate-200">{req.estimatedCost}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 uppercase tracking-wide mb-0.5">Status</dt>
                      <dd className="text-slate-200 capitalize">{req.status.replace('_', ' ')}</dd>
                    </div>
                  </dl>

                  {!isDone && (
                    <div className="flex flex-wrap gap-2">
                      {req.status === 'not_started' && (
                        <Link
                          href={linkFor(req)}
                          onClick={() => handleStart(req)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition"
                        >
                          Start step
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {req.status === 'in_progress' && (
                        <>
                          <Link
                            href={linkFor(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition"
                          >
                            Continue
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleMarkComplete(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10 transition"
                          >
                            <Check className="w-3 h-3" />
                            Mark complete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Training unlock detail panels — driven by the roadmap training phase. */
export default function TrainingPhasePanel({ training, onUpdate }: Props) {
  if (!training.all.length) return null

  return (
    <section
      className={cn(
        'rounded-xl border p-4 space-y-4',
        training.phaseActive
          ? 'border-cyan-500/30 bg-cyan-950/10'
          : 'border-slate-700/60 bg-slate-950/50'
      )}
    >
      <div className="flex items-center gap-1.5">
        <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-100">Training / Qualification</h3>
        {training.phaseActive && (
          <span className="text-[10px] uppercase tracking-wider text-cyan-300/90 ml-auto">Current phase</span>
        )}
      </div>
      <p className="text-[11px] text-slate-400">
        These steps unlock your route — complete them before applying to jobs.
      </p>

      <RequirementGroup
        title="Essential Actions"
        icon={ShieldCheck}
        items={training.essentialActions}
        onUpdate={onUpdate}
      />
      <RequirementGroup
        title="Recommended Courses"
        icon={BookOpen}
        items={training.recommendedCourses}
        onUpdate={onUpdate}
      />
    </section>
  )
}
