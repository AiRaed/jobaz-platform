'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RouteRequirement } from '@/lib/dashboard/careerOs/types'
import {
  upsertCareerPlanItem,
  updateCareerPlanStatus,
  courseDetailHref,
  careerHubPathHref,
} from '@/lib/career-hub/myPlan'

type Props = {
  requirements: RouteRequirement[]
  onUpdate?: () => void
}

export default function RouteRequirementsSection({ requirements, onUpdate }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (!requirements.length) return null

  const linkFor = (req: RouteRequirement) =>
    req.courseHref ??
    (req.pathId ? courseDetailHref(req.pathId, req.slug) : careerHubPathHref(req.pathId ?? 'care-support'))

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

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <ClipboardList className="w-3.5 h-3.5 text-violet-400" />
        <h3 className="text-sm font-semibold text-slate-100">Route Requirements</h3>
        <span className="text-[10px] text-slate-500 ml-auto">
          {requirements.filter((r) => r.status === 'completed').length}/{requirements.length} complete
        </span>
      </div>

      <div className="divide-y divide-slate-800/60 border border-slate-800/60 rounded-lg overflow-hidden">
        {requirements.map((req) => {
          const isOpen = openId === req.id
          const isDone = req.status === 'completed'

          return (
            <div key={req.id} className="bg-slate-900/30">
              <button
                type="button"
                onClick={() => toggle(req.id)}
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
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0',
                      req.required
                        ? 'border-violet-500/30 text-violet-300'
                        : 'border-slate-600/40 text-slate-500'
                    )}
                  >
                    {req.required ? 'Required' : 'Optional'}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 pt-0 pl-9 space-y-3">
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
                      <dt className="text-slate-500 uppercase tracking-wide mb-0.5">Impact</dt>
                      <dd className="text-slate-300 leading-snug line-clamp-2">{req.expectedImpact}</dd>
                    </div>
                  </dl>

                  {!isDone && (
                    <div className="flex flex-wrap gap-2">
                      {req.status === 'not_started' && (
                        <Link
                          href={linkFor(req)}
                          onClick={() => handleStart(req)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
                        >
                          Start Course
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {req.status === 'in_progress' && (
                        <>
                          <Link
                            href={linkFor(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
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
                            Mark Complete
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
    </section>
  )
}
