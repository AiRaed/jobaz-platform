'use client'

import { cn } from '@/lib/utils'

type Props = {
  message: string
  tone?: 'info' | 'warning'
  className?: string
}

export function WarningCard({ message, tone = 'warning', className }: Props) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        tone === 'warning'
          ? 'border-amber-800/50 bg-amber-950/25 text-amber-100'
          : 'border-slate-700 bg-slate-900/60 text-slate-300',
        className
      )}
    >
      {message}
    </div>
  )
}
