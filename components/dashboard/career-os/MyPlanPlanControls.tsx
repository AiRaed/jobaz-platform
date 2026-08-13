'use client'

import { Compass, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'
import ManagePlanDataControls from '@/components/dashboard/ManagePlanDataControls'

type Props = {
  onCvCleared?: () => void
  onPlanCleared?: () => void
  className?: string
  /** Compact empty-state variant */
  empty?: boolean
}

/**
 * Create New Plan (guided) + Reset Career Plan (destructive) side by side.
 * Saving a new CA plan replaces the active dashboard plan.
 */
export default function MyPlanPlanControls({
  onCvCleared,
  onPlanCleared,
  className,
  empty,
}: Props) {
  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'rounded-xl border border-cyan-500/25 bg-cyan-950/15 px-4 py-4',
          empty && 'border-dashed'
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-cyan-100">Create New Plan</p>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              Start Career Assistant again. When you save, the new plan replaces your current active
              plan on My Plan.
            </p>
          </div>
          <UkCareerAssistantLink
            href="/uk-career-assistant"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create New Plan
            <Compass className="h-3.5 w-3.5 opacity-80" aria-hidden />
          </UkCareerAssistantLink>
        </div>
      </div>

      <ManagePlanDataControls
        variant="panel"
        onCvCleared={onCvCleared}
        onPlanCleared={onPlanCleared}
      />
    </div>
  )
}
