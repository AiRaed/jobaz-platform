import type { FunnelStatRow } from '@/lib/jobaz-ai/analytics'
import { cn } from '@/lib/utils'

type FunnelCardProps = {
  steps: FunnelStatRow[]
  className?: string
}

export default function FunnelCard({ steps, className }: FunnelCardProps) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1)
  const hasData = steps.some((s) => s.count > 0)

  if (!hasData) {
    return (
      <p className="rounded-lg border border-dashed border-gray-700 bg-[#141414] px-4 py-8 text-center text-sm text-gray-500">
        No funnel data yet. Events will appear after users visit the AI Career Path.
      </p>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const widthPercent = Math.max((step.count / maxCount) * 100, 4)
        return (
          <div key={step.eventName}>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-gray-300">
                <span className="text-gray-500">{index + 1}.</span> {step.label}
              </span>
              <div className="flex items-center gap-3">
                {step.conversionFromPreviousPercent != null && (
                  <span className="text-xs text-violet-300/90 tabular-nums">
                    {step.conversionFromPreviousPercent}% conv.
                  </span>
                )}
                <span className="font-mono text-xs text-gray-500 hidden sm:inline">
                  {step.eventName}
                </span>
                <span className="font-semibold tabular-nums text-white">{step.count}</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9b5cff] to-[#7c3aed] transition-all"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
