'use client'

import { cn } from '@/lib/utils'

type Props = {
  name: string
  value: string
  label: string
  helpText?: string
  /** Optional small type label above the main title (e.g. "Job option"). */
  badge?: string
  selected: boolean
  onSelect: (value: string) => void
  /** Multi-select uses checkboxes */
  multi?: boolean
}

export function OptionCard({
  name,
  value,
  label,
  helpText,
  badge,
  selected,
  onSelect,
  multi = false,
}: Props) {
  const id = `${name}-${value}`
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition',
        'focus-within:ring-2 focus-within:ring-cyan-500/60 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950',
        selected
          ? 'border-cyan-400 bg-cyan-50 text-slate-900 dark:border-cyan-500/50 dark:bg-cyan-950/30 dark:text-slate-50'
          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-slate-500'
      )}
    >
      <input
        id={id}
        type={multi ? 'checkbox' : 'radio'}
        name={multi ? undefined : name}
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="mt-1 h-4 w-4 shrink-0 accent-cyan-500"
      />
      <span className="min-w-0">
        {badge ? (
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wider text-cyan-800 dark:text-cyan-300/80">
            {badge}
          </span>
        ) : null}
        <span className="block text-sm font-medium leading-snug">{label}</span>
        {helpText ? (
          <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">{helpText}</span>
        ) : null}
      </span>
    </label>
  )
}
