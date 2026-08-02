'use client'

import { MapPin } from 'lucide-react'
import type { CareerDestination } from '@/lib/dashboard/careerOs/types'

type Props = {
  destination: CareerDestination
  compact?: boolean
}

export default function CareerDestinationSection({ destination, compact }: Props) {
  return (
    <section
      className={
        compact
          ? 'rounded-xl border border-violet-500/20 bg-slate-950/60 p-4 h-full flex flex-col'
          : 'rounded-2xl border border-violet-500/25 bg-gradient-to-br from-slate-950 via-violet-950/15 to-slate-900/80 p-6 md:p-8'
      }
    >
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin className="w-3.5 h-3.5 text-violet-400" />
        <h3 className="text-sm font-semibold text-slate-100">Career Destination</h3>
      </div>

      <div className={compact ? 'space-y-2 flex-1' : 'space-y-4'}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <DestCell label="Current Route" value={destination.currentRoute} />
          <DestCell label="Target Role" value={destination.targetRole} highlight />
          <DestCell label="Next Role" value={destination.nextRole} />
          <DestCell label="Long-Term Path" value={destination.advancedPath} />
        </div>

        <div className="pt-2 border-t border-slate-800/60">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Career Progression</p>
          <div className="space-y-1.5">
            {destination.timeHorizons.map((h) => {
              const salary = destination.salarySteps.find((s) => s.label === h.period)?.amount
              return (
                <div key={`${h.label}-${h.period}`} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-500 shrink-0 w-20">{h.period}</span>
                  <span className="text-slate-200 font-medium text-right flex-1 truncate">{h.label}</span>
                  {salary && compact && (
                    <span className="text-emerald-400/90 shrink-0 tabular-nums">{salary}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function DestCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
      <p className={`truncate ${highlight ? 'text-violet-200 font-semibold' : 'text-slate-200'}`}>{value}</p>
    </div>
  )
}
