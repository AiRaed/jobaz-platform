'use client'

import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useJobazTheme } from '@/contexts/JobazThemeContext'

type Props = {
  className?: string
  compact?: boolean
}

export default function JobazThemeToggle({ className, compact }: Props) {
  const { theme, setTheme, hydrated } = useJobazTheme()

  if (!hydrated) {
    return (
      <div
        className={cn('jobaz-theme-toggle jobaz-theme-toggle--skeleton', className)}
        aria-hidden
      />
    )
  }

  return (
    <div className={cn('jobaz-theme-toggle', className)} role="group" aria-label="Theme">
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={cn('jobaz-theme-toggle__btn', theme === 'dark' && 'jobaz-theme-toggle__btn--active')}
      >
        <Moon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Dark</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('day')}
        aria-pressed={theme === 'day'}
        className={cn('jobaz-theme-toggle__btn', theme === 'day' && 'jobaz-theme-toggle__btn--active')}
      >
        <Sun className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Day</span>
      </button>
    </div>
  )
}
