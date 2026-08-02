'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PremiumButton, PremiumCard } from './shared'

export type NextAction = {
  id: string
  label: string
  description?: string
  href?: string
  onClick?: () => void
  primary?: boolean
}

type Props = {
  title?: string
  actions: NextAction[]
}

export default function InterviewNextActions({
  title = 'Next recommended step',
  actions,
}: Props) {
  if (actions.length === 0) return null

  return (
    <PremiumCard glow className="p-4 border-emerald-500/20">
      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
        {title}
      </p>
      <p className="text-sm text-slate-300 mb-4">
        Keep moving through your JobAZ career journey.
      </p>
      <div className="flex flex-col gap-2">
        {actions.map((action, index) => {
          const content = (
            <>
              <span>{action.label}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )
          if (action.href) {
            return (
              <Link
                key={action.id}
                href={action.href}
                className={`inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  index === 0 || action.primary
                    ? 'bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white hover:from-emerald-500 hover:to-teal-500'
                    : 'border border-slate-600/60 bg-slate-900/60 text-slate-200 hover:border-violet-400/40'
                }`}
              >
                {content}
              </Link>
            )
          }
          return (
            <PremiumButton
              key={action.id}
              variant={index === 0 || action.primary ? 'primary' : 'secondary'}
              onClick={action.onClick}
              className="w-full justify-between"
            >
              {content}
            </PremiumButton>
          )
        })}
      </div>
    </PremiumCard>
  )
}

export function buildSimulationNextActions(options: {
  score: number
  jobId?: string
  onPracticeAgain: () => void
  onImproveAnswers?: () => void
}): NextAction[] {
  const actions: NextAction[] = []

  if (options.score < 7 && options.onImproveAnswers) {
    actions.push({
      id: 'improve',
      label: 'Improve weak answers',
      onClick: options.onImproveAnswers,
      primary: true,
    })
  }

  actions.push({
    id: 'practice',
    label: 'Practice again',
    onClick: options.onPracticeAgain,
  })

  actions.push({
    id: 'tailor',
    label: 'Tailor CV',
    href: '/cv-builder-v2',
  })

  if (options.jobId) {
    actions.push({
      id: 'apply',
      label: 'Apply to this job',
      href: `/job-finder?jobId=${options.jobId}`,
    })
  }

  actions.push(
    { id: 'jobs', label: 'Find similar jobs', href: '/job-finder' },
    { id: 'cover', label: 'Create cover letter', href: '/cover-letter' },
    { id: 'plan', label: 'Continue Career Plan', href: '/career-hub' }
  )

  return actions
}
