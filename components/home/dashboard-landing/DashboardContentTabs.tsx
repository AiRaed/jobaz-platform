'use client'

import { cn } from '@/lib/utils'
import { SEARCH_MODES, type SearchMode } from './constants'

type Props = {
  value: SearchMode
  onChange: (mode: SearchMode) => void
}

export default function DashboardContentTabs({ value, onChange }: Props) {
  return (
    <div
      className={cn(
        'jobaz-card inline-flex w-full sm:w-auto max-w-full rounded-xl border p-1 gap-1 box-border',
        'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
      )}
      role="tablist"
      aria-label="Browse content"
    >
      {SEARCH_MODES.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'landing-content-tab flex-1 sm:flex-none rounded-lg px-2.5 sm:px-3 py-2 text-[11px] sm:text-sm font-medium transition-colors whitespace-nowrap',
              active
                ? 'landing-content-tab--active text-white shadow-[0_4px_12px_rgba(37,99,235,0.28)]'
                : 'text-[#475569] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
