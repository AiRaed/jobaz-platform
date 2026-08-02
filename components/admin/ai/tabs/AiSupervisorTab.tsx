'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AdminAiDateRange } from '@/lib/admin/ai/dateRange'
import type {
  AdminAiPriority,
  SupervisorSessionRow,
  SupervisorSessionStatus,
} from '@/lib/admin/ai/types'
import {
  ActionButton,
  EmptyPanel,
  PriorityLegend,
  ReportPanel,
  SectionHeader,
  SiteBrainStatusLine,
  StatusBanner,
  type SiteBrainStatusMeta,
} from '../AdminAiShared'
import { cn } from '@/lib/utils'

const ACTIONS = [
  { mode: 'review', label: 'Review Last 20 Assistant Results', primary: true },
  { mode: 'weak', label: 'Find Weak Recommendations', primary: false },
  { mode: 'missing_courses', label: 'Find Missing Course Links', primary: false },
  { mode: 'risky', label: 'Find Risky / Overpromising Text', primary: false },
  { mode: 'route_mismatch', label: 'Find Route Mismatches', primary: false },
  { mode: 'stale_plan', label: 'Find Stale Plan Context', primary: false },
] as const

function qualityLabel(c: SupervisorSessionRow['qualityClassification']): string {
  const map: Record<SupervisorSessionRow['qualityClassification'], string> = {
    good: 'Good',
    needs_data: 'Needs data',
    needs_improvement: 'Needs improvement',
    risky: 'Risky',
    possible_test_old: 'Possible test/old data',
  }
  return map[c] || c
}

function qualityTone(c: SupervisorSessionRow['qualityClassification']) {
  if (c === 'good') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
  if (c === 'needs_data') return 'text-sky-200 border-sky-500/30 bg-sky-500/10'
  if (c === 'possible_test_old') return 'text-slate-400 border-slate-600 bg-slate-800/40'
  if (c === 'risky') return 'text-rose-200 border-rose-500/30 bg-rose-500/10'
  return 'text-amber-200 border-amber-500/30 bg-amber-500/10'
}
function statusTone(status: SupervisorSessionStatus) {
  if (status === 'complete') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
  if (status === 'test') return 'text-amber-200 border-amber-500/30 bg-amber-500/10'
  if (status === 'old') return 'text-slate-400 border-slate-600 bg-slate-800/40'
  if (status === 'possible_mismatch')
    return 'text-orange-200 border-orange-500/30 bg-orange-500/10'
  return 'text-rose-200 border-rose-500/30 bg-rose-500/10'
}

function statusLabel(status: SupervisorSessionStatus) {
  if (status === 'possible_mismatch') return 'possible mismatch'
  return status
}

function yn(v: boolean | null | undefined, wiredLabel = true): string {
  if (v == null) return wiredLabel ? 'not wired' : '—'
  return v ? 'yes' : 'no'
}

export default function AiSupervisorTab({ range }: { range: AdminAiDateRange }) {
  const [rows, setRows] = useState<SupervisorSessionRow[]>([])
  const [available, setAvailable] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [isTestColumnAvailable, setIsTestColumnAvailable] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [completeOnly, setCompleteOnly] = useState(true)
  const [includeOldTest, setIncludeOldTest] = useState(false)
  const [problemOnly, setProblemOnly] = useState(false)
  const [routeFilter, setRouteFilter] = useState('')
  const [markingId, setMarkingId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<AdminAiPriority | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedBanner, setSavedBanner] = useState<string | null>(null)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [siteBrain, setSiteBrain] = useState<SiteBrainStatusMeta | null>(null)

  const load = useCallback(async () => {
    setLoadingList(true)
    try {
      const params = new URLSearchParams({
        kind: 'supervisor',
        range,
        completeOnly: completeOnly && !problemOnly ? '1' : '0',
        includeTest: includeOldTest ? '1' : '0',
        problemOnly: problemOnly ? '1' : '0',
      })
      if (routeFilter.trim()) params.set('route', routeFilter.trim())
      const res = await fetch(`/api/admin/ai/metrics?${params}`)
      const data = await res.json()
      if (data.ok) {
        setRows(data.sessions?.rows || [])
        setAvailable(Boolean(data.sessions?.available))
        setMessage(data.sessions?.message)
        setIsTestColumnAvailable(Boolean(data.sessions?.isTestColumnAvailable))
      }
    } finally {
      setLoadingList(false)
    }
  }, [range, completeOnly, includeOldTest, problemOnly, routeFilter])

  useEffect(() => {
    void load()
  }, [load])

  const markTest = async (id: string, isTest: boolean) => {
    setMarkingId(id)
    try {
      const res = await fetch('/api/admin/ai/mark-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isTest }),
      })
      const data = await res.json()
      if (!data.ok) {
        setMessage(data.error || 'Failed to mark test')
        return
      }
      void load()
    } finally {
      setMarkingId(null)
    }
  }

  const generate = async (mode: string) => {
    setLoading(true)
    setError(null)
    setSavedBanner(null)
    setPersistError(null)
    try {
      const res = await fetch('/api/admin/ai/supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, range }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Generation failed')
        setMarkdown('')
        return
      }
      setTitle(data.title || 'AI Supervisor Report')
      setMarkdown(data.markdown || '')
      setPriority(data.priority || 'Medium')
      setReportId(data.reportId || null)
      setPersistError(data.persistError || null)
      if (data.siteBrain) setSiteBrain(data.siteBrain)
      if (data.reportId) {
        setSavedBanner('Saved to admin_ai_reports')
      }
    } catch {
      setError('Generation failed')
      setMarkdown('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="AI Supervisor"
        purpose="Review Career Assistant sessions for goal match, route awareness, courses, safety, and stale plan context. Admin AI suggests; you decide."
        note="Uses anonymised session IDs only. Needs data = fields not wired; Needs improvement = data available and clearly weak."
      />
      <SiteBrainStatusLine override={siteBrain} />
      <PriorityLegend />

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={completeOnly}
            onChange={(e) => setCompleteOnly(e.target.checked)}
            disabled={problemOnly}
            className="rounded border-slate-600"
          />
          Complete only
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeOldTest}
            onChange={(e) => setIncludeOldTest(e.target.checked)}
            className="rounded border-slate-600"
          />
          Include old/test data
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={problemOnly}
            onChange={(e) => setProblemOnly(e.target.checked)}
            className="rounded border-slate-600"
          />
          Problem sessions only
        </label>
        <label className="inline-flex items-center gap-2">
          Route
          <input
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            placeholder="Filter route…"
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 w-36"
          />
        </label>
        <ActionButton variant="secondary" onClick={() => void load()} disabled={loadingList}>
          Refresh
        </ActionButton>
      </div>

      {message ? (
        <p className="text-xs text-amber-200/80 rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2">
          {message}
        </p>
      ) : null}

      {loadingList ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading sessions…</p>
      ) : !available ? (
        <EmptyPanel>{message || 'No assistant session data available yet.'}</EmptyPanel>
      ) : rows.length === 0 ? (
        <EmptyPanel>
          No sessions match the current filters for this period. Try All time or Include old/test
          data.
        </EmptyPanel>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Goal</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Current target</th>
                <th className="px-3 py-2 font-medium">Next upgrade</th>
                <th className="px-3 py-2 font-medium">Saved to plan</th>
                <th className="px-3 py-2 font-medium">Recommended course</th>
                <th className="px-3 py-2 font-medium">Published course</th>
                <th className="px-3 py-2 font-medium">Apply click</th>
                <th className="px-3 py-2 font-medium">Quality</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Supervisor flag</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 text-slate-300">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(r.date).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 max-w-[8rem] truncate" title={r.goal}>
                    {r.goal}
                  </td>
                  <td className="px-3 py-2 max-w-[9rem] truncate" title={r.route}>
                    {r.route}
                  </td>
                  <td className="px-3 py-2 max-w-[9rem] truncate" title={r.currentTarget}>
                    {r.currentTarget}
                  </td>
                  <td className="px-3 py-2 max-w-[9rem] truncate" title={r.nextUpgrade}>
                    {r.nextUpgrade}
                  </td>
                  <td className="px-3 py-2">{r.savedPlan ? 'yes' : 'no'}</td>
                  <td className="px-3 py-2 max-w-[10rem] truncate" title={r.recommendedCourse}>
                    {r.recommendedCourse}
                  </td>
                  <td className="px-3 py-2">{yn(r.publishedCourseUsed)}</td>
                  <td className="px-3 py-2">{yn(r.applyClick)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap',
                        qualityTone(r.qualityClassification)
                      )}
                    >
                      {qualityLabel(r.qualityClassification)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize whitespace-nowrap',
                        statusTone(r.status)
                      )}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2 max-w-[12rem] truncate text-orange-200/90"
                    title={r.supervisorFlag || ''}
                  >
                    {r.supervisorFlag || '—'}
                  </td>
                  <td className="px-3 py-2">
                    {isTestColumnAvailable ? (
                      <button
                        type="button"
                        disabled={markingId === r.id}
                        onClick={() => void markTest(r.id, !r.isTest)}
                        className="text-[11px] text-violet-300 hover:underline disabled:opacity-50"
                      >
                        {markingId === r.id
                          ? '…'
                          : r.isTest
                            ? 'Unmark test'
                            : 'Mark as test'}
                      </button>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <ActionButton
            key={a.mode}
            variant={a.primary ? 'primary' : 'secondary'}
            disabled={loading}
            onClick={() => void generate(a.mode)}
          >
            {loading ? 'Generating…' : a.label}
          </ActionButton>
        ))}
        <Link
          href="/admin/tasks"
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
        >
          View Admin Tasks
        </Link>
      </div>

      <StatusBanner message={savedBanner} tone="emerald" />

      <ReportPanel
        title={title}
        markdown={markdown}
        priority={priority}
        reportId={reportId}
        error={error}
        loading={loading}
        persistError={persistError}
        enableSaveAsTask
        source="ai_supervisor"
      />
    </div>
  )
}
