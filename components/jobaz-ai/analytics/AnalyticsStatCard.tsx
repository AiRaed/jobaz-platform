import { cn } from '@/lib/utils'

type AnalyticsStatCardProps = {
  label: string
  value: string | number
  hint?: string
  className?: string
}

export default function AnalyticsStatCard({
  label,
  value,
  hint,
  className,
}: AnalyticsStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-800 bg-[#1a1a1a] p-5 shadow-lg',
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}
