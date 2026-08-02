'use client'

import Link from 'next/link'
import { Check, ChevronRight, Route } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerRoadmap, CareerRoadmapTask } from '@/lib/dashboard/careerOs/types'
import RoadmapTrainingPanel from './RoadmapTrainingPanel'

type Props = {
  roadmap: CareerRoadmap
}

const LABEL_SHORT: Record<string, string> = {
  Assessment: 'Assessment',
  'Build CV': 'CV',
  'Training / Qualification': 'Training',
  'Apply Jobs': 'Apply',
  Interview: 'Interview',
  'First Job': 'First Job',
  'Career Growth': 'Growth',
}

function shortLabel(label: string): string {
  if (LABEL_SHORT[label]) return LABEL_SHORT[label]
  if (label.length <= 14) return label
  if (/certificate|certification/i.test(label)) return label.split(' ').slice(0, 2).join(' ')
  return label.length > 18 ? `${label.slice(0, 16)}…` : label
}

function TrainingSubStep({ task }: { task: CareerRoadmapTask }) {
  const done = task.completed
  const current = task.status === 'current'
  const chipClass = cn(
    'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap border transition',
    done && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    current && !done && 'bg-cyan-500/15 text-cyan-200 border-cyan-400/40 ring-1 ring-cyan-400/20',
    !done && !current && 'bg-slate-900/50 text-slate-500 border-slate-700/40'
  )

  const content = (
    <>
      {done && <Check className="w-2.5 h-2.5 shrink-0" />}
      {task.label}
    </>
  )

  if (task.href) {
    return (
      <Link href={task.href} className={cn(chipClass, 'hover:opacity-90')}>
        {content}
      </Link>
    )
  }

  return <span className={chipClass}>{content}</span>
}

export default function CareerRoadmapSection({ roadmap }: Props) {
  const trainingPhase = roadmap.phases.find((p) => p.id === 'training')

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-3 md:px-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Route className="w-3.5 h-3.5 text-violet-400" />
        <h3 className="text-sm font-semibold text-slate-100">Career Roadmap</h3>
      </div>

      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <ol className="flex items-center gap-0 min-w-max">
          {roadmap.milestones.map((milestone, index) => (
            <li key={milestone.id} className="flex items-center">
              <MilestoneChip milestone={milestone} />
              {index < roadmap.milestones.length - 1 && (
                <ChevronRight
                  className={cn(
                    'w-3.5 h-3.5 shrink-0 mx-0.5',
                    milestone.status === 'complete' ? 'text-emerald-500/50' : 'text-slate-700'
                  )}
                />
              )}
            </li>
          ))}
        </ol>
      </div>

      {trainingPhase && trainingPhase.tasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/60">
          <p className="text-[10px] uppercase tracking-wider text-cyan-400/80 mb-2">
            Training / Qualification steps in your journey
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trainingPhase.tasks.map((task) => (
              <TrainingSubStep key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      <RoadmapTrainingPanel roadmap={roadmap} />

      {roadmap.readinessInsights.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/60">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Career readiness signals</p>
          <ul className="flex flex-wrap gap-1.5">
            {roadmap.readinessInsights.map((insight) => (
              <li
                key={insight}
                className="text-[10px] px-2 py-1 rounded-md bg-violet-500/10 text-violet-200 border border-violet-500/20"
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function MilestoneChip({
  milestone,
}: {
  milestone: CareerRoadmap['milestones'][number]
}) {
  const label = shortLabel(milestone.label)
  const isComplete = milestone.status === 'complete'
  const isCurrent = milestone.status === 'current'

  const chipClass = cn(
    'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition',
    isComplete && 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    isCurrent && 'bg-violet-500/20 text-violet-200 border border-violet-400/50 ring-1 ring-violet-400/30',
    !isComplete && !isCurrent && 'bg-slate-900/50 text-slate-500 border border-slate-700/40'
  )

  const content = (
    <>
      {isComplete && <Check className="w-3 h-3 shrink-0" />}
      {label}
    </>
  )

  if (milestone.href && (isComplete || isCurrent)) {
    return (
      <Link href={milestone.href} className={cn(chipClass, 'hover:opacity-90')}>
        {content}
      </Link>
    )
  }

  return <span className={chipClass}>{content}</span>
}
