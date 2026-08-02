import { cn } from '@/lib/utils'

type Props = {
  variant?: 'page' | 'tool' | 'admin' | 'conversation'
  className?: string
}

/** Subtle shared skeleton for route-level loading.tsx files. */
export default function RouteLoadingSkeleton({ variant = 'page', className }: Props) {
  if (variant === 'conversation') {
    return (
      <div
        className={cn(
          'min-h-[50vh] max-w-3xl mx-auto px-4 py-8 space-y-4',
          className
        )}
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-5 w-40 rounded-lg bg-slate-800/50 animate-pulse" />
        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/50 p-4 space-y-3">
          <div className="h-4 w-[75%] rounded bg-slate-800/40 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-slate-800/30 animate-pulse" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl border border-slate-700/40 bg-slate-900/40 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'admin') {
    return (
      <div className={cn('max-w-6xl mx-auto px-4 py-8 space-y-6', className)} aria-busy="true">
        <div className="h-8 w-48 rounded-lg bg-slate-800/50 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-700/50 bg-slate-950/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-[40vh] max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10',
        className
      )}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 rounded-lg bg-slate-800/50 animate-pulse" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-slate-800/30 animate-pulse" />
      </div>
      <div
        className={cn(
          'grid gap-4',
          variant === 'tool' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-slate-700/50 bg-slate-950/50 animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
