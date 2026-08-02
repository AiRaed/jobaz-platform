import { cn } from '@/lib/utils'
import type { OfferBadgeDisplay } from '@/lib/admin/courses/publicOffer'

type Props = {
  display: OfferBadgeDisplay
  className?: string
  size?: 'sm' | 'md'
}

/** Promotional discount badge — JobAZ partner offer, not AI styling. */
export default function CourseOfferBadge({ display, className, size = 'sm' }: Props) {
  return (
    <span
      className={cn(
        'inline-block rounded-lg border text-left backdrop-blur-sm',
        'border-emerald-400/60 bg-gradient-to-br from-emerald-500 via-emerald-400 to-cyan-400',
        'text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.35)]',
        size === 'sm' ? 'px-2 py-1 max-w-[7rem] sm:max-w-[6.25rem]' : 'px-2.5 py-1.5 max-w-[9.5rem]',
        className
      )}
      title={display.title}
    >
      {/* Mobile: single compact line */}
      <span
        className={cn(
          'block font-bold leading-tight sm:hidden',
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        )}
      >
        {display.compactLine}
      </span>

      {/* sm+: two-line promo badge */}
      <span className="hidden sm:flex flex-col leading-none gap-0.5">
        <span className={cn('font-bold tracking-tight', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
          {display.mainLine}
        </span>
        <span
          className={cn(
            'font-semibold uppercase tracking-wider text-slate-900/85',
            size === 'sm' ? 'text-[8px]' : 'text-[9px]'
          )}
        >
          {display.brandLine}
        </span>
      </span>
    </span>
  )
}
