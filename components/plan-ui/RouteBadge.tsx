'use client'

import { cn } from '@/lib/utils'
import { resolvePlanRouteVisual } from '@/lib/plan-ui/planVisualSystem'

type Props = {
  pathId?: string | null
  routeLabel?: string | null
  className?: string
  size?: 'sm' | 'md'
}

/** Small Lucide route badge for Assistant + My Plan. Display only. */
export default function RouteBadge({ pathId, routeLabel, className, size = 'sm' }: Props) {
  const visual = resolvePlanRouteVisual(pathId, routeLabel)
  const Icon = visual.Icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        visual.badgeClass,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
      {visual.label}
    </span>
  )
}
