'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function QuestionCard({ title, description, children, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-sm sm:p-6',
        className
      )}
      aria-labelledby="wizard-question-title"
    >
      <h2 id="wizard-question-title" className="text-lg font-semibold text-slate-50 sm:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
      ) : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}
