import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'jobaz-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] transition',
        'dark:border-slate-700/60 dark:bg-slate-950/60 dark:shadow-[0_18px_40px_rgba(15,23,42,0.85)]',
        hover &&
          'hover:border-blue-300/70 dark:hover:border-violet-400/60 dark:hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)]',
        className
      )}
    >
      {children}
    </div>
  )
}
