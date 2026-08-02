'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  placeholder?: string
  onSubmit: (value: string) => void
  disabled?: boolean
  className?: string
}

export default function CareerEngineFreeTextInput({
  placeholder = 'Type your answer…',
  onSubmit,
  disabled,
  className,
}: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        placeholder={placeholder}
        className={cn(
          'flex-1 rounded-xl border border-slate-700/50 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100',
          'placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20'
        )}
      />
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={handleSubmit}
        className={cn(
          'inline-flex items-center justify-center w-11 h-11 rounded-xl border border-violet-500/30',
          'bg-violet-600/20 text-violet-200 hover:bg-violet-600/35 disabled:opacity-40'
        )}
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
