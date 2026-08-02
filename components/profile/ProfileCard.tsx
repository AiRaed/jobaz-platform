'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
  glow?: 'violet' | 'cyan' | 'none'
}

export default function ProfileCard({
  title,
  subtitle,
  children,
  className,
  action,
  glow = 'none',
}: Props) {
  const glowClass =
    glow === 'violet'
      ? 'border-violet-500/20 shadow-[0_0_32px_rgba(88,28,135,0.1)]'
      : glow === 'cyan'
        ? 'border-cyan-500/20 shadow-[0_0_32px_rgba(6,182,212,0.08)]'
        : 'border-slate-700/50 shadow-[0_12px_32px_rgba(15,23,42,0.5)]'

  return (
    <section
      className={cn(
        'rounded-2xl border bg-slate-950/40 backdrop-blur-md p-5 md:p-6',
        'transition-all duration-300 hover:border-slate-600/60',
        glowClass,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
