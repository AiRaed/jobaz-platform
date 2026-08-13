import { cn } from '@/lib/utils'

function norm(value: string): string {
  return value.trim().toLowerCase()
}

export function trackerBadgeClass(value: string): string {
  const v = norm(value)

  if (
    ['approved affiliate', 'approved', 'active', 'published', 'provider found', 'course ready', 'linked to published course'].includes(v) ||
    v.includes('ready to publish')
  ) {
    return 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
  }

  if (
    ['pending', 'applied', 'applied to provider', 'need follow-up', 'need custom link', 'draft'].includes(v)
  ) {
    return 'border-amber-500/40 bg-amber-950/35 text-amber-300'
  }

  if (['rejected', 'rejected provider', 'problem', 'not suitable'].includes(v)) {
    return 'border-red-500/40 bg-red-950/35 text-red-300'
  }

  if (['later', 'hidden'].includes(v)) {
    return 'border-slate-600/50 bg-slate-900/50 text-slate-500'
  }

  if (
    ['need provider', 'need check', 'unknown', 'idea', 'not published', 'not affiliate'].includes(v)
  ) {
    return 'border-slate-600/60 bg-slate-900/60 text-slate-400'
  }

  return 'border-slate-700/60 bg-slate-950/50 text-slate-300'
}

export function TrackerBadge({ value, className }: { value: string; className?: string }) {
  if (!value?.trim()) return <span className="text-slate-600">—</span>
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border whitespace-nowrap',
        trackerBadgeClass(value),
        className
      )}
    >
      {value}
    </span>
  )
}

export function RouteChips({ labels, max = 3 }: { labels: string[]; max?: number }) {
  if (!labels.length) return <span className="text-slate-600 text-[10px]">—</span>
  const shown = labels.slice(0, max)
  const rest = labels.length - shown.length

  return (
    <div className="flex flex-wrap gap-0.5">
      {shown.map((label) => (
        <span
          key={label}
          className="inline-flex rounded-full border border-violet-500/25 bg-violet-950/25 px-1.5 py-px text-[9px] text-violet-200 leading-tight"
        >
          {label}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex rounded-full border border-slate-700/60 px-1.5 py-px text-[9px] text-slate-500 leading-tight">
          +{rest} more
        </span>
      )}
    </div>
  )
}

export function ProviderChips({ names, max = 2 }: { names: string[]; max?: number }) {
  if (!names.length) return <span className="text-slate-600 text-[10px]">—</span>
  const shown = names.slice(0, max)
  const rest = names.length - shown.length

  return (
    <div className="flex flex-wrap gap-0.5">
      {shown.map((name) => (
        <span
          key={name}
          className="inline-flex rounded-full border border-cyan-500/25 bg-cyan-950/20 px-1.5 py-px text-[9px] text-cyan-200 leading-tight max-w-[120px] truncate"
          title={name}
        >
          {name}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex rounded-full border border-slate-700/60 px-1.5 py-px text-[9px] text-slate-500 leading-tight">
          +{rest} more
        </span>
      )}
    </div>
  )
}

export function VisibilityBadge({ value }: { value: string }) {
  const label =
    value === 'recommendation_only'
      ? 'Recommendation-only'
      : value === 'public_listed'
        ? 'Public listed'
        : value === 'internal'
          ? 'Internal'
          : value
  return <TrackerBadge value={label} />
}

export function CommercialStatusBadge({ value }: { value: string }) {
  const label =
    value === 'no_link'
      ? 'No link'
      : value === 'official_link'
        ? 'Official link'
        : value === 'affiliate_ready'
          ? 'Affiliate ready'
          : value
  return <TrackerBadge value={label} />
}

export function GoalChips({ labels, max = 2 }: { labels: string[]; max?: number }) {
  if (!labels.length) return <span className="text-slate-600 text-[10px]">—</span>
  const shown = labels.slice(0, max)
  const rest = labels.length - shown.length

  return (
    <div className="flex flex-wrap gap-0.5">
      {shown.map((label) => (
        <span
          key={label}
          className="inline-flex rounded-full border border-fuchsia-500/25 bg-fuchsia-950/20 px-1.5 py-px text-[9px] text-fuchsia-200 leading-tight max-w-[130px] truncate"
          title={label}
        >
          {label}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex rounded-full border border-slate-700/60 px-1.5 py-px text-[9px] text-slate-500 leading-tight">
          +{rest} more
        </span>
      )}
    </div>
  )
}

const WIE_BADGE_STYLES: Record<string, string> = {
  work_in_education_aligned: 'border-cyan-500/40 bg-cyan-950/35 text-cyan-200',
  not_for_work_in_education: 'border-slate-600/50 bg-slate-900/50 text-slate-400',
  needs_education_field_mapping: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  needs_specialism_mapping: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  needs_stage_mapping: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  possible_contamination_risk: 'border-rose-500/40 bg-rose-950/35 text-rose-200',
}

export function WieAlignmentBadges({
  badges,
  max = 2,
  generated,
}: {
  badges: string[]
  max?: number
  generated?: boolean
}) {
  const labels: Record<string, string> = {
    work_in_education_aligned: 'WIE aligned',
    not_for_work_in_education: 'Not for WIE',
    needs_education_field_mapping: 'Needs field',
    needs_specialism_mapping: 'Needs specialism',
    needs_stage_mapping: 'Needs stage',
    possible_contamination_risk: 'Contamination risk',
  }
  const extra = generated
    ? ['Generated WIE course type']
    : []
  const all = [...extra, ...badges]
  if (!all.length) return null
  const shown = all.slice(0, max)
  const rest = all.length - shown.length
  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {shown.map((b) => {
        const isGenerated = b === 'Generated WIE course type'
        return (
          <span
            key={b}
            className={cn(
              'inline-flex rounded-full border px-1.5 py-px text-[9px] leading-tight',
              isGenerated
                ? 'border-sky-500/40 bg-sky-950/35 text-sky-200'
                : WIE_BADGE_STYLES[b] ?? 'border-slate-700/60 text-slate-400'
            )}
            title={isGenerated ? b : labels[b] ?? b}
          >
            {isGenerated ? b : labels[b] ?? b}
          </span>
        )
      })}
      {rest > 0 ? (
        <span className="inline-flex rounded-full border border-slate-700/60 px-1.5 py-px text-[9px] text-slate-500">
          +{rest}
        </span>
      ) : null}
    </div>
  )
}
