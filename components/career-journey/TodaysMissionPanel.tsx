'use client'

import Link from 'next/link'
import { Check, Lock, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MissionItem } from '@/lib/career-journey/actionPlanTypes'

type Props = {
  missions: MissionItem[]
  className?: string
  /** Unlock missions one at a time as previous tasks complete. */
  sequential?: boolean
}

export default function TodaysMissionPanel({ missions, className, sequential }: Props) {
  const completed = missions.filter((m) => m.completed).length
  const total = missions.length
  const activeIndex = sequential
    ? missions.findIndex((m) => !m.completed && !m.locked)
    : -1

  return (
    <section
      className={cn(
        'rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-950/15 to-slate-950/60 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">Today&apos;s Mission</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-amber-300/90 tabular-nums font-semibold">
            {completed}/{total}
          </span>
        </div>
      </div>
      {sequential && total > 0 && (
        <p className="text-[10px] text-slate-500 mb-2">
          Complete each step to unlock the next — you&apos;re on step{' '}
          <span className="text-amber-300/90 font-semibold">
            {completed >= total ? total : completed + 1}/{total}
          </span>
          .
        </p>
      )}
      <ul className="space-y-2">
        {missions.map((mission, index) => {
          const hasTarget = typeof mission.target === 'number' && mission.target > 1
          const progressLabel =
            hasTarget && typeof mission.current === 'number'
              ? `${Math.min(mission.current, mission.target!)}/${mission.target}`
              : null
          const isLocked = mission.locked === true
          const isActive = sequential && index === activeIndex

          const rowClass = cn(
            'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition group',
            mission.completed
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
              : isLocked
                ? 'border-slate-800/60 bg-slate-950/30 text-slate-500 cursor-not-allowed opacity-60'
                : isActive
                  ? 'border-amber-500/40 bg-amber-950/15 text-slate-100 hover:border-amber-500/50'
                  : 'border-slate-700/50 bg-slate-900/40 text-slate-200 hover:border-amber-500/40 hover:bg-amber-950/10'
          )

          const inner = (
            <>
              <span
                className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition',
                  mission.completed
                    ? 'border-emerald-500/50 bg-emerald-500/25'
                    : isLocked
                      ? 'border-slate-700 bg-slate-950'
                      : 'border-slate-600 bg-slate-950 group-hover:border-amber-500/40'
                )}
                aria-hidden
              >
                {mission.completed ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : isLocked ? (
                  <Lock className="w-2.5 h-2.5 text-slate-600" />
                ) : (
                  <span className="text-[9px] font-bold text-amber-400/80 tabular-nums">{index + 1}</span>
                )}
              </span>
              <span className={cn('flex-1', mission.completed && 'line-through opacity-80')}>
                {mission.label}
              </span>
              {progressLabel && !mission.completed && !isLocked && (
                <span className="text-[10px] text-amber-400/90 tabular-nums font-medium">{progressLabel}</span>
              )}
              {isActive && !mission.completed && (
                <span className="text-[9px] uppercase tracking-wide text-amber-400/80 font-semibold">Active</span>
              )}
            </>
          )

          return (
            <li key={mission.id}>
              {isLocked ? (
                <div className={rowClass} aria-disabled="true">
                  {inner}
                </div>
              ) : (
                <Link href={mission.href} className={rowClass}>
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
