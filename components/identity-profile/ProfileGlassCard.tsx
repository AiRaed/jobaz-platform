'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
  id?: string
}

export default function ProfileGlassCard({ title, subtitle, children, className, action, id }: Props) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-violet-500/20 bg-slate-950/50 backdrop-blur-md p-5 md:p-6',
        'shadow-[0_0_32px_rgba(88,28,135,0.08)] transition-all duration-300 hover:border-violet-500/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
