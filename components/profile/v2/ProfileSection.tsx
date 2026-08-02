'use client'

import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  badge?: ReactNode
  children: ReactNode
}

export default function ProfileSection({ title, subtitle, badge, children }: Props) {
  return (
    <section className="rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] dark:border-violet-500/20 dark:bg-slate-950/60 p-5 md:p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--jaz-text)] dark:text-slate-100">{title}</h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  )
}
