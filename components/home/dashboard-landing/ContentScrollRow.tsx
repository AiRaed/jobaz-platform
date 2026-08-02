import Link from 'next/link'
import type { ReactNode } from 'react'
import { dashboardCardGap } from './layout'

type Props = {
  title: string
  viewAllHref: string
  children: ReactNode
}

export default function ContentScrollRow({ title, viewAllHref, children }: Props) {
  return (
    <section className="w-full max-w-none min-w-0 box-border">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--bg-primary)] transition shrink-0"
        >
          View all →
        </Link>
      </div>
      <div
        className={`flex ${dashboardCardGap} overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none w-full max-w-none min-w-0 box-border`}
      >
        {children}
      </div>
    </section>
  )
}
