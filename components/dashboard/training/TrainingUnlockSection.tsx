'use client'

import { ArrowRight, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrainingUnlockOpportunity } from '@/lib/training/types'

type Props = {
  unlocks: TrainingUnlockOpportunity[]
}

export default function TrainingUnlockSection({ unlocks }: Props) {
  if (!unlocks.length) return null

  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2">
        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">Unlock More Opportunities</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {unlocks.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border px-3 py-2.5 flex items-center gap-2 text-xs',
              item.completed
                ? 'border-emerald-500/30 bg-emerald-950/15'
                : 'border-slate-700/50 bg-slate-900/30'
            )}
          >
            <div className="min-w-0 flex-1">
              <p className={cn('font-medium', item.completed ? 'text-emerald-200' : 'text-slate-200')}>
                {item.completed ? `✓ ${item.trainingName}` : `Complete ${item.trainingName}`}
              </p>
              <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                <ArrowRight className="w-3 h-3 shrink-0" />
                {item.unlocksRole}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
