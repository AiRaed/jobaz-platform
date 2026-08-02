import { cn } from '@/lib/utils'
import type { JobSource } from '@/lib/jobs/types'

type Props = {
  source?: JobSource
  featured?: boolean
  partnerCompany?: boolean
  className?: string
}

export default function JobSourceBadge({ source, featured, partnerCompany, className }: Props) {
  if (featured) {
    return (
      <span
        className={cn(
          'inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
          'border border-amber-500/40 bg-amber-950/40 text-amber-300',
          className
        )}
      >
        Featured
      </span>
    )
  }

  if (partnerCompany) {
    return (
      <span
        className={cn(
          'inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
          'border border-violet-500/40 bg-violet-950/40 text-violet-300',
          className
        )}
      >
        Partner
      </span>
    )
  }

  if (source === 'jobaz') {
    return (
      <span
        className={cn(
          'inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
          'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
          className
        )}
      >
        JobAZ
      </span>
    )
  }

  if (source === 'adzuna' || source === 'reed') {
    return (
      <span
        className={cn(
          'inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
          'border border-slate-600/50 bg-slate-900/60 text-slate-400',
          className
        )}
      >
        External
      </span>
    )
  }

  return null
}
