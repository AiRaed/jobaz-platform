import { cn } from '@/lib/utils'

export function providerBadgeClass(value: string): string {
  const v = value.trim().toLowerCase()

  if (['active', 'approved', 'paid'].includes(v)) {
    return 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
  }
  if (['confirmed'].includes(v)) {
    return 'border-cyan-500/40 bg-cyan-950/35 text-cyan-300'
  }
  if (['pending', 'applied', 'need follow-up', 'paused'].includes(v)) {
    return 'border-amber-500/40 bg-amber-950/35 text-amber-300'
  }
  if (['rejected', 'problem', 'disputed', 'cancelled'].includes(v)) {
    return 'border-red-500/40 bg-red-950/35 text-red-300'
  }
  if (['later'].includes(v)) {
    return 'border-slate-600/50 bg-slate-900/50 text-slate-500'
  }
  if (['unknown', 'not affiliate', 'none'].includes(v)) {
    return 'border-slate-600/60 bg-slate-900/60 text-slate-400'
  }

  return 'border-violet-500/35 bg-violet-950/30 text-violet-200'
}

export function ProviderBadge({ value, className }: { value: string; className?: string }) {
  if (!value?.trim()) return <span className="text-slate-600">—</span>
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border whitespace-nowrap',
        providerBadgeClass(value),
        className
      )}
    >
      {value}
    </span>
  )
}

export function EstimatedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border border-violet-500/35 bg-violet-950/30 text-violet-200 whitespace-nowrap">
      Est. {label}
    </span>
  )
}
