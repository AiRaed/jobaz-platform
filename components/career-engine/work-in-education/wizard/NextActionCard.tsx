'use client'

import { cn } from '@/lib/utils'
import { nextActionTypeLabel } from '@/lib/career-engine/work-in-education/wizard'

type Props = {
  type: 'clarification' | 'registration' | 'recognition' | 'experience' | 'course' | 'review'
  text: string
  className?: string
}

export function NextActionCard({ type, text, className }: Props) {
  return (
    <article
      className={cn(
        'rounded-xl border border-cyan-800/40 bg-cyan-950/20 px-4 py-3',
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">
        {nextActionTypeLabel(type)}
      </p>
      <p className="mt-1 text-sm text-slate-100">{text}</p>
    </article>
  )
}
