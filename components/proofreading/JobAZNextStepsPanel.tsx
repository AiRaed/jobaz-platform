'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase, FileText, Languages, MessageSquare, Route } from 'lucide-react'
import type { JobAZRecommendedAction } from '@/lib/proofreading/types'

type Props = {
  nextStep: JobAZRecommendedAction | null
  actions: JobAZRecommendedAction[]
}

function iconFor(action: JobAZRecommendedAction) {
  switch (action.icon) {
    case 'cv':
      return FileText
    case 'interview':
      return MessageSquare
    case 'career':
      return Route
    case 'translate':
      return Languages
    case 'jobs':
      return Briefcase
    default:
      return ArrowRight
  }
}

export default function JobAZNextStepsPanel({ nextStep, actions }: Props) {
  if (!nextStep && !actions.length) return null

  return (
    <div className="rounded-lg border border-indigo-500/25 bg-indigo-950/15 p-3 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-medium">Continue in JobAZ</p>
      {nextStep && (
        <Link
          href={nextStep.href}
          className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-950/30 p-3 hover:border-indigo-400/50 transition group"
        >
          {(() => {
            const Icon = iconFor(nextStep)
            return <Icon className="w-5 h-5 text-indigo-300 flex-shrink-0" />
          })()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 group-hover:text-white">{nextStep.label}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{nextStep.why}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        </Link>
      )}
      {actions.length > 1 && (
        <ul className="space-y-2">
          {actions
            .filter((a) => a.id !== nextStep?.id)
            .slice(0, 3)
            .map((action) => (
              <li key={action.id}>
                <Link href={action.href} className="text-xs text-indigo-200 hover:text-indigo-100 underline-offset-2 hover:underline">
                  {action.label}
                </Link>
                <span className="text-slate-500 text-xs"> — {action.why}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
