'use client'

import { cn } from '@/lib/utils'
import {
  PLAN_SECTION_ICONS,
  PLAN_SECTION_STYLES,
  type PlanSectionAccent,
} from '@/lib/plan-ui/planVisualSystem'

type Props = {
  accent: PlanSectionAccent
  title: string
  subtitle?: string
  className?: string
  right?: React.ReactNode
}

/** Shared section title with icon + accent colour. Display only. */
export default function PlanSectionHeader({ accent, title, subtitle, className, right }: Props) {
  const styles = PLAN_SECTION_STYLES[accent]
  const Icon = PLAN_SECTION_ICONS[accent]

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0 flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
            styles.iconWrap
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', styles.icon)} aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className={cn('text-sm font-semibold leading-snug', styles.title)}>{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right}
    </div>
  )
}
