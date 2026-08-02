'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { joinMultiSelectValue } from '@/lib/career-engine/experience-path/consultant/multiSelect'

type Option = { value: string; label: string }

type Props = {
  options: Option[]
  onConfirm: (value: string, displayLabel: string) => void
  disabled?: boolean
  variant?: 'chips' | 'cards'
  minSelections?: number
  maxSelections?: number
}

export default function CareerEngineMultiSelectChips({
  options,
  onConfirm,
  disabled,
  variant = 'chips',
  minSelections = 1,
  maxSelections,
}: Props) {
  const [selected, setSelected] = useState<Map<string, string>>(new Map())

  const toggle = (value: string, label: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(value)) {
        next.delete(value)
        return next
      }
      if (maxSelections != null && next.size >= maxSelections) return prev
      next.set(value, label)
      return next
    })
  }

  const canContinue = selected.size >= minSelections
  const atMax = maxSelections != null && selected.size >= maxSelections
  const displayLabel = [...selected.values()].join(' · ')

  const chipClass = (active: boolean) =>
    cn(
      'px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200',
      active
        ? 'border-violet-400/70 bg-violet-950/60 text-violet-100 shadow-[0_0_16px_rgba(139,92,246,0.25)]'
        : 'border-slate-600/40 bg-slate-900/70 text-slate-200 hover:border-violet-500/45 hover:bg-violet-950/40',
      disabled && 'opacity-40 pointer-events-none'
    )

  return (
    <div className="space-y-3">
      {maxSelections != null && (
        <p className="text-[11px] text-slate-500">
          {selected.size}/{maxSelections} selected
        </p>
      )}
      {variant === 'cards' ? (
        <div className="space-y-2">
          {options.map((opt) => {
            const active = selected.has(opt.value)
            const locked = !active && atMax
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled || locked}
                onClick={() => toggle(opt.value, opt.label)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200',
                  active
                    ? 'border-violet-400/60 bg-violet-950/40 text-violet-100'
                    : locked
                      ? 'border-slate-800/50 bg-slate-900/30 text-slate-500 cursor-not-allowed'
                      : 'border-slate-700/50 bg-slate-900/60 text-slate-200 hover:border-violet-500/40'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const active = selected.has(opt.value)
            const locked = !active && atMax
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled || locked}
                onClick={() => toggle(opt.value, opt.label)}
                className={cn(chipClass(active), locked && 'opacity-40 cursor-not-allowed')}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      <button
        type="button"
        disabled={disabled || !canContinue}
        onClick={() => onConfirm(joinMultiSelectValue([...selected.keys()]), displayLabel)}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
          canContinue
            ? 'bg-violet-600 hover:bg-violet-500 text-white'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        )}
      >
        Continue{selected.size > 0 ? ` (${selected.size} selected)` : ''}
      </button>
    </div>
  )
}
