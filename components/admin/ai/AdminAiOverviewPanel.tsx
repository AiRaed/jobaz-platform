'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ADMIN_AI_PRIORITY_GUIDE,
  NOT_WIRED_YET_MEANING,
} from '@/lib/admin/ai/priorityGuide'
import type { AdminAiOverview } from '@/lib/admin/ai/overview'

const CHECKLIST = [
  'Site Brain active',
  'AI Manager report generates',
  'Marketing AI generates copy',
  'AI Supervisor reviews sessions',
  'Affiliate Scout suggests provider gaps',
  'Technical Reports generate site health report',
  'Save as task works',
  'Admin Tasks board works',
  'No fake providers or guaranteed jobs',
  'No secret keys exposed',
  'Non-admin users blocked',
] as const

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-2.5" title={hint}>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-100 tabular-nums">{value}</p>
    </div>
  )
}

export default function AdminAiOverviewPanel() {
  const [overview, setOverview] = useState<AdminAiOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ai/overview')
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Failed to load overview')
        return
      }
      setOverview(data.overview)
    } catch {
      setError('Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const lastManager = overview?.lastManagerReportAt
    ? new Date(overview.lastManagerReportAt).toLocaleString()
    : 'None yet'

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-500/20 bg-slate-950/50 px-4 py-4 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Admin AI</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Admin AI helps you manage JobAZ as a solo founder. It reviews user journeys, technical
            health, course/provider gaps, marketing ideas and suggested tasks. AI suggests; you
            decide.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 animate-pulse">Loading overview…</p>
        ) : error ? (
          <p className="text-xs text-amber-200/90">{error}</p>
        ) : overview ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            <StatCard label="Last AI Manager report" value={lastManager} />
            <StatCard
              label="Open admin tasks"
              value={String(overview.openTasks)}
              hint="Tasks with status open"
            />
            <StatCard
              label="High priority tasks"
              value={String(overview.highPriorityTasks)}
              hint={ADMIN_AI_PRIORITY_GUIDE.High}
            />
            <StatCard
              label="Technical launch blockers"
              value={
                overview.technicalLaunchBlockers == null
                  ? 'Not wired yet'
                  : String(overview.technicalLaunchBlockers)
              }
              hint={overview.technicalLaunchBlockersHint}
            />
            <StatCard
              label="Missing provider gaps"
              value={
                overview.missingProviderGaps == null
                  ? 'Not wired yet'
                  : String(overview.missingProviderGaps)
              }
              hint={overview.missingProviderGapsHint}
            />
          </div>
        ) : null}

        {overview?.siteBrainNote ? (
          <p className="text-[11px] text-amber-200/80 rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2">
            Site Brain: {overview.siteBrainNote}
          </p>
        ) : overview ? (
          <p className="text-[11px] text-slate-500">
            Site Brain active (v{overview.siteBrainVersion}) · source {overview.siteBrainSource}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
          <span>
            <span className="text-rose-300/90">High</span> = {ADMIN_AI_PRIORITY_GUIDE.High}
          </span>
          <span>
            <span className="text-amber-300/90">Medium</span> = {ADMIN_AI_PRIORITY_GUIDE.Medium}
          </span>
          <span>
            <span className="text-slate-400">Low</span> = {ADMIN_AI_PRIORITY_GUIDE.Low}
          </span>
        </div>
        <p className="text-[10px] text-slate-600">{NOT_WIRED_YET_MEANING}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/admin/tasks"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            View Admin Tasks
          </Link>
          <button
            type="button"
            onClick={() => setChecklistOpen((v) => !v)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            {checklistOpen ? 'Hide' : 'Show'} Admin AI MVP checklist
          </button>
        </div>
      </div>

      {checklistOpen ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3">
          <p className="text-xs font-medium text-slate-300 mb-2">Admin AI MVP checklist</p>
          <ul className="space-y-1.5">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                <span
                  className={cn(
                    'mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded border',
                    overview?.siteBrainSource === 'database' && item === 'Site Brain active'
                      ? 'border-emerald-500/50 bg-emerald-500/20'
                      : 'border-slate-600'
                  )}
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-600 mt-2">
            Tick mentally as you verify — this is a founder checklist, not automated tests.
          </p>
        </div>
      ) : null}
    </div>
  )
}
