'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function IdentityCard({ title, subtitle, action, children, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] dark:border-violet-500/20 dark:bg-slate-950/60 p-4 md:p-5',
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-100">{title}</h2>
          {subtitle && (
            <p className="text-[11px] text-[var(--jaz-muted)] dark:text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function SnapshotTile({
  label,
  value,
  emptyHint,
}: {
  label: string
  value?: string | null
  emptyHint: string
}) {
  return (
    <div className="rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] dark:border-slate-700/50 dark:bg-slate-900/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-sm font-medium',
          value
            ? 'text-[var(--jaz-text)] dark:text-slate-100'
            : 'text-[var(--jaz-muted)] dark:text-slate-500 italic font-normal'
        )}
      >
        {value || emptyHint}
      </p>
    </div>
  )
}

export function ChipToggle({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
        active
          ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200'
          : 'border-[var(--jaz-border)] text-[var(--jaz-muted)] hover:border-violet-400/40 dark:border-slate-700 dark:text-slate-400',
        disabled && 'opacity-60 cursor-default'
      )}
    >
      {label}
    </button>
  )
}

export const fieldClass =
  'w-full rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface)] px-3 py-2 text-sm text-[var(--jaz-text)] placeholder:text-[var(--jaz-muted)] focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'

export const labelClass = 'block text-[11px] font-medium text-[var(--jaz-muted)] dark:text-slate-500 mb-1'
