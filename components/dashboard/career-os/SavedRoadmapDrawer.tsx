'use client'

import { useMemo, useState } from 'react'
import { Bookmark, ChevronDown } from 'lucide-react'
import type { PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import { loadCareerPlanItems } from '@/lib/career-hub/myPlan'
import { loadSavedCourses } from '@/lib/career-hub/marketplace/savedPlan'
import {
  filterPlanItemsForCurrentRoute,
  filterSavedMarketForRoute,
} from '@/lib/dashboard/careerOs/myPlanDisplayFilter'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'
import { cn } from '@/lib/utils'

type Props = {
  ladder: PathPlanLadder | null | undefined
}

/** Compact collapsible saved/roadmap. Display only. */
export default function SavedRoadmapDrawer({ ladder }: Props) {
  const [open, setOpen] = useState(false)
  const muted = PLAN_SECTION_STYLES.muted

  const items = useMemo(() => {
    const plan = filterPlanItemsForCurrentRoute(loadCareerPlanItems(), ladder).filter((i) =>
      ['saved', 'in_progress', 'completed', 'interested'].includes(i.status)
    )
    const market = filterSavedMarketForRoute(loadSavedCourses(), ladder)
    return {
      plan,
      market,
      count: plan.length + market.length,
    }
  }, [ladder])

  if (items.count === 0) return null

  return (
    <section className={cn('rounded-xl border', muted.border, muted.panel)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition rounded-xl"
        aria-expanded={open}
      >
        <span className="text-sm text-slate-700 dark:text-slate-400 inline-flex items-center gap-2">
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-md border', muted.iconWrap)}>
            <Bookmark className={cn('h-3 w-3', muted.icon)} />
          </span>
          Saved / On your roadmap
          <span className="text-xs text-slate-500 dark:text-slate-600 tabular-nums">
            ({items.count})
          </span>
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-500 dark:text-slate-600 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <ul className="px-4 pb-3.5 space-y-1.5 border-t border-slate-200 dark:border-slate-800/50 pt-2.5">
          {items.plan.map((item) => (
            <li
              key={item.id}
              className="text-sm text-slate-400 flex items-center justify-between gap-2"
            >
              <span className="truncate">{item.courseName}</span>
              <span className="text-[10px] uppercase tracking-wide text-slate-600 shrink-0">
                {item.status.replace('_', ' ')}
              </span>
            </li>
          ))}
          {items.market.map((item) => (
            <li key={item.id} className="text-sm text-slate-400 truncate">
              {item.courseTitle}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
