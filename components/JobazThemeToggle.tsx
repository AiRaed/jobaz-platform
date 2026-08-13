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
  const iconClass = compact ? 'w-3 h-3' : 'w-3.5 h-3.5'

  if (!hydrated) {
    return (
      <div
        className={cn(
          'jobaz-theme-toggle jobaz-theme-toggle--skeleton shrink-0',
          '!h-8 !w-8 sm:!h-9 sm:!w-24',
          className
        )}
        aria-hidden
      />
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'day' : 'dark')}
        aria-label={theme === 'dark' ? 'Switch to day theme' : 'Switch to dark theme'}
        className={cn('jobaz-theme-toggle shrink-0 sm:hidden !p-1.5', className)}
      >
        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <div
        className={cn('jobaz-theme-toggle hidden sm:inline-flex shrink-0', className)}
        role="group"
        aria-label="Theme"
      >
        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          className={cn(
            'jobaz-theme-toggle__btn',
            theme === 'dark' && 'jobaz-theme-toggle__btn--active'
          )}
        >
          <Moon className={iconClass} />
          <span className="hidden sm:inline">Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('day')}
          aria-pressed={theme === 'day'}
          className={cn(
            'jobaz-theme-toggle__btn',
            theme === 'day' && 'jobaz-theme-toggle__btn--active'
          )}
        >
          <Sun className={iconClass} />
          <span className="hidden sm:inline">Day</span>
        </button>
      </div>
    </>
  )
}
